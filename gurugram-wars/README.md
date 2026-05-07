# ⬡ Gurugram Territory Wars

Real-time hex territory capture game on a live Gurugram map.

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`)

## Quick Start

### Terminal 1 — Backend
```bash
cd server
npm install
npm run dev
```

### Terminal 2 — Frontend
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in multiple browser tabs to test real-time multiplayer.

---

## How to Play

1. Enter your name and pick a color
2. Click any hex on the Gurugram map to capture it
3. You have a **3 second cooldown** between captures (enforced server-side)
4. Watch others capture hexes in real-time
5. Dominate the leaderboard!

---

## Architecture

```
client (React + Vite)
  ├── Leaflet.js         → Map rendering (CartoDB Dark Matter tiles)
  ├── h3-js              → H3 hexagon generation over Gurugram bbox
  ├── Socket.io client   → Real-time capture/update events
  └── Zustand            → Global state (cells map, user, leaderboard)

server (Node.js + Express)
  ├── Socket.io          → Bidirectional real-time communication
  ├── gridHandler.js     → Cooldown enforcement, atomic captures, broadcast
  └── MongoDB/Mongoose   → Persistent cell ownership + user scores

Real-time flow:
  User clicks hex
    → socket.emit('cell:capture', { cellId })
    → Server validates cooldown (in-memory Map)
    → MongoDB atomic upsert (no race conditions)
    → io.emit('cell:update', cell)  ← broadcasts to ALL clients
    → io.emit('leaderboard:update') ← fresh scores
```

## Stack

| Layer      | Tech                        |
|------------|-----------------------------|
| Frontend   | React 18 + Vite             |
| Map        | Leaflet.js + CartoDB tiles  |
| Hexagons   | Uber H3 (resolution 8)      |
| State      | Zustand                     |
| Real-time  | Socket.io (WebSocket)       |
| Backend    | Node.js + Express           |
| Database   | MongoDB + Mongoose          |

## H3 Resolution

Resolution 8 → ~200 hexagons over Gurugram bounding box  
Each hex ≈ 0.7km² (neighborhood scale — perfect for territory games)
