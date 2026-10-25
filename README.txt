ISLA V1.93 — PLAYPLACE CHAOS

UPDATE YOUR ONLINE GAME
1. Download ISLA-V1.93-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your Cloudflare game already builds.
4. On the screen listing your repository's files, choose Add file > Upload files.
5. Open the extracted folder, select ALL the files inside it, and drag them
   into GitHub's upload area. Upload the files themselves, NOT the ZIP and
   NOT a folder containing them. Include isla-v16-upload.json.
6. Commit the changes. Wait for the connected Cloudflare deployment to finish.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V1.93.

Use your existing Worker and existing configuration. The ZIP deliberately has
no wrangler.jsonc. Your Worker name, database bindings, OWNER_ACCOUNT_ID, and
secrets stay as they are. No new Worker, account reset, or database migration
is needed. Existing maps, balances, and owned cars are preserved.

Keep these existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest filename isla-v16-upload.json stays the same for compatibility;
its version is now 1.93. It verifies every file before restoring the folders.
If the build reports an incomplete upload, re-upload all files from this ZIP.
Do not remove scripts/build-world.cjs or change the build command to skip it.
The file named "traffic (1).js" is intentional: it contains server traffic,
while "traffic.js" contains browser traffic. Keep both exact filenames.
This package is prepared for you to upload; it has not been deployed for you.

WHAT CHANGED
- A large connected maze with three secret rooms. Every car has a full-width
  route through it; green MICRO passages are shortcuts for the Micro.
- Exactly five cannons around the arena. Drive onto the yellow pad at the back
  to enter. A five-second countdown begins automatically. Use A/D, the arrow
  keys, or the mobile joystick to aim. The dotted line previews your launch.
  Recover exits the cannon. The launch travels roughly half the building.
- Exactly three seesaws. Drive up the lowered end to tip the deck with your
  car's weight. The deck carries your car and can give a small pop on the rise.
- Ten Santa Luz-style stunt ramps, including ramps near the maze and sky roads.
- Balls, foam cubes, ropes, seesaws and basket counts now have one shared state
  in the Playplace global room. New arrivals see the current positions.
- Mobile controls work for the new attractions without extra keyboard keys.

ONLINE PLAY
The updated Playplace uses a new room version, so everyone should reload after
this deployment. Other maps keep their existing room names. The server runs
shared playground physics and sends changes to connected players. Local impact
prediction helps hits feel responsive; objects can correct slightly with lag.
Late joins and reconnects receive the current shared scene. An empty room resets
its toys after ten minutes. Solo free roam still runs entirely on your device.

CHECKS
Physics and multiplayer regression tests passed, including two WebSocket
clients, late joins, reconnects and ignoring client-supplied object positions.
A deployment dry run and upload rehearsal preserved Worker, owner and database
settings. Desktop and phone-sized local browser previews were checked; this was
not an iPad hardware test. Preview fixtures are excluded from the update.
