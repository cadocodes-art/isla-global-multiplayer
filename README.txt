ISLA V2.4 — UPDATE YOUR EXISTING GAME

ONLINE: https://isla-global-multiplayer.cadocodes.workers.dev/

1. Extract ISLA-V2.4-Online-Update.zip on your computer.
2. Open your existing isla-global-multiplayer repository on GitHub.
   Stay on its main file list — the page showing package.json and
   wrangler.jsonc together. Do not open the public or scripts folder.
3. Click Add file > Upload files. Drag ALL individual files from the
   extracted update folder onto that page. Commit them together.
   Upload the files, not the ZIP or its enclosing folder.
4. Keep all other V2.38 files and your existing wrangler.jsonc.
   Do not delete/recreate your Worker, databases, bindings or migrations.
5. Cloudflare should build and deploy from that commit with your existing
   settings. If fields need filling: build command = npm run build;
   deploy command = npx wrangler deploy; preview command =
   npx wrangler versions upload. Root directory stays the repository root.
6. After the deployment succeeds, refresh ISLA on each device. The main
   menu and community header should show V2.4. Your owner account keeps
   its access through the existing OWNER_ACCOUNT_ID setting.

The update preserves the Worker name and bindings in your configuration.
It enables keep_vars so dashboard-set variables survive deployments.
No new Cloudflare resources, email service or owner code are required.

OWNER DASHBOARD
Open your profile > Owner Dashboard. The new Stats / Accounts / Maps /
Comments / Moderation history sections are at the top. Existing reports
and approval tools are below. Player-count history begins with this update.

OFFLINE / iPAD / HTML VIEWERS
Use ISLA-V2.4-Offline.html as one complete HTML file. Prefer the viewer's
file import when available. If pasting instead, copy the ENTIRE contents
of ISLA-V2.4-Offline-PASTE-SMALL-No-Music.txt, not a preview or partial selection.
These are two encodings of the same offline game, with no network dependencies.
The encoded scripts are intentional: they protect the game from mobile
viewers altering JavaScript characters while importing/pasting.

Local Multiplayer replaces the Global Room button in the offline game.
Use it to start/leave split-screen or change the split direction. Both
players use the same map, shared wallet and owned garage cars.

REBUILDING FROM SOURCE (optional)
npm install
npm run build
npm run build:offline
The offline files are then in dist/. Build verifies every source checksum.
After editing a source file, run node refresh-manifest.cjs before building.

If your repository is missing old required files, use the separately
provided Complete Source ZIP to restore its flat files. Keep your existing
wrangler.jsonc. It is deliberately not included, so your live Worker identity
cannot accidentally be replaced by an example name.

See V2.4-Notes.md for the complete feature list and validation limits.
