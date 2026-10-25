ISLA V2.01 — ALERTS & SPLASHES

UPDATE YOUR EXISTING ONLINE GAME
1. Download ISLA-V2.01-Update.zip and extract it (right-click > Extract All).
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay on the branch your existing Cloudflare game builds.
4. On the page listing the repository files, choose Add file > Upload files.
5. Open the extracted folder and select ALL 97 files inside. Drag those files
   into GitHub. Upload the individual files, not the ZIP or an enclosing folder.
   Keep both traffic.js and traffic (1).js. Include isla-v16-upload.json.
6. Commit the changes. Wait for the connected Cloudflare deployment to finish.
7. Reload https://isla-global-multiplayer.cadocodes.workers.dev/?menu=1
   The main menu and community header should show V2.01.

No new Worker or database is required. Keep your existing wrangler.jsonc,
OWNER_ACCOUNT_ID, database bindings and secrets. This ZIP excludes your Worker
configuration. Accounts, saved maps, aura and owned cars are preserved.
This update is prepared for manual upload; it has not been deployed for you.

Keep your existing build settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command: npx wrangler versions upload

The manifest keeps the filename isla-v16-upload.json, but says version 2.01.
It checks every file before reconstructing the folders used by the build.
If a build reports an incomplete upload, upload all files from this ZIP again.
The two traffic filenames are intentional: traffic.js is for the browser,
and traffic (1).js is for the server. build-world.cjs is included as well.

NOTIFICATIONS
- Signed-in players get small in-game alerts for new private messages.
- Tap the envelope near the top right to view your saved notifications.
  You can open a conversation or map, and mark notifications as read.
- Notifications work on the menu, community screens, in the editor and while
  driving. Phone alerts are smaller and stay at the top, above the car.
- Map owners get one alert at each milestone: 50, 100, 500, 1,000, 5,000,
  10,000, 50,000 and 100,000 plays. These use the same unique-driver count
  displayed on the map page. Repeated visits do not inflate that count.
- Republishing does not reset milestones. Alerts begin with milestones crossed
  after installing this update. They do not retroactively announce old totals.
- Alerts appear within about five seconds while ISLA is open and visible.
  If you are away, they are saved for when you return. These are in-game
  notifications, not phone lock-screen notifications or email.

WATER PARK
- Three new enclosed slides: Coral Tube, Blue Bend and Lime Rush.
  The two existing open slides remain, for five slides total.
- Translucent upper panels let you see your car inside the enclosed slides.
  Water flows downhill along all five slides.
- Three mushroom spray towers with moving water jets and droplets.
- Shallow pool: maximum depth 0.5 meters. Deep pool: maximum depth 2 meters.
  Both retain sloped exits. Signs convert to feet when US units are selected.
- The upper deck is longer, supported, and protected by railings. The uphill
  conveyor and open slides have side rails too. Entrances remain open.
- Slide walls and rails have matching collision surfaces for cars and balls.

AFTER UPDATING
All players should reload before joining the updated Playplace. It has a fresh
room version for the changed layout. Other main maps keep their room names.
No new sign-in, owner setup or Cloudflare service is needed.

Verification includes account privacy, message retry/persistence, all eight
milestones, duplicate prevention, slide collisions, multiplayer state, and a
390-pixel mobile browser layout. This is not a physical iPad/Safari test.
The local test controls and sample accounts are not included in the ZIP.
