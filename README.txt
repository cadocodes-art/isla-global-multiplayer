ISLA V2.33 — 240 COINS AND A FRESH LAYOUT EACH VISIT

UPLOAD PATCH — 23 FILES
1. Extract ISLA-V2.33-Upload-Patch.zip.
2. Open its ISLA-V2.33-Upload-Patch folder.
3. Upload the 23 individual files to the ROOT of your existing complete
   V2.32 repository in ONE batch, replacing matches and adding new files.
4. Commit that batch. Keep all other files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or put the files inside a new repository folder.

WHAT'S NEW
- Every main map now has 240 coin slots, including Play Place.
- Approved custom maps also target 240 wherever safe space permits.
- Leaving and re-entering a map generates a fresh personal random layout.
- A page reload starts a new visit; pausing or opening the garage does not.
- 1- and 5-Iscoin coins have no road quotas; rare tens favor roofs and water.
- Recently collected coins keep their personal three-minute cooldown across
  visits, so fewer than 240 may be available until those coins respawn.
- Both accounts and guests get fresh layouts. Global-room players have their
  own coins; one player's pickup does not remove another player's coins.

See V2.33-Notes.md for details and validation.

LOCAL CHECKS
Node.js 22+: npm ci, npm run build, npm run check:worker, npm test.
For playtesting: npm run dev.
After editing source files, run node refresh-manifest.cjs before building.

This ZIP prepares the release; it has not been pushed or deployed for you.
