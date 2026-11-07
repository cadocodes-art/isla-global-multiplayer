ISLA V2.31 — MORE ISCOINS + FLAPPY CAR AIR CONTROL

UPLOAD PATCH — 19 FILES
1. Extract ISLA-V2.31-Upload-Patch.zip.
2. Open its ISLA-V2.31-Upload-Patch folder.
3. Upload the 19 individual files to the ROOT of your existing complete
   V2.3 repository in ONE batch, replacing matches and adding the notes file.
4. Commit that batch. Keep all other files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or put the files inside a new repository folder.

WHAT'S NEW
- 50% more spawned Iscoins: 180 on main outdoor maps, 90 in Play Place.
  Approved custom maps target 180 where safe space permits.
- Coins remain scattered: 40% near roads, 60% elsewhere where possible.
  Personal three-minute respawns, coin values and upgrade prices are unchanged.
- Flappy Car now accelerates forward, reverses and changes its flight path
  at every upgrade level, including after ramp jumps and when out of flaps.
- Flaps still provide lift, with the same budgets and landing refill.

All V2.3 leaderboards, privacy settings and other prior features are retained.
See V2.31-Notes.md for details and validation.

LOCAL CHECKS
Node.js 22+: npm ci, npm run build, npm run check:worker, npm test.
For playtesting: npm run dev.
After editing source files, run node refresh-manifest.cjs before building.

This ZIP prepares the release; it has not been pushed or deployed for you.
