ISLA V2.4 — MOUNT INFERNO + ORIGINAL MUSIC + CURVED BOWLING

ONLINE UPDATE FOR YOUR EXISTING COMPLETE V2.33 OR LATER REPOSITORY
1. Extract ISLA-V2.4-MOUNT-INFERNO-ONLINE.zip.
2. Open the matching ISLA-V2.4-MOUNT-INFERNO-ONLINE folder.
3. Upload all 77 individual files inside to your repository ROOT, replacing
   matching files, in ONE batch. Commit the batch.
4. Keep all other repository files and your existing wrangler.jsonc.
5. Let Cloudflare use your existing build/deploy configuration.

Do not upload the ZIP itself or create a nested folder in the repository.
This cumulative patch includes V2.34 through V2.37. It requires your complete
V2.33 or later repository. The build checks every required source and reports
which file to re-upload if anything is missing or from a different version.

NEW IN V2.4
- Mount Inferno is the sixth main map: an abandoned volcanic landscape based
  on the sketch, with Galapo Village Ruins, Hally Hill, the dry Riptide Valley,
  Inferno Lake and South Pond. Both lakes are lava. There are no people or traffic.
- Fall through the crater to enter Inferno Vent. Its width and depth are 70%
  of the surface. A central pillar stands 10 meters above lava; six cave entries
  lead through connected tunnels, rock bridges and rope-hung platforms.
- Each layer has its own minimap, 240 personal coins and global multiplayer room.
  The top-left return button in the Vent asks before teleporting to the surface.
- Bowling chooses a gentle random left/right curve once per roll. Players in
  a global room share the same server-controlled curve. Ball weight stays light;
  off-center contact and reduced pin scatter make strikes less automatic.
- Press Start before the loading screen to enable the original looping music.
  Project 13 plays in the main menu, Map Maker MENU, Search and Leaderboard.
  Project 10 plays inside the unlocked vault. Both complete songs are included.
  Moving between menu pages preserves playback. Driving and the editor pause
  the soundtrack. A music toggle is available in menus. Music: Cado Codes.
- Offline Owner Controls can unlock several selected cars at once and unlock
  upgrade levels 2 or 3 on owned cars. Grants do not spend currency or downgrade
  existing unlocks; each grant is recorded in the dated History.
- A recovery fix avoids dry but steep custom-map banks that roll cars back into
  the same water basin. Recovery still searches for nearby safe land.

OFFLINE EDITION (SEPARATE DOWNLOAD)
ISLA-V2.4-MOUNT-INFERNO-Offline.txt contains the complete standalone HTML as text.
Import the file directly into your HTML viewer; it is about 10.6 MB because it
contains both full music tracks. No external game or audio downloads are needed.
The Start button appears after the compact file unpacks, before game loading.

Use the same browser/viewer to retain your existing offline progress. Save keys,
Owner Controls password verifier, dated History, balances, cars, upgrades and
vault claims are preserved. Map Maker maps remain practice only. Multiplayer,
accounts, friends, community Search and global leaderboards require the online
edition. Offline progress stays separate from online accounts.

BUILDING FROM SOURCE
npm run build prepares the Cloudflare folders and shared world data.
npm run build:offline regenerates the full standalone HTML and TXT in dist.
After editing flat sources, run node refresh-manifest.cjs before either build.

VALIDATION
Map geometry, physics, coins, account rewards, global synchronization, music
continuity, offline integrity and Owner Controls have automated coverage.
The Start screens and menu navigation were checked in the browser. This preview
browser could not create a WebGL context, so a full 3D visual playtest remains.
This update has not been pushed to GitHub or deployed for you.
