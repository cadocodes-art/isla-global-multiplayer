ISLA V2.38 — CURVED BOWLING + VAULT MUSIC + OWNER CONTROLS

ONLINE UPDATE FOR YOUR EXISTING COMPLETE V2.33 OR LATER REPOSITORY
1. Extract ISLA-V2.38-ONLINE-PLAYS-STATS.zip.
2. Open the matching ISLA-V2.38-ONLINE-PLAYS-STATS folder.
3. Upload all 75 individual files inside to your repository ROOT, replacing
   matching files, in ONE batch. Commit the batch.
4. Keep all other repository files and your existing wrangler.jsonc.
5. Let Cloudflare use your existing build/deploy configuration.

Do not upload the ZIP itself or create a nested folder in the repository.
This cumulative patch includes V2.34 through V2.37. It requires your complete
V2.33 or later repository. The build checks every required source and reports
which file to re-upload if anything is missing or from a different version.

NEW IN V2.38
- Online map cards and each map detail/stats page show Plays. Each new driving visit counts, including repeat
  visits by the same player or guest. Retries within one visit count only once.
  Popularity, trending and play milestones use total recorded visits. Existing
  recorded visits are preserved; previously unrecorded replays cannot be recovered.
- Bowling chooses a gentle random left/right curve once per roll. Players in
  a global room share the same server-controlled curve. Ball weight stays light;
  off-center contact and reduced pin scatter make strikes less automatic.
- Project 10 loops in the vault and stops when you leave. Opening the vault
  triggers audio; its music button can mute or retry blocked playback.
  Original music: Cado Codes. The game loads without an opening Start button.
- Offline Owner Controls can unlock several selected cars at once and unlock
  upgrade levels 2 or 3 on owned cars. Grants do not spend currency or downgrade
  existing unlocks; each grant is recorded in the dated History.
- A recovery fix avoids dry but steep custom-map banks that roll cars back into
  the same water basin. Recovery still searches for nearby safe land.

Mount Inferno, Inferno Vent and Project 13 are saved for a later update.
The original five main maps remain. The Mount inferno vault passcode still works.
If V2.4 files were already uploaded, the build excludes their retired assets.

OFFLINE EDITION (SEPARATE DOWNLOAD)
ISLA-V2.38-Offline.txt contains the complete standalone HTML as text.
Import the file directly into your HTML viewer. Project 10 is embedded;
no external game or audio downloads are needed.

Use the same browser/viewer to retain your existing offline progress. Save keys,
Owner Controls password verifier, dated History, balances, cars, upgrades and
vault claims are preserved. Map Maker maps remain practice only. Multiplayer,
accounts, friends, community Search and global leaderboards require the online
edition. Offline progress stays separate from online accounts.

BUILDING FROM SOURCE
npm run build prepares the Cloudflare folders and shared world data.
npm run build:offline regenerates the full standalone HTML and TXT in dist.
After editing flat sources, run node refresh-manifest.cjs before either build.

This update has not been pushed to GitHub or deployed for you.
