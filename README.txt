ISLA V2.3 — LEADERBOARDS + NPC AND DRIFT FIXES

UPLOAD PATCH — 23 FILES
1. Extract ISLA-V2.3-Upload-Patch.zip.
2. Open the ISLA-V2.3-Upload-Patch folder.
3. Upload its 23 individual files to the ROOT of your existing complete
   V2.24 repository in ONE batch, replacing matches and adding new files.
4. Commit that batch. Keep all other files and your existing wrangler.jsonc.
5. Let Cloudflare run your existing build/deploy configuration.

Do not upload the ZIP itself or put these files inside a new repository folder.
The server creates the new profile preference table automatically.

WHAT'S NEW
- NPC torsos, shirts and sleeves remain visible as people enter view.
- Sustained handbrake turns count toward drifting rewards.
- A Leaderboard button on the main menu and community navigation.
- Account-only Top 100 and You & friends, each with Aura, Iscoins and Stars.
- Aura uses lifetime earnings. Iscoins use current balances.
- Hidden Aura/Iscoins are excluded from that category before ranking.
- Global rank and friend rank are shown. Zero stars displays “Zero stars”
  and “—” for rank, and does not fill the Top 100 Stars list.
- Profile corner ranks are enabled by default and can be disabled under
  Customize profile. Hidden categories remain absent from the panel.

See V2.3-Notes.md for ranking details and validation.
The existing vault, 40% opacity circle and V2.24 coin balance are retained.
No music is included.

LOCAL CHECKS
Node.js 22+: npm ci, npm run build, npm run check:worker, npm test.
For playtesting: npm run dev.
After editing source files, run node refresh-manifest.cjs before building.

This ZIP prepares the release; it has not been pushed or deployed for you.
