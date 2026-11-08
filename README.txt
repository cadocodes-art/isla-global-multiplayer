ISLA V2.35 — NEAREST LAND RESPAWN

ONLINE UPDATE FOR YOUR EXISTING COMPLETE V2.33, V2.34 OR V2.35 REPOSITORY
1. Extract ISLA-V2.35-NEAREST-LAND-RESPAWN-ONLINE.zip.
2. Open the ISLA-V2.35-NEAREST-LAND-RESPAWN-ONLINE folder.
3. Upload all 25 individual files inside to your repository ROOT, replacing
   matching files, in ONE batch. Commit the batch.
4. Keep all other repository files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or create a nested folder in the repository.
This cumulative patch includes the V2.34 changes. It requires your complete
V2.33, V2.34 or V2.35 repository; every required source is checked before building.

WHAT'S NEW IN THIS V2.35 REVISION
- Sinking returns you to the nearest safe dry land near where you sank.
- Recover while in water uses the same nearby-land search.
- The new shore replaces your old recovery point; another Recover cannot
  send you back to the road you visited before flying over the sea.
- Recovery avoids water edges, steep ground and solid obstacles.
- Jump rewards and normal dry-ground recovery are unchanged.
- A custom map with no safe dry land falls back to its authored start.

ALSO INCLUDED FROM V2.35
- Ten NPC skin tones from light to deep brown, with matching faces and hands.
- The plateau moves to the old southeast mountain site, between East Valley
  Road and South Shore Road, more than 2 km from the remaining mountain.
- Its flat top is now 111 m high: about 18% of the 616 m mountain summit.
- The old southern plateau is removed. Town plots and roads are preserved.
- The taller northern mountain and V2.34 chalet roof fixes are retained.
- Older online clients must refresh to join the new terrain revision.
- Existing Aura, Iscoins, cars, upgrades and vault claims are retained.

OFFLINE EDITION (SEPARATE DOWNLOAD)
Paste all text from ISLA-V2.35-NEAREST-LAND-RESPAWN-Offline.txt into an HTML viewer as before.
It contains the same changes plus existing Owner Controls and dated History.
The password verifier and save keys are unchanged. Use the same browser/viewer
to retain an existing offline save. Offline progress is separate from online
accounts and other devices.

After editing flat source files, run node refresh-manifest.cjs before building.
The update has not been pushed to GitHub or deployed for you.
