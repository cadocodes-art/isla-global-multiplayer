ISLA V2.22 — TRAILS & JOYSTICK FOLLOW-UP

INSTALL ON YOUR EXISTING V2.22 REPOSITORY
1. Extract ISLA-V2.22-Trails-Controls.zip.
2. Open the extracted ISLA-V2.22-Trails-Controls folder.
3. Upload ALL 7 individual files inside to the GitHub repository ROOT,
   replacing the matching files. They fit in one upload batch.
4. Click Commit changes after all 7 files are queued.
5. Let Cloudflare finish deploying, then reload. The menu and /healthz
   endpoint should show V2.22 / 2.22.

Upload the extracted files, not the ZIP or enclosing folder. Keep all other
existing files and wrangler.jsonc. This is a patch, not a replacement repo.
If the build reports an incomplete upload, replace the exact file named in
that error using the file from THIS patch, then commit again.

NEW IN THIS FOLLOW-UP
- Colored trails are substantially wider and brighter, with soft edges.
- They retain the chosen trail color and ten-second fade.
- Joystick moves 30 pixels up and 40 pixels right from the prior V2.22.
- Extra touch/gesture suppression on the joystick helps prevent Safari zoom.
- Nearby phone controls reflow to stay clear of the relocated joystick.

V2.22 UPGRADES STILL INCLUDED IN YOUR EXISTING GAME
- Level 2: +25% normal nitro speed and engine power over Level 1.
- Level 3: +50% normal nitro speed and engine power over Level 1.
- Most Level 2 cars: 6–8-second nitro, six-second refill.
- Most Level 3 cars: 8–10-second nitro, five-second refill.
- Car-specific abilities are stronger across all 19 upgrade paths.
- Examples: Flappy 30/40 flaps, Nuker Level 2 fires every six seconds,
  Ultra 10/12-second rocket bursts, and much stronger hops/dashes.
- Upgrade screens explicitly show speed/engine gain versus Level 1.
- Small-phone layouts keep camera, recovery, nitro and handbrake clear.

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
