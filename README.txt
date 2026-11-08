ISLA V2.37 — SPORTS AND SOLO FIXES

ONLINE UPDATE FOR YOUR EXISTING COMPLETE V2.33 OR LATER REPOSITORY
1. Extract ISLA-V2.37-SPORTS-ONLINE.zip.
2. Open the matching ISLA-V2.37-SPORTS-ONLINE folder.
3. Upload all 47 individual files inside to your repository ROOT, replacing
   matching files, in ONE batch. Commit the batch.
4. Keep all other repository files and your existing wrangler.jsonc.
5. Let Cloudflare use your existing build/deploy configuration.

Do not upload the ZIP itself or create a nested folder in the repository.
This cumulative patch includes V2.34 through V2.36. It requires your complete
V2.33 or later repository; every required source is checked before building.

NEW IN V2.37
- Scoring a basket in Play Place gives 7,000-9,000 Aura to the scoring driver.
  Repeated bounces without a fresh push do not generate extra rewards.
- Flap, Rocket and other ability buttons move 40 pixels left and 40 pixels up.
- Bowling balls have half the weight; they roll more easily from gentle pushes.
- Solo Santa Luz and Santa Ruiz palm trees keep their proper colors.
- Older Play Place clients must refresh to join the updated global room.

OFFLINE EDITION (SEPARATE DOWNLOAD)
Paste all text from ISLA-V2.37-SPORTS-Offline.txt into an HTML viewer as before.
It contains the same changes. Map Maker maps are now practice only: they do
not award Aura or Iscoins. Rewards on the five built-in maps still work.
Owner Controls, dated History, current balances, cars, upgrades and vault claims
are retained. The password verifier and save keys are unchanged. Use the same
browser/viewer to retain your offline save. Offline progress stays separate
from online accounts and other devices.

ALSO INCLUDED
- Play Place has no concession buildings and has 100 personal coin slots,
  including sky bridges and the water park. Other main maps keep 240.
- Trampoline Aura is 20% of its former amount; bounce height stays the same.
- Water recovery uses nearby safe land rather than the last road.
- Varied NPC skin tones, the lower southeast plateau between the roads,
  the taller single Islayan Peak, and corrected chalet roofs.

After editing flat sources, run node refresh-manifest.cjs before building.
This update has not been pushed to GitHub or deployed for you.
