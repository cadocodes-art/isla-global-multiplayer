ISLA V1.92 — PLAYPLACE EXPANSION

UPDATE YOUR ONLINE GAME
1. Download ISLA-V1.92-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your Cloudflare game already builds.
4. On the screen listing your repository's files, choose Add file > Upload files.
5. Open the extracted folder, select ALL the files inside it, and drag them
   into GitHub's upload area. Upload the files themselves, NOT the ZIP and
   NOT a folder containing them. Include isla-v16-upload.json.
6. Commit the changes. Wait for the connected Cloudflare deployment to finish.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V1.92.

Use your existing Worker and existing configuration. The ZIP deliberately has
no wrangler.jsonc. Your Worker name, database bindings, OWNER_ACCOUNT_ID, and
secrets stay as they are. No new Worker, account reset, or database migration
is needed. Existing maps, balances, and owned cars are preserved.

Keep these existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest filename isla-v16-upload.json stays the same for compatibility;
its version is now 1.92. It verifies every file before restoring the folders.
If the build reports an incomplete upload, re-upload all files from this ZIP.
Do not remove scripts/build-world.cjs or change the build command to skip it.
The file named "traffic (1).js" is intentional: it contains server traffic,
while "traffic.js" contains browser traffic. Keep both exact filenames.
This package is prepared for you to upload; it has not been deployed for you.

WHAT CHANGED
- Foam cubes are tilted, mixed up and movable. Cars can push and tumble them,
  land on top, compress them and bounce gently. Contacts follow each cube's
  current position and orientation. Partial contact still provides traction.
- Rope weights and cords separate from the full car body. Ropes respond and
  swing back faster; their physics no longer depends on animation frame rate.
- Four ceiling-hung decks, two moving shuttles, a rising lift and a wave road.
  Moving platforms carry resting cars. A driveable side branch links the old
  skybridge directly to the hanging trail. Another climb starts at ground level.
- Four basketballs, four soccer balls and six colorful dodgeballs. Drive into
  them to roll, bounce or launch them. They collide with each other, foam,
  platforms and the building. No extra key or mobile button is needed.
- A giant basketball court and hoop with a solid rim and backboard. Knock any
  ball down through the hoop to get a BASKET message. The counter lasts for the
  current play session and does not award aura.
- Hover's exposed propellers lean farther backward as it moves forward, then
  ease back toward their resting angle when it slows down.
- Existing thick decks, slides, tunnels, trampolines and mobile controls stay.

ONLINE PLAY
The updated Playplace uses a fresh global room for the expanded layout. Players
with an older game tab need to reload before joining. Other maps keep their
existing room names. Platform schedules line up while players are online.
Foam, ropes, loose balls and basket counters are simulated on each device;
nearby remote cars can hit them, but their exact positions are not synchronized
by the server. Car-to-car bumps remain shared as before.

CHECKS
Physics and multiplayer regression tests passed, plus a deployment dry run and
an upload rehearsal that preserves your existing Worker and database settings.
Desktop and phone-sized browser previews were checked locally. This was not
an iPad hardware test. No preview fixtures or test accounts are in the package.
