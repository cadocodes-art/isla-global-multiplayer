ISLA V1.91 — PLAYPLACE FIXES

UPDATE YOUR ONLINE GAME
1. Download ISLA-V1.91-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your Cloudflare game already builds.
4. On the screen listing your repository's files, choose Add file > Upload files.
5. Open the extracted folder, select ALL the files inside it, and drag them
   into GitHub's upload area. Upload the files themselves, NOT the ZIP and
   NOT a folder containing them. Include isla-v16-upload.json.
6. Commit the changes. Wait for the connected Cloudflare deployment to finish.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V1.91.

Use your existing Worker and existing configuration. The ZIP deliberately has
no wrangler.jsonc. Your Worker name, database bindings, OWNER_ACCOUNT_ID, and
secrets stay as they are. No new Worker, account reset, or database migration
is needed. Existing maps, balances, and owned cars are preserved.

Keep these existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest filename isla-v16-upload.json stays the same for compatibility;
its version is now 1.91. It verifies every file before restoring the folders.
If the build reports an incomplete upload, re-upload all files from this ZIP.
Do not remove scripts/build-world.cjs or change the build command to skip it.
The file named "traffic (1).js" is intentional: it contains server traffic,
while "traffic.js" contains browser traffic. Keep both exact filenames.
This package is prepared for you to upload; it has not been deployed for you.

WHAT CHANGED
- Solid 1.8-meter-thick elevated decks, with matching sides and undersides.
- Flush ramp entrances and level joins between spirals, platforms and slides.
- Support-post hitboxes stop below the decks; cars can drive off open edges.
- A closer layout: the building is now 1,200 by 1,050 meters. The rope frame
  has moved away from a spiral ramp. All existing attractions are retained.
- Ropes receive one gentle push per impact. Hanging balls follow their visible
  ropes at a fixed length, then gradually settle.
- Foam blocks now support cars, compress under weight and give a small bounce
  on landing. Sloped edges still allow you to drive out of the pits.
- Lower trampoline launches. Each repeated bounce loses height until you rest.
  Driving onto ordinary floor resets the bounce chain. Steer in the air;
  gas adds some movement and brake slows your drift. Mobile uses the joystick.
- Hover now has exposed propeller blades without outer rings. All four tilt
  backward toward the chase camera instead of sideways.

ONLINE PLAY
The updated Playplace uses a fresh global room for its smaller layout. Players
with an older game tab need to reload before joining. Other maps keep their
existing room names. Rope and foam animation remains local, while car bumps
remain shared. Accounts, maps, balances, and owned cars are preserved.

CHECKS
Physics and multiplayer regression tests passed, along with a deployment dry
run. Browser previews were checked locally; this was not an iPad hardware test.
The package contains no local preview fixtures or test accounts.
