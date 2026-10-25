ISLA V2.1 — FERN VALLEY

UPDATE YOUR EXISTING ONLINE GAME
1. Download ISLA-V2.1-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your existing Cloudflare game builds.
4. On the page listing the repository files, choose Add file > Upload files.
5. Open the extracted folder and select ALL 99 files inside. Drag those files
   into GitHub. Upload the individual files, not the ZIP or an enclosing folder.
   Keep both traffic.js and traffic (1).js. Include isla-v16-upload.json.
6. Commit the changes. Wait for the connected Cloudflare deployment to finish.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V2.1.
8. Use the main-menu arrow to reach Fern Valley, the fifth map. Or open:
   https://isla-global-multiplayer.cadocodes.workers.dev/?map=fern&menu=1

No new Worker or database is required. Keep your existing wrangler.jsonc,
OWNER_ACCOUNT_ID, database bindings and secrets. This ZIP excludes your Worker
configuration. Accounts, saved maps, aura and owned cars are preserved.
This update is prepared for manual upload; it has not been deployed for you.

Keep your existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest keeps the filename isla-v16-upload.json, but says version 2.1.
It checks every file before reconstructing the folders used by the build.
If a build reports an incomplete upload, upload all files from this ZIP again.
The two traffic filenames are intentional: traffic.js is for the browser,
and traffic (1).js is for the server. build-world.cjs is included as well.

FERN VALLEY
- A fifth main map with its own global room and normal aura earning.
- 4 km by 4 km of playable countryside: four times Costa Metro's driving area.
- Invisible borders on all four sides, with terrain and roads continuing beyond.
- Gentle rolling hills, dry grass, sandy patches, bushes, cactuses and rocks.
- Fern Town in the north-center: 15 buildings, including two restaurants and
  two grocery/market buildings. Additional homes and diners are spread sparsely
  across the countryside. Houses and restaurants remain destructible.
- Paved highways and town streets, gravel trails and short home/ranch driveways.
  Gravel has less grip and more rolling resistance than asphalt.
- Eight traffic cars, including cars on the gravel routes.
- 18 off-road ramps, each with room for an approach and landing.
- Three fenced pastures with 24 decorative cows that graze and slowly wander.
  Cows have no collisions, damage, destruction, or Launcher/Nuker interactions.
- Road signs, wooden property fences, and a countryside minimap.

MAP MAKER
- New objects: Cactus, Restaurant and Wooden fence.
- Use the existing mobile tap-to-place controls, or drag from the palette.
- These objects support colors, scaling, all rotation axes, height adjustment,
  multi-select, group transforms, duplicate, copy/paste, saving and playtesting.
- Restaurant walls are destructible. Cactuses and fences have solid hitboxes.
- The existing 50-map limit, online sharing and approval rules remain unchanged.

LOCAL GAME
The separate ISLA-Drive.html file contains the updated bundled game for local
play. The special no-online-features ISLA-Offline.html is a separate edition
and has not been replaced by this update.

AFTER UPDATING
Ask players to reload to see Fern Valley and the new Maker objects. Existing
main maps keep their room names and the Playplace retains its current revision.
No new sign-in or owner setup is needed.

Checks include terrain, roads, ramp launches, borders, cow behavior, Maker
transforms, multiplayer room separation, traffic and aura eligibility, plus the
existing game/account regression suite and a 390-pixel mobile browser layout.
This is not a physical iPad/Safari test. Local test controls and sample accounts
are not included in the upload ZIP.
