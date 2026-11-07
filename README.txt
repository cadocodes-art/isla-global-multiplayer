ISLA V2.32 — RANDOM ISCOIN PLACEMENT

UPLOAD PATCH — 14 FILES
1. Extract ISLA-V2.32-Upload-Patch.zip.
2. Open its ISLA-V2.32-Upload-Patch folder.
3. Upload the 14 individual files to the ROOT of your existing complete
   V2.31 repository in ONE batch, replacing matches and adding the notes file.
4. Commit that batch. Keep all other files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or put the files inside a new repository folder.

WHAT'S NEW
- 1- and 5-Iscoin coins spawn at random safe positions, with no road quotas.
- Spawn totals stay at 180 on main outdoor maps and 90 in Play Place.
- 5-Iscoin coins remain rarer; rare 10-Iscoin coins favor roofs and water.
- Personal three-minute respawns, upgrade prices and Flappy Car fixes remain.
- Layouts stay consistent between visits and agree with the server.

See V2.32-Notes.md for details and validation.

LOCAL CHECKS
Node.js 22+: npm ci, npm run build, npm run check:worker, npm test.
For playtesting: npm run dev.
After editing source files, run node refresh-manifest.cjs before building.

This ZIP prepares the release; it has not been pushed or deployed for you.
