ISLA V2.22 — STRONGER UPGRADES

INSTALL ON YOUR EXISTING V2.21 REPOSITORY
1. Extract ISLA-V2.22-Patch.zip.
2. Open the extracted ISLA-V2.22-Patch folder.
3. Upload ALL 20 individual files inside to the GitHub repository ROOT,
   replacing the matching files. They fit in one upload batch.
4. Click Commit changes after all 20 files are queued.
5. Let Cloudflare finish deploying, then reload. The menu and /healthz
   endpoint should show V2.22 / 2.22.

Upload the extracted files, not the ZIP or enclosing folder. Keep all other
existing files and wrangler.jsonc. This is a patch, not a replacement repo.
If the build reports an incomplete upload, replace the exact file named in
that error using the file from THIS patch, then commit again.

UPGRADES THAT FEEL DIFFERENT
- Level 2: +25% normal nitro speed and engine power over Level 1.
- Level 3: +50% normal nitro speed and engine power over Level 1.
- Most Level 2 cars: 6–8-second nitro, six-second refill.
- Most Level 3 cars: 8–10-second nitro, five-second refill.
- Car-specific abilities are stronger across all 19 upgrade paths.
- Examples: Flappy 30/40 flaps, Nuker Level 2 fires every six seconds,
  Ultra 10/12-second rocket bursts, and much stronger hops/dashes.
- Upgrade screens explicitly show speed/engine gain versus Level 1.
- Joystick moves another 24 pixels right. Small-phone layouts keep camera,
  recovery, nitro and handbrake controls clear of it.

All Level 1 specifications and purchase prices are unchanged. Previously
bought upgrades receive the stronger stats automatically. Saves and the
one-time Cado_Codes test credit remain intact. Water Skidder still has a
30-second water budget and ten-second land recharge. Nuker Level 3 manual
fire still has its five-second cooldown.

Read V2.22-Notes.md for exact speeds, abilities, upgrade costs and testing.
This package has not been uploaded to your GitHub or deployed for you.

DEVELOPMENT
Use Node.js 22+, npm ci, npm test. After source edits, run
node refresh-manifest.cjs before building. The upload manifest retains its
historical filename isla-v16-upload.json and declares version 2.22.
