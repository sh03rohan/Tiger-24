# Tiger 24

A browser-based 3D tactical shooter. You play as Shadow, an operator in the counter-terror unit Tiger 24, across a 16-mission campaign: hostage rescue, hijackings, bomb defusal, stealth, survival and arrests. Up to 4 friends can play the campaign together in online co-op.

Built with plain JavaScript ES modules, [Three.js](https://threejs.org) 0.165 for rendering and [cannon-es](https://github.com/pmndrs/cannon-es) 0.20 for physics. There is no build step: the libraries load from a CDN through an import map.

## Run it

Serve the repository root over HTTP. ES modules do not load from `file://`.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/game/>. Add `#unlock` to the URL to unlock every mission.

## Controls

| Key | Action |
|---|---|
| WASD, mouse | Move, aim |
| Left click / right click | Fire / aim down sights |
| R | Reload |
| 1 / 2 | Primary / sidearm |
| C (or Ctrl) / Shift / Space | Crouch / sprint (hold breath while aiming) / jump |
| B | Fire mode |
| Q / E | Lean |
| G | Flashbang |
| J | Smoke grenade |
| H | Medkit |
| F (hold) | Interact, free a hostage, arrest a suspect |
| V | Order a suspect to surrender |
| T | Squad breach |
| Z | Hawk sniper mark |
| Y | Ghost drone scan |
| X | Squad follow / hold |
| Tab | Map |
| Esc | Pause |

Touch controls appear on phones and tablets.

## Missions

| # | Operation | Type |
|---|---|---|
| 01 | Vault | Bank hostage rescue and bomb defusal |
| 02 | Deep Blue | Hijacked cargo ship |
| 03 | Talon | Jungle base raid and helicopter extraction |
| 04 | Skyline | Skyscraper with three bombs |
| 05 | Iron Rail | Moving train |
| 06 | Silent | Stealth embassy VIP extraction |
| 07 | Fallen Hawk | Survive waves at a helicopter crash site |
| 08 | Roar | Arrest the traitor at the Black Crescent HQ |
| 09 | Runway | Hijacked airliner, narrow-cabin close quarters |
| 10 | Black Tide | Oil rig in a storm: close three gas valves, evacuate the crew |
| 11 | Undercity | Metro station chemical bomb |
| 12 | Red Tide | Harbour at night: arrest the arms dealer and take his ledger |
| 13 | Lifeline | Hospital in a power cut: restart the generator, free the patients and the minister |
| 14 | Whiteout | Snowbound radar outpost: steal the launch codes, kill the jammer, fly out |
| 15 | Bazaar | Shopping mall siege: two bombs and ten hostages |
| 16 | Floodgate | Finale at the dam: three charges, arrest the Red Tide chief, save the engineers |

## Co-op multiplayer

Choose **Multiplayer** from the lobby menu. One player picks a mission and difficulty and presses **Host game**. That player gets a 4-character code, and the others join with it, or pick the game from the open-games list. In co-op the AI squad is replaced by the human players.

How it works:

- **Host-authoritative.** The host's browser runs every enemy, hostage and objective. The other players run the same level with the enemies and hostages as puppets driven by the host's world snapshot, sent 10 times a second.
- **Client actions.** Each player hits enemies on their own screen, then sends the hit to the host along with actions such as freeing a hostage, arresting, opening a door, cutting a wire, throwing a flashbang or smoke, and using a task console.
- **Downed players.** A player who goes down can be revived by a teammate holding F nearby. Otherwise they respawn at the entry point after 25 seconds. The mission fails only if everyone is down at once.

Transport:

- **On claude.ai:** the game uses the artifact's `room` capability, so there's no server to run. Everyone who opens the shared artifact page is in the same room.
- **Self-hosted:** run the relay in `server/` and point every player at it:

```bash
cd server && npm install && node relay.mjs
```

Then open `game/?relay=ws://<relay-host>:8787` on each player's browser, or enter the relay address on the Multiplayer screen.

## Code layout

```
game/
  index.html          UI: splash, lobby, planning, HUD, pause, debrief
  src/main.js         Game flow and render loop
  src/core.js         Renderer, post-processing, audio, voice, effects, helpers
  src/assets.js       Procedural textures, characters, weapons
  src/levelkit.js     Level toolkit: colliders, doors, glass, props, navigation grid, lighting
  src/player.js       Movement, weapons, gadgets, interaction
  src/ai.js           Enemies, hostages, squad AI, ragdolls
  src/mission.js      Generic mission engine: objectives, scoring, progression
  src/net.js          Co-op multiplayer: transport, host/client sync, remote players
  src/hud.js          HUD and minimap
  src/lobby.js        3D hangar lobby and mission art
  src/missions/       One module per mission; index.js sets the campaign order
server/relay.mjs      WebSocket presence relay for co-op outside claude.ai
prototypes/           Early element preview, lobby mock-up and the first single-mission build
```

### Adding a mission

1. Create `game/src/missions/<id>.js`. It exports `meta` and a `build()` function that returns the level definition: spawns, enemies, hostages, objectives, timer and blueprint.
2. Register the module in `game/src/missions/index.js`.
3. Optionally add card art for `meta.art` in `missionArt()` in `lobby.js`.

### Rendering

- Shadows: PCF soft shadows.
- Anti-aliasing: MSAA render targets.
- Ambient occlusion: GTAO.
- Post-processing: bloom, ACES tone mapping, and a colour-grade pass (split toning, vignette, film grain, chromatic aberration, low-health desaturation).
- Surface detail: normal and roughness maps are generated from the procedural textures.
- Reflections: outdoor levels use an environment map built from their sky gradient.
- Atmosphere: light shafts and floating dust.

Graphics quality can be set in Settings (Low / Med / High / Ultra).
