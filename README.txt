ISLA V1.71 — TILTED ROAD FIX

Open road ends now release the car into a jump instead of trapping it
against an invisible edge. Reversing downhill transfers the car back
onto solid terrain before a tilted road continues underground.
Connected road pieces, elevated bridges, and vertical loops are retained.

Use ISLA-V1.71-Road-Fix.zip for this update. Upload all 61 extracted files
to the existing GitHub repository and commit. Keep both Cloudflare Workers,
their settings, and your existing wrangler.jsonc. No new Worker is needed.
Your current game is https://isla-global-multiplayer.cadocodes.workers.dev/
This update does not reissue the already-applied Cado_Codes aura credit.

V1.71 MEASUREMENT SETTING

On the main menu, use the measurement selector near the top-right.
Choose Metric (km/h, meters, kilometers) or US customary (mph, feet, miles).
Your choice is remembered in this browser, including when playing as a guest.
Choose it separately on another device. Metric remains the default.

The setting covers the speedometer, explored distance, map scale, garage
speed stats, stunt and impact distances/speeds, and Map Maker measurements.
In US mode, object height can be entered in feet and movement steps are
1/4, 1/2, 1, or 5 feet. The grid keeps its physical size: one square is
3.28 by 3.28 feet (1 by 1 meter). Changing units does not resize existing
maps, move objects, change vehicle performance, or change aura rewards.

TO UPDATE ONLINE
1. Extract ISLA-V1.71-Road-Fix.zip.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. In the main file list, choose Add file > Upload files. Upload ALL
   extracted files together, then commit. Upload the files, not the ZIP.
4. Keep your existing wrangler.jsonc and Cloudflare secrets.
5. Wait for Cloudflare to deploy, then refresh ISLA. The menu says V1.71.
   Build: npm run build
   Deploy: npx wrangler deploy

The V1.7 features and earlier fixes are included. Existing accounts,
owner settings, saved maps, cars and aura balances are preserved.
The filename isla-v16-upload.json is intentionally retained to replace
older upload manifests. Do not rename it or upgrade-v16-config.cjs.

V1.7 FEATURE GUIDE (ALSO INCLUDED)
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
   or enter Height above ground in your selected unit system.
   Movement steps are 0.25, 0.5, 1, and 5 in your selected units. Height is relative to
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
