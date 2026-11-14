ISLA V2.42 - MANUAL ONLINE UPDATE

If your repository already has V2.41:
1. Download ISLA-V2.42-Online-Update.zip and extract it.
2. Open the extracted ISLA-V2.42-Online-Update folder.
3. In GitHub, open cadocodes-art/isla-global-multiplayer on the branch
   connected to Cloudflare. Stay on the repository's main file list,
   where package.json and prepare-cloudflare.cjs are shown.
4. Choose Add file > Upload files. Drag ALL FILES INSIDE the extracted
   folder onto the upload page. Do not upload the ZIP or enclosing folder.
5. Commit the files. Cloudflare should build and deploy automatically.
6. Refresh the game and check that the menu says V2.42.

If you have not uploaded V2.41 yet, use ISLA-V2.42-Complete-Source.zip
instead. Upload all files inside its extracted folder the same way.

Keep your existing Cloudflare settings:
  Build command: npm run build
  Deploy command: npx wrangler deploy
  Preview command, if requested: npx wrangler versions upload
  Root directory: blank (the repository root)
Keep your current Worker, bindings, account database and owner setting.
These ZIPs do not replace wrangler.jsonc. No worker deletion is needed.

OFFLINE
Open ISLA-V2.42-Offline.html, or import that file into your HTML viewer.
If you need to paste code, copy the entire contents of
ISLA-V2.42-Offline-PASTE-SMALL-No-Music.txt.
The compact version includes all 59 code modules and needs no server.
Both builds preserve the existing offline save namespace.
