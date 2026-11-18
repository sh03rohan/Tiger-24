// Tiger 24 co-op relay: a tiny presence server for running multiplayer outside claude.ai.
// Every connected page gets a peer id; pages join named rooms and publish one presence object each;
// the relay forwards presence changes to everyone in the same room. No game logic runs here: the host's page is authoritative.
//   npm install        (once, inside this folder)
//   node relay.mjs     (PORT env var, default 8787)
// Then open the game with ?relay=wss://<relay-host> (or ws://<ip>:8787 on a LAN), or set the <meta name="t24-relay"> tag in game/index.html.
// Plain HTTP GET / or /health answers 200 so cloud hosts (Render, Railway, Fly.io) can health-check it.
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const PORT = +process.env.PORT || 8787;
const MAX_PRESENCE = 6 * 1024;           // bytes of JSON per presence object
const MAX_ROOMS_PER_PEER = 4;
const rooms = new Map();                  // name -> Map(peer -> { ws, presence })
let peers = 0;

const http = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(`Tiger 24 relay OK · ${peers} connected · ${rooms.size} rooms\n`);
});
const wss = new WebSocketServer({ server: http, maxPayload: 16 * 1024 });

const send = (ws, m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
function leave(peer, name) {
  const r = rooms.get(name); if (!r || !r.has(peer)) return; r.delete(peer);
  for (const { ws } of r.values()) send(ws, { t: 'left', room: name, peer });
  if (!r.size) rooms.delete(name);
}

wss.on('connection', ws => {
  const peer = randomBytes(8).toString('hex'); const joined = new Set(); peers++;
  let budget = 60, last = Date.now();       // simple rate limit: ~60 messages per second
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  send(ws, { t: 'hello', peer });
  ws.on('message', raw => {
    const now = Date.now(); budget = Math.min(120, budget + (now - last) * 0.06); last = now; if (budget < 1) return; budget--;
    let m; try { m = JSON.parse(raw); } catch { return; }
    const name = typeof m.room === 'string' && /^[a-z0-9._-]{0,48}$/.test(m.room) ? m.room : null; if (name === null) return;
    if (m.t === 'join') {
      if (!joined.has(name) && joined.size >= MAX_ROOMS_PER_PEER + 1) return;
      let r = rooms.get(name); if (!r) rooms.set(name, r = new Map());
      if (!r.has(peer)) r.set(peer, { ws, presence: {} }); joined.add(name);
      send(ws, { t: 'state', room: name, peers: [...r.entries()].filter(([p]) => p !== peer).map(([p, v]) => ({ peer: p, presence: v.presence })) });
      for (const [p, v] of r) if (p !== peer) send(v.ws, { t: 'pres', room: name, peer, presence: {} });
    } else if (m.t === 'pres') {
      const r = rooms.get(name); const me = r && r.get(peer); if (!me) return;
      const presence = m.presence && typeof m.presence === 'object' ? m.presence : {};
      if (JSON.stringify(presence).length > MAX_PRESENCE) return;
      me.presence = presence; for (const [p, v] of r) if (p !== peer) send(v.ws, { t: 'pres', room: name, peer, presence });
    } else if (m.t === 'leave') { leave(peer, name); joined.delete(name); }
  });
  ws.on('close', () => { peers--; for (const name of joined) leave(peer, name); });
});

// drop dead connections and keep proxies from closing idle ones
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch { } } }, 25000);

http.listen(PORT, () => console.log(`Tiger 24 relay listening on port ${PORT} (ws + http health check)`));
