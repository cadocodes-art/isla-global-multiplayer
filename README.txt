ISLA V2.0 — ROCKETS, STRIKES & SPLASHES

UPDATE YOUR EXISTING ONLINE GAME
1. Download ISLA-V2.0-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your existing Cloudflare game builds.
4. On the screen listing the repository files, choose Add file > Upload files.
5. Open the extracted folder. Select ALL 94 files inside and drag the files
   into GitHub. Upload the individual files, NOT the ZIP or an enclosing folder.
   Keep both traffic.js and traffic (1).js. Include isla-v16-upload.json.
6. Commit the changes, then wait for the connected Cloudflare deployment.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V2.0.

No new Worker or database is required. Keep your existing wrangler.jsonc,
OWNER_ACCOUNT_ID, database bindings and secrets. This ZIP deliberately excludes
wrangler.jsonc and does not change accounts, saved maps, aura or owned cars.
It has been prepared for manual upload; it has not been deployed for you.

Keep your existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest keeps the filename isla-v16-upload.json, but now says version 2.0.
It verifies every file before reconstructing the folders used by the build.
If a build reports an incomplete upload, upload all files from this ZIP again.
Do not skip scripts/build-world.cjs. The two traffic filenames are intentional:
traffic.js is for the browser, and traffic (1).js is for the server.

NEW IN THE PLAYPLACE
- Two giant bowling lanes near the southern side of the arena. Push a separate,
  heavy bowling ball; cars stop at the marked line but the ball rolls through.
- Two rolls per turn. Pins stay down after roll one. A strike ends the turn;
  clearing the rest on roll two is a spare. The lane board shows your result.
- The ball returns after rolling behind the pins. Pink RESET pads start fresh.
  Global lanes reserve the current player's turn and release it after results
  or 35 seconds of inactivity while waiting for a roll.
- Bowling balance revised after playtesting: the ball starts 4.4 meters closer,
  on the approach side of the line. Off-center bumper hits change its aim.
  Pins have wider spacing and less chain-reaction energy. Gentle and off-center
  shots leave pins standing; a well-aimed strong shot can still score a strike.
- Five conveyor belts carry cars, sports balls and foam. Drive over the pink
  pad beside a belt to reverse it. Some belts rise to a slide or launch edge.
- Water park toward the northeastern side: wide slides, a shallow splash pool
  for every car, a deep pool for skimming or the Water Skidder, and sloped exits.

TWO NEW GARAGE CARS
Launcher — 290,000 aura
  About the Beast's size. 250 km/h with nitro. Its angled front scoop launches
  traffic, other global players, rocks and sports balls above 150 km/h.
  Hits above 210 km/h sometimes uproot trees, exposing their roots. Thrown
  objects fall back to the ground. Bowling balls remain heavy and low-bouncing.

The Ultra — 500,000 aura
  Slightly larger than the Solstice R, with two enormous side rocket pods.
  Ordinary nitro top speed: 230 km/h.
  Rocket burst: 571–583 km/h; rocket plus nitro: 613–633 km/h.
  Press E or tap ROCKET on mobile to start an eight-second burst.
  Press/tap again, brake or use the handbrake to cancel. Thrust stops; speed
  falls naturally. After use, rockets recharge for a random 30–35 seconds.
  They never activate automatically. Recovery/car switching does not refill
  the rocket cooldown. Mobile: tap ROCKET, steer with the joystick, and hold
  NITRO with your other thumb. Speeds also display in US units when selected.

ONLINE PLAY AND VERIFICATION
Bowling pins, turns, ball returns and belt directions are simulated in the room.
Rocket cooldowns and shared Launcher impacts are also checked on the server.
Late arrivals receive the current toys and thrown nature. Reload after updating:
the Playplace now uses its V2.0 room; the other maps retain their room names.
Motion can correct slightly with network lag. Empty rooms reset after ten minutes.
Solo play still runs on your own device.

Physics, garage, account/editor and multiplayer regression checks were run,
including paired clients, late joins, rocket cancellation and thin-wall impacts
at 633 km/h. Desktop and a 390-pixel touch layout were checked in a local browser.
This is not a physical iPad/Safari test. Local preview tools are not in the ZIP.
