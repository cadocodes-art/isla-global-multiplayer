ISLA V2.24 — ISCOINS + THE VAULT

UPLOAD PATCH — 23 FILES
1. Extract ISLA-V2.24-Upload-Patch.zip.
2. Open the ISLA-V2.24-Upload-Patch folder.
3. Upload its 23 individual files to the ROOT of your existing repository
   in ONE batch, replacing matching files and adding the new ones.
4. Commit that batch. Keep the rest of your repository and wrangler.jsonc.
5. Let Cloudflare run the existing build/deploy configuration.

Do not upload the ZIP itself or put the files inside a new repository folder.
This patch works over complete V2.23, with or without the music test patch.

WHAT'S NEW
- Upgrade prices +25%, rounded up to a whole Iscoin; owned levels stay yours.
- 25% fewer coins: 120 on each main map; 60 in The Playplace.
- 40% near roads, 60% elsewhere, with greater spacing.
- Rare purple 10-Iscoin coins, mainly on rooftops and water.
- Personal collection and three-minute respawns remain unchanged.
- One hidden vault at the bottom of the driving pause menu.
- Its textless circle has 40% opacity and requires 1,000,000 lifetime Aura.
- Vault entry costs nothing. Each of the 15 passcodes rewards an account once.

Sign in for vault rewards to persist across devices. See V2.24-Notes.md
for all passcodes, new upgrade prices, balance details and validation.

NO MUSIC
V2.24 does not load, package or serve the soundtrack. The patch also excludes
old music assets from Cloudflare uploads. If you previously uploaded the music
patch, its unused root files can be removed later: menu-music.js,
menu-music.css, menu-music.test.cjs, elektronomia-energy.mp3,
and Menu-Music-Notes.md. Their removal is not required for this build.

LOCAL CHECKS
Node.js 22+: npm ci, npm run build, npm run check:worker, npm test.
For private playtesting: npm run dev.
After editing source files, run node refresh-manifest.cjs before building.

This ZIP prepares the release; it has not been pushed or deployed for you.
