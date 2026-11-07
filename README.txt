ISLA V2.23 — SPEED-BASED BUILDING DAMAGE

INSTALL ON YOUR EXISTING V2.22 REPOSITORY
1. Extract ISLA-V2.23-Patch.zip.
2. Open the extracted ISLA-V2.23-Patch folder.
3. Upload all 13 individual files inside to the GitHub repository ROOT,
   replacing matching files and adding the two new files. Use one batch.
4. Click Commit changes. Keep all other files and wrangler.jsonc.
5. Wait for Cloudflare to deploy, then reload. The menu should show V2.23
   and /healthz should report release 2.23.

Upload the extracted files, not the ZIP or its enclosing folder.
This is a patch for the complete V2.22 upload, including the trails and
joystick follow-up. It is not a replacement repository.

WHAT CHANGES
- Faster direct rams deal more building damage, with no old 44-point cap.
- Standard car examples: about 23 damage at 100 km/h, 65 at 150 km/h,
  and a full-health building destroyed by a direct 200 km/h impact.
- Vehicle mass and purchased ramming upgrades still increase damage.
- Beast keeps its instant-demolition ability.
- Solo and global multiplayer use the same damage calculation.
- Sideways scraping and slow pushing remain harmless; the existing
  per-building contact cooldown and Aura reward rules remain in place.

Your V2.22 upgrades, thicker trails, relocated joystick, balances and saves
remain intact. No additional test currency is granted by this patch.
This package has not been uploaded to GitHub or deployed for you.

Read V2.23-Notes.md for behavior and validation details.

DEVELOPMENT
Use Node.js 22+, npm ci, npm test. After changing source files, run
node refresh-manifest.cjs before building. The upload manifest keeps its
historical filename isla-v16-upload.json and declares version 2.23.
