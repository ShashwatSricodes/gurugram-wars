import { polygonToCells, cellToLatLng, cellToBoundary } from 'h3-js';

export const H3_RESOLUTION = 8;

// Gurugram bounding polygon [lat, lng] pairs
export const GURUGRAM_POLYGON = [
  [28.5200, 76.9800],
  [28.5200, 77.1500],
  [28.3800, 77.1500],
  [28.3800, 76.9800],
];

export const getGurugramCells = () =>
  polygonToCells(GURUGRAM_POLYGON, H3_RESOLUTION);

export const getHexBoundary = (cellId) =>
  cellToBoundary(cellId); // [[lat,lng], ...]

export const getHexCenter = (cellId) =>
  cellToLatLng(cellId); // [lat, lng]
