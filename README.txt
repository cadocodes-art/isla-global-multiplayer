ISLA V1.7 — 3D MAP MAKER AND MOBILE CONTROLS

UPDATE YOUR EXISTING ONLINE GAME

1. Extract ISLA-V1.7-Update.zip.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
   Stay on the main file list, where package.json and wrangler.jsonc are.
3. Choose Add file > Upload files. Drag ALL the extracted FILES into it,
   then commit the changes. Upload the files, not the ZIP or its folder.
   Keep both traffic.js and traffic (1).js; they have different purposes.
4. Let your existing Cloudflare deployment finish. The commands stay:
   Build command:  npm run build
   Deploy command: npx wrangler deploy
   Preview command, if shown: npx wrangler versions upload
5. Refresh https://isla-globe-multiplayer.cadocodes.workers.dev/
   The main menu should say V1.7. On PC, Ctrl+Shift+R refreshes cached files.

Keep your existing wrangler.jsonc and Cloudflare secrets. This ZIP leaves
that configuration file out deliberately. The old isla-v16-upload.json
filename is retained so this upload replaces the previous manifest; its
contents now describe V1.7. Do not rename it or upgrade-v16-config.cjs.
No new Cloudflare service, email provider, or database setup is required.
Existing accounts, owner permissions, maps, cars, and balances are retained.
Your other game is not changed.

WHAT CHANGED

1. Aura: the large number in the driving HUD is the aura you can spend.
   Lifetime earned aura appears below in small text. Spending aura in the
   garage reduces the large number and leaves lifetime earnings intact.

2. Touch controls: the joystick, Nitro and HB remain. Camera and Recover
   now have their own buttons. Garage, pause, settings, map selection,
   chat, accounts and community menus can be used without a keyboard.
   In Pause > Driving controls, select Automatic or Touch controls.
   Editor buttons and form fields are sized for fingers; the lower dock
   scrolls to show all tools. Tap an object tile, then tap the map to place.
   Use Select/Pan/Orbit, the + and - buttons, or two fingers to pinch/pan.

3. Full 3D rotation: Edit > Object exposes Pitch / X, Turn / Y, and Roll / Z.
   Use sliders or type exact degrees. Bank roads, build vertical sections,
   and place the new Loop road piece. Elevated roads receive iron posts.
   Driving follows these 3D surfaces, including inverted loop sections.
   Keep enough speed through a loop or the car will fall. Road ends must
   meet in position and direction to make a continuous drivable route.
   Traffic follows connected, horizontal roads, including raised ones;
   traffic cars do not drive loops or tilted road sections.

4. Vertical movement: select an object in Edit, then use Up + / Down -,
   or enter Height above ground in meters. A feet readout is shown below.
   Movement steps are 0.25 m, 0.5 m, 1 m, and 5 m. Height is relative to
   the terrain under the object, from -200 m to +650 m.

5. Signs: Small sign, Large sign, and Overpass sign are in Build.
   Select one in Edit to type up to 75 characters and choose Apply text.
   Overpass signs have tall metal posts at the sides. Signs support the
   same height, rotation, scale and color controls as other objects.

6. Object colors: every object type has an Object color picker in Edit.
   Default color restores that type's original paint. For trees this
   colors the foliage; for buildings and cars it changes the body paint.
   Road markings, glass, tires and structural metal retain their details.

SAVING AND PLAYING

Use Save at the top or the editor pause menu. Save and play opens a test
drive; Back to editor returns to your creation. Shared maps retain signs,
colors, height and rotation. Re-share an existing map to publish edits.
Re-sharing an approved map requires approval of the new version as before.
Use one editor tab per map to avoid overwriting a newer save elsewhere.

ALSO INCLUDED FROM THE PREVIOUS UPDATE

Login protection counts failed attempts only and shows a retry countdown.
The previous one-time 500,000 aura gift to the existing Momster account is
included. Its server record prevents it from being awarded twice.
Water editing still changes the seabed; the water remains at sea level.
Pan still moves the map opposite your drag direction.

IF A BUILD FAILS

Upload every extracted file together. The upload checker verifies each
file before preparing the runtime folders. If it names a missing/changed
file, upload that exact file from this ZIP again. Keep your Worker name
and existing configuration; do not create a second Worker for this update.
