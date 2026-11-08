ISLA V2.36 — PLAY PLACE UPDATE

ONLINE UPDATE FOR YOUR EXISTING COMPLETE V2.33, V2.34 OR V2.35 REPOSITORY
1. Extract ISLA-V2.36-PLAY-PLACE-ONLINE.zip.
2. Open the ISLA-V2.36-PLAY-PLACE-ONLINE folder.
3. Upload all 39 individual files inside to your repository ROOT, replacing
   matching files, in ONE batch. Commit the batch.
4. Keep all other repository files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or create a nested folder in the repository.
This cumulative patch includes the V2.34 and V2.35 changes. It requires your
complete V2.33 or later repository; every source is checked before building.

NEW IN V2.36
- Removed the restaurant, shop and police station from Play Place.
- Exactly 100 personal Iscoin slots in Play Place; other main maps keep 240.
- Random coins on sky bridges, elevated roads and water slides, as well as
  the floor and water park. Pool coins float above the water surface.
- Fresh layouts each visit; personal three-minute pickup cooldowns remain.
- Trampoline jump Aura is now 20% of its previous amount, including chain
  and air-trick multipliers. Bounce height and normal jump rewards stay the same.
- Older Play Place clients must refresh to join its updated global room.

ALSO INCLUDED
- Water recovery uses the nearest safe dry land, not your last road.
- Diverse NPC skin tones, the lower southeast plateau between the roads,
  the taller single Islayan Peak, and corrected chalet roofs.
- Existing Aura, Iscoins, cars, upgrades and vault claims are retained.

OFFLINE EDITION (SEPARATE DOWNLOAD)
Paste all text from ISLA-V2.36-PLAY-PLACE-Offline.txt into an HTML viewer as before.
It contains the same changes plus existing Owner Controls and dated History.
The password verifier and save keys are unchanged. Use the same browser/viewer
to retain an existing offline save. Offline progress is separate from online
accounts and other devices.

After editing flat sources, run node refresh-manifest.cjs before building.
This update has not been pushed to GitHub or deployed for you.
