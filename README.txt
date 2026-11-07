ISLA V2.21 — CONTROLS & VISUAL FIXES

This small patch updates the COMPLETE V2.2 already in your repository.
The repository was checked at commit 788bd53: all 112 required V2.2 files
were present and matched their checksums. No game files were missing.

INSTALL
1. Extract ISLA-V2.21-Patch.zip.
2. Open the extracted ISLA-V2.21-Patch folder.
3. Upload every individual file inside to the ROOT of your existing GitHub
   repository, beside index.html and package.json. Replace matching files.
   This patch contains fewer than 20 files, so it fits in ONE upload batch.
4. Click Commit changes once all patch files are queued.
5. Wait for the existing Cloudflare deployment to finish, then reload the game.
   The menu and /healthz endpoint should show 2.21.

Upload the extracted FILES, not the ZIP and not the enclosing folder.
Keep all other V2.2 files and your existing wrangler.jsonc, bindings and secrets.
This is a PATCH, not a complete replacement repository. Do not delete old files.

FIXED
- Both numbered Iscoin faces are upright while the coin rotates.
- Iscoins sit below Aura, without covering the Aura count.
- Flappy can flap from dry ground to take off, spending one flap.
- A second finger can flap while the joystick and nitro stay held.
- Ability buttons, including Ultra rockets, sit above the driving meters.
- Joystick moved farther up/right; minimap adjusted to keep clear.
- The complete car, including wheels/accessories, flips and spins together.

The original one-time Cado_Codes credit is unchanged and will not repeat.
This update does not add the previously discussed Plane Car farming changes.
Read V2.21-Notes.md for verification details. This ZIP has not been deployed
for you; upload it to the existing repository to deploy through Cloudflare.

DEVELOPMENT
Node.js 22+, npm ci, npm test. After source edits, run
node refresh-manifest.cjs before building. The manifest retains the historical
filename isla-v16-upload.json and now declares version 2.21.
