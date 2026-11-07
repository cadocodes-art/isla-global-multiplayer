ISLA V2.2 — ISCOINS & UPGRADES

This is the complete source update for the existing ISLA multiplayer game.
It has not been uploaded to GitHub or deployed to the live game.

UPDATE YOUR EXISTING GAME
1. Extract ISLA-V2.2-Update.zip and open the ISLA-V2.2-Update folder.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer and choose
   the branch your existing Cloudflare game builds from.
3. Use Add file > Upload files to upload ALL files inside the extracted folder
   to the repository root. Upload the files, not the ZIP or enclosing folder.
   If needed, split the files into two upload batches. The build will reject
   an incomplete batch; finish uploading every file before testing the update.
4. Keep your existing wrangler.jsonc, Worker name, OWNER_ACCOUNT_ID,
   database bindings and secrets. This ZIP deliberately excludes that config.
   Keep both traffic.js and traffic (1).js; both are required.
5. Commit the upload and let your existing Cloudflare build/deploy finish.
6. Reload your existing game URL. The menu and community header show V2.2.
   Sign in as Cado_Codes to test purchases, upgrades and saved balances.

EXISTING CLOUDFLARE BUILD SETTINGS
Build command: npm run build
Deploy command: npx wrangler deploy
Preview command: npx wrangler versions upload
Node.js: 22 or newer

TEST CREDIT FOR CADO_CODES
The update adds 10,000 Iscoins and 5,000,000 Aura to the existing verified
Cado_Codes account once, when the updated community server first starts.
This ADDS to the account's balance; it does not replace the current balance.
A database record prevents the credit from repeating after restarts or
redeploys. It is tied to the existing account, never a guest display name.
The credit has been tested locally, but has NOT been applied to the live game.
Continue using the existing Worker and account database so the account and
its credit record are preserved. No new account or database is needed.

WHAT IS INCLUDED
- Iscoins, collectible 1/5 coins, account balances and visibility controls.
- Three upgrade levels for all 19 cars, permanent purchases and free switching.
- Flappy Car, updated Nuker, Water Skidder limits and rooftop StickCar driving.
- Doubled existing Aura prices, new Aura activities and permanent building history.
- Tire-trail colors, air tricks, easier steering and adjusted mobile controls.
- Themed buildings, walking NPCs, ragdolls and new Map Maker building types.
- Shared multiplayer visuals, upgrade validation and persistence.

Read V2.2-Release-Notes.md for EVERY planned feature, exact car prices,
upgrade costs, abilities, controls and the chosen balancing details.
Read V2.2-Validation.md for test coverage and remaining device checks.

FOR LOCAL DEVELOPMENT
Use these files inside a checkout of the existing repository, with its
wrangler.jsonc preserved. Run npm ci, then npm run dev. Run npm test for
build, Worker dry-run and the regression suite. Source files are intentionally
flat: the build reconstructs public/, src/, scripts/ and test/.
After editing a source file, run node refresh-manifest.cjs before building.
The upload manifest retains the name isla-v16-upload.json for compatibility;
its contents are version 2.2. It verifies the complete upload before copying.

No generated preview fixtures, test accounts, credentials, node_modules or
local database files are included. A separate offline HTML edition is not
part of this ZIP. Plane Car aura-farming changes remain deferred to V2.21.
