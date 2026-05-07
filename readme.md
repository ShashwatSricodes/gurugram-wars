# ⬡ Gurugram Territory Wars

A real-time multiplayer territory capture game built on a live map of Gurugram. Players compete to capture hexagonal territories across real Gurugram neighborhoods — Cyber City, DLF phases, Golf Course Road, Sohna Road — and fight for dominance on a live leaderboard.

![Tech Stack](https://img.shields.io/badge/stack-MERN-green) ![Real-time](https://img.shields.io/badge/realtime-Socket.io-blue) ![Map](https://img.shields.io/badge/map-Leaflet%20%2B%20H3-orange)

---

##  What It Looks Like

- Dark map of Gurugram with colored hexagonal territories overlaid
- Top bar showing live online count, total hexes captured, and your stats
- Right panel with a searchable live leaderboard
- Hexes light up in your color when you capture them
- Everyone sees all captures happen instantly in real-time

---

##  How to Play

1. Open the app and enter your name + pick a color
2. You land on a dark map of Gurugram covered in hexagonal tiles
3. **Left click** any unclaimed hex to capture it — it turns your color
4. **Right click** one of your own hexes to unclaim it and free it up
5. You have a **3 second cooldown** between captures
6. You **cannot** capture hexes already owned by other players
7. Watch the leaderboard update in real-time as everyone plays
8. Dominate as many neighborhoods as possible!

> Open the app in multiple browser tabs or share the link with friends to play together.

---

##  Features

### Core Gameplay
- **Real-time multiplayer** — all captures broadcast instantly to every connected player via WebSockets
- **Hex territory grid** — ~150 H3 hexagons at resolution 7 covering the entire Gurugram city boundary
- **Ownership system** — each hex tracks its owner, name, color, and capture time
- **Cooldown** — 3 second server-enforced cooldown between captures (client mirrors this with a progress bar)
- **Unclaim** — right-click your own hex to release it back to unclaimed

### Real-time Infrastructure
- Socket.io bidirectional communication
- Server broadcasts `cell:update` to all clients on every capture
- New players receive full current grid state on join via `grid:state`
- Online player count updates on every join/disconnect
- Leaderboard recomputes and broadcasts after every capture

### Anti-cheat & Conflict Resolution
- Cooldown enforced **server-side** — client UI cannot bypass it
- Capturing others territory blocked **on both client and server**
- Atomic MongoDB upsert — only succeeds if `ownerId` is null, eliminating race conditions when two players click the same hex simultaneously
- Duplicate key errors (extreme race edge case) caught and handled gracefully

### UI
- Dark CartoDB map tiles matching the startup arena aesthetic
- Hex tooltip on hover showing owner name and capture hint
- `not-allowed` cursor on hexes owned by others
- Live cooldown progress bar in the top bar
- Searchable leaderboard panel showing rank, color, name, score, and % of map owned
- Toast notifications for captures and errors
- User setup modal with color picker

---

##  Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React)                       │
│                                                          │
│  Leaflet Map + H3 Hexagons                               │
│       ↓ click                                            │
│  socket.emit('cell:capture', { cellId })                 │
│       ↑ socket.on('cell:update')                         │
│  Zustand Store (cells Map, user, leaderboard)            │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket (Socket.io)
┌──────────────────────▼──────────────────────────────────┐
│                     SERVER (Node.js)                     │
│                                                          │
│  gridHandler.js                                          │
│    → Validate cooldown (in-memory Map)                   │
│    → Atomic MongoDB upsert (ownerId: null check)         │
│    → io.emit('cell:update') to all clients               │
│    → Recompute leaderboard via aggregation               │
│    → io.emit('leaderboard:update') to all clients        │
└──────────────────────┬──────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼──────────────────────────────────┐
│                    MongoDB                               │
│                                                          │
│  cells collection                                        │
│    { cellId, ownerId, ownerName, ownerColor, capturedAt} │
│                                                          │
│  users collection                                        │
│    { userId, name, color, lastSeen }                     │
└─────────────────────────────────────────────────────────┘
```

### Real-time Event Flow

| Event | Direction | Description |
|---|---|---|
| `user:join` | Client → Server | Player joins with userId, name, color |
| `grid:state` | Server → Client | Full current grid sent to joining player only |
| `users:online` | Server → All | Updated online count on join/disconnect |
| `cell:capture` | Client → Server | Player clicks a hex |
| `cell:update` | Server → All | Broadcast updated cell to everyone |
| `cell:error` | Server → Client | Cooldown or ownership violation |
| `cell:unclaim` | Client → Server | Player right-clicks their own hex |
| `cell:removed` | Server → All | Broadcast unclaimed cell to everyone |
| `leaderboard:update` | Server → All | Fresh leaderboard after every capture |

---

##  Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR, modern JSX, lightweight |
| **Map** | Leaflet.js | Battle-tested, great polygon API |
| **Hex Grid** | Uber H3 (h3-js) | Globally unique cell IDs, perfect tiling, geo-aware |
| **State** | Zustand | O(1) cell lookups, no boilerplate |
| **Real-time** | Socket.io | Reliable WebSocket with polling fallback |
| **Backend** | Node.js + Express | Simple, non-blocking, great Socket.io support |
| **Database** | MongoDB + Mongoose | Flexible schema, atomic upserts, aggregation pipeline |
| **Map Tiles** | CartoDB Dark Matter | Free, dark aesthetic, no API key needed |

### Why H3 over a plain grid?

H3 is Uber's hexagonal hierarchical geospatial indexing system. Each hex has a globally unique string ID derived from its geography — no row/col mapping needed. At resolution 7, each hex covers ~0.5km² which maps perfectly to Gurugram neighborhoods. The IDs are stable, hashable, and work directly as MongoDB document IDs.

### Why Zustand over Redux?

The cells state is a flat `{ cellId: cellData }` map. Zustand lets us update a single cell in one line without action creators, reducers, or selectors boilerplate. With 150+ hexes updating in real-time, the O(1) map lookup also keeps re-renders minimal.

### Why atomic upsert for conflict resolution?

Instead of `findOne` then `findOneAndUpdate` — two round trips with a race condition window — we use a single `findOneAndUpdate` with the filter `{ cellId, ownerId: null }`. MongoDB only applies the update if both conditions match atomically. If two players click the same unclaimed hex at the exact same millisecond, one wins and one gets a duplicate key error — caught and returned as a friendly error message.

---

##  Project Structure

```
gurugram-wars/
├── server/
│   ├── src/
│   │   ├── index.js              # Express + Socket.io entry point
│   │   ├── config/
│   │   │   └── db.js             # MongoDB connection
│   │   ├── models/
│   │   │   ├── Cell.js           # Hex cell schema
│   │   │   └── User.js           # Player schema
│   │   ├── socket/
│   │   │   └── gridHandler.js    # All real-time logic
│   │   └── routes/
│   │       ├── grid.js           # GET /api/grid
│   │       └── leaderboard.js    # GET /api/leaderboard
│   ├── .env
│   └── package.json
│
└── client/
    ├── src/
    │   ├── App.jsx
    │   ├── socket.js             # Socket.io singleton
    │   ├── components/
    │   │   ├── Map/TerritoryMap.jsx      # Leaflet map + hex polygons
    │   │   ├── HUD/HUD.jsx               # Top bar stats + cooldown
    │   │   ├── Leaderboard/Leaderboard.jsx
    │   │   ├── Toast/Toast.jsx           # Capture notifications
    │   │   └── UserSetup/UserSetup.jsx   # Name + color picker
    │   ├── hooks/
    │   │   ├── useSocket.js      # All socket event listeners
    │   │   └── useCooldown.js    # Cooldown timer
    │   ├── store/
    │   │   └── gridStore.js      # Zustand global state
    │   └── utils/
    │       ├── h3Utils.js        # H3 cell generation + boundaries
    │       └── colors.js         # Player color palette
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

##  Running Locally

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/gurugram-wars.git
cd gurugram-wars
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
# Server running on http://localhost:4000
```

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
# App running on http://localhost:5173
```

### 4. Test multiplayer locally

Open `http://localhost:5173` in **2-3 browser tabs**. Each tab is a separate player. Enter different names and colors, then start capturing hexes — all tabs update instantly.

### Environment Variables (server/.env)

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/gurugram-wars
CLIENT_URL=http://localhost:5173
COOLDOWN_MS=3000
H3_RESOLUTION=8
```

---

##  Deployment (Render + MongoDB Atlas)

### MongoDB Atlas (free)
1. Create account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Add a database user with password
4. Set network access to `0.0.0.0/0`
5. Copy the connection string

### Server — Render Web Service

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |

Environment variables:
```
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://your-client.onrender.com
COOLDOWN_MS=3000
```

### Client — Render Static Site

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Build Command | `npm ci && ./node_modules/.bin/vite build` |
| Publish Directory | `dist` |

Environment variables:
```
VITE_SERVER_URL=https://your-server.onrender.com
```

### Update socket.js for production

```js
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
const socket = io(SERVER_URL, { ... });
```

---

##  Map Coverage

The game covers **Gurugram city** using this bounding box:

```
North: 28.54  South: 28.35
West:  76.95  East:  77.20
```

At **H3 resolution 7** (~0.5km² per hex), this generates ~150 hexagons covering:
- Cyber City / DLF Cyber Hub
- DLF Phase 1–5
- Golf Course Road
- MG Road / IFFCO Chowk
- Sohna Road
- Udyog Vihar
- NH-48 corridor

---

## 🔧 Configuration

| Variable | Default | Description |
|---|---|---|
| `COOLDOWN_MS` | `3000` | Milliseconds between captures per player |
| `H3_RESOLUTION` | `7` | Hex size (6=very large, 9=very small) |
| `MONGODB_URI` | localhost | MongoDB connection string |
| `CLIENT_URL` | localhost:5173 | Allowed CORS origin |

---

##  Design Decisions & Trade-offs

**Cooldown in-memory vs database**
Cooldowns are stored in a `Map` on the server process, not MongoDB. This means cooldowns reset if the server restarts, but it is zero-latency and avoids a DB read on every capture attempt. For a game this is the right trade-off.

**No recapture of enemy territory**
Currently you cannot capture someone else's hex — only unclaimed ones. This keeps the game strategic (placement matters) and avoids chaotic back-and-forth. Recapture mechanics could be added as a future feature with its own cooldown and rules.

**Leaderboard from Cell aggregation**
Rather than maintaining a score counter on the User model (which can drift out of sync), the leaderboard aggregates directly from the cells collection — counting cells per ownerId. This is always accurate, self-healing, and works correctly even if the server crashes mid-operation.

**Session-based userId**
Each browser session gets a fresh `uuidv4()` — not stored in localStorage. This means multiple tabs in the same browser are treated as separate players (correct for testing multiplayer), but refreshing the page loses your territory. For a production game you would use authentication or at minimum `sessionStorage`.

---

## 📄 License

MIT
