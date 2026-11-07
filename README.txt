ISLA V2.34 — ISLAYAN PEAK

ONLINE UPDATE FOR YOUR EXISTING COMPLETE V2.33 REPOSITORY
1. Extract ISLA-V2.34-Online-Update.zip.
2. Open the ISLA-V2.34-Online-Update folder.
3. Upload all individual files in that folder to your repository ROOT,
   replacing matching files, in ONE batch. Commit the batch.
4. Keep all other repository files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or create a nested folder in the repository.
This patch requires the complete V2.33 repository; it is not a standalone
repository. Its manifest checks every required source file before building.

WHAT'S NEW
- Islayan Peaks is now Islayan Peak.
- The northern mountain stays in its original location; its summit is about
  616 m, roughly 20% above the old 513 m summit.
- The other four mountains are low snowy terrain.
- The map area, coastline, village plots and connected roads are retained.
- Online players share the new terrain. Older clients must refresh.
- Existing Aura, Iscoins, cars, upgrades and vault claims are retained.
- No new Aura farming penalties or reward-rate changes were added.

OFFLINE EDITION (SEPARATE DOWNLOAD)
Paste all text from ISLA-V2.34-Offline.txt into an HTML viewer as before.
It contains the same map remake plus existing password-protected Owner
Controls and dated History. The password and local save keys are unchanged.
Use the same browser/viewer to retain an existing offline save. Offline
progress is separate from online accounts and other devices.

LOCAL CHECKS
Node.js 22+: npm ci, npm run build, npm run check:worker, npm test.
After editing flat source files, run node refresh-manifest.cjs before building.

The update has not been pushed to GitHub or deployed for you.
