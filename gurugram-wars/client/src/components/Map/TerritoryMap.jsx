import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { getGurugramCells, getHexBoundary } from '../../utils/h3Utils';
import { useGridStore } from '../../store/gridStore';
import { useCooldown } from '../../hooks/useCooldown';
import socket from '../../socket';
import './TerritoryMap.css';

const GURUGRAM_CENTER = [28.4595, 77.0266];
const ALL_CELLS = getGurugramCells();

export const TerritoryMap = () => {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const layersRef   = useRef({});
  const cellsRef    = useRef({});
  const userRef     = useRef(null);
  const cooldownRef = useRef(false);

  const cells  = useGridStore(s => s.cells);
  const user   = useGridStore(s => s.user);
  const { isOnCooldown } = useCooldown();

  useEffect(() => { cellsRef.current    = cells;        }, [cells]);
  useEffect(() => { userRef.current     = user;         }, [user]);
  useEffect(() => { cooldownRef.current = isOnCooldown; }, [isOnCooldown]);

  const getStyle = useCallback((cellId, hovered = false) => {
    const cell = cellsRef.current[cellId];
    const isMe = cell?.ownerId === userRef.current?.userId;

    if (!cell || !cell.ownerId) {
      return {
        fillColor:   '#1a1a2e',
        fillOpacity: hovered ? 0.55 : 0.2,
        color:       hovered ? '#5a5a8a' : '#2a2a45',
        weight:      hovered ? 1.5 : 0.8,
      };
    }

    return {
      fillColor:   cell.ownerColor,
      fillOpacity: isMe ? 0.8 : (hovered ? 0.65 : 0.5),
      color:       isMe ? '#ffffff' : cell.ownerColor,
      weight:      isMe ? 2.5 : (hovered ? 1.5 : 1),
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center:             GURUGRAM_CENTER,
      zoom:               11,
      zoomControl:        true,
      attributionControl: true,
      preferCanvas:       false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains:  'abcd',
        maxZoom:     19,
      }
    ).addTo(map);

    mapInstance.current = map;

    ALL_CELLS.forEach(cellId => {
      const boundary = getHexBoundary(cellId);

      const polygon = L.polygon(boundary, {
        ...getStyle(cellId),
        interactive: true,
        className:   'hex-cell',
      });

      polygon.on('mouseover', function () {
        this.setStyle(getStyle(cellId, true));
        this.bringToFront();

        const cell        = cellsRef.current[cellId];
        const currentUser = userRef.current;
        const isMe        = cell?.ownerId === currentUser?.userId;

        let tipContent;
        if (!cell?.ownerId) {
          tipContent = `<div class="hex-tip"><span class="tip-empty">Click to capture</span></div>`;
        } else if (isMe) {
          tipContent = `<div class="hex-tip">
            <span style="background:${cell.ownerColor}" class="tip-dot"></span>
            <strong>${cell.ownerName}</strong>
            <span class="tip-yours">· Right-click to unclaim</span>
          </div>`;
        } else {
          tipContent = `<div class="hex-tip">
            <span style="background:${cell.ownerColor}" class="tip-dot"></span>
            <strong>${cell.ownerName}</strong>
            <span class="tip-taken">· Already claimed</span>
          </div>`;
        }

        this.bindTooltip(tipContent, {
          sticky:    true,
          className: 'hex-tooltip',
          offset:    [0, -4],
        }).openTooltip();
      });

      polygon.on('mouseout', function () {
        this.setStyle(getStyle(cellId, false));
        this.closeTooltip();
      });

      // Left click — capture only if unclaimed
      polygon.on('click', () => {
        const currentUser = userRef.current;
        if (!currentUser || cooldownRef.current) return;

        const cell = cellsRef.current[cellId];

        // Already owned by someone else — hard block on client
        if (cell?.ownerId && cell.ownerId !== currentUser.userId) return;

        // Your own hex — nothing to do
        if (cell?.ownerId && cell.ownerId === currentUser.userId) return;

        // Only unclaimed hexes reach the server
        socket.emit('cell:capture', { cellId });
      });

      // Right click — unclaim your own hex
      polygon.on('contextmenu', (e) => {
        L.DomEvent.preventDefault(e);
        const currentUser = userRef.current;
        if (!currentUser) return;
        const cell = cellsRef.current[cellId];
        if (cell?.ownerId === currentUser.userId) {
          socket.emit('cell:unclaim', { cellId });
        }
      });

      polygon.addTo(map);
      layersRef.current[cellId] = polygon;
    });

    return () => {
      map.remove();
      mapInstance.current = null;
      layersRef.current   = {};
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    Object.entries(layersRef.current).forEach(([cellId, polygon]) => {
      polygon.setStyle(getStyle(cellId, false));
    });
  }, [cells, getStyle]);

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />
      {isOnCooldown && (
        <div className="map-overlay-msg">⏱ Cooldown active...</div>
      )}
      <div className="map-hint">
        Left click to capture · Right click your hex to unclaim
      </div>
    </div>
  );
};