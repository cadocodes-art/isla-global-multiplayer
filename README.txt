ISLA V1.9 — THE PLAYPLACE + NEW RIDES

UPDATE YOUR ONLINE GAME
1. Download ISLA-V1.9-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your Cloudflare game already builds.
4. On the screen listing your repository's files, choose Add file > Upload files.
5. Open the extracted folder, select ALL the files inside it, and drag them
   into GitHub's upload area. Upload the files themselves, NOT the ZIP and
   NOT a folder containing them. Include isla-v16-upload.json.
6. Commit the changes. Wait for the connected Cloudflare deployment to finish.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V1.9.

Use your existing Worker and existing configuration. The ZIP deliberately has
no wrangler.jsonc. Your Worker name, database bindings, OWNER_ACCOUNT_ID, and
secrets stay as they are. No new Worker, account reset, or database migration
is needed. Existing maps, balances, and owned cars are preserved.

Keep these existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest filename isla-v16-upload.json stays the same for compatibility;
its version is now 1.9. It verifies every file before restoring the folders.
If the build reports an incomplete upload, re-upload all files from this ZIP.
Do not remove scripts/build-world.cjs or change the build command to skip it.
The file named "traffic (1).js" is intentional: it contains server traffic,
while "traffic.js" contains browser traffic. Keep both exact filenames.
This package is prepared for you to upload; it has not been deployed for you.

WHAT IS NEW
- The Playplace is map 04 / 04. Use the main-menu arrow to reach it.
  A 1,600 by 1,400 meter indoor arena contains nine trampolines, two foam
  pits, fifteen swinging ropes, two spiral climbs, slides, tunnels, elevated
  bridges, and wide turning decks. The foam slows cars and moves when hit;
  its sloped edges let even the starter car drive out. Ropes swing on impact.
- Cars bump and push one another in every global room, including community
  maps. The server sends the same impact to both drivers. New spawns and
  recovery teleports have a brief three-second collision grace period.
- Map Maker now has 50 original-map slots. Level copies also holds 50 maps.
  Existing slots keep their contents.
- Place Lamp posts from Build. They support the existing edit, color, group,
  duplicate, copy/paste, and delete tools. They illuminate nearby surfaces
  after dark. Nearby lights are limited to keep mobile rendering manageable.
- The corner Time of day slider runs from 12 AM through noon to 12 AM,
  in 15-minute steps. It works with touch and supports Undo / Redo. The time
  saves in the map and is used in test drives and its published global room.
  Old maps default to 2 PM. The driving settings show the map's saved time.
- Shared map details show the date and time in the viewer's local time zone.
  Future re-shares keep the first recorded publication date. Existing maps
  retain the publication timestamp already stored by the previous version.

NEW GARAGE CARS
  Water Skidder     280,000 aura    273 km/h with nitro
    Boat-shaped body. Wheels retract on water. Unlimited water driving,
    including stopping and restarting. Wheels extend again on land.
  Micro            200,000 aura    261 km/h with nitro
    40% of Solstice R size with extremely quick acceleration.
  Vespera          340,000 aura    322 km/h with nitro
    A sleek sculpted supercar, about Solstice R size.
  Casual Cruiser    40,000 aura    214 km/h with nitro
    An approachable everyday sedan.
  Hover            255,000 aura    278 km/h with nitro
    Four angled propellers. Rises about half a meter while moving on land.
    It does not float on water: the normal skim and sinking rules apply.

Plane Car now costs 330,000 aura. Existing owners keep it. Its speeds remain
240 km/h with ground nitro and 290 km/h with airborne nitro.
The US customary option also applies to the new cars and map information.

VERIFICATION
The update was checked with the existing regression suite plus new vehicle,
lighting, 50-slot storage, publication date, playground physics, and two-client
multiplayer collision tests. Desktop and 390-pixel phone layouts were checked
in the local browser. This was not a hardware test on your iPad/Safari.
Foam and rope animation is local visual physics; player impacts are synchronized.
The package contains no local preview fixtures or test accounts.
