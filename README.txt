ISLA V1.72 — TEST FROM HERE + LOOP PHYSICS FIX

WHAT CHANGED

Map Maker now has a “Test from here” button beside Build, Edit, and Delete.
1. Click or tap “Test from here”.
2. Click or tap dry ground or an upright road surface to choose a temporary start.
3. Use the two turn buttons to point the arrow along your route.
4. Click “Start test drive”. The draft saves before driving starts.
5. “Retry test” starts you at that same spot again. “Back to editor” returns
   to your saved camera view and tools, with recent undo history retained.

The temporary test start does not move your starting diamond or change the
published map. This works with a mouse and with touch controls. Your garage
cars are available, and draft testing does not earn aura.

Slow cars can now roll back down loops or fall into their interior without
passing through the road. Free-flight movement also collides with road decks,
so losing grip does not turn the loop into a ghost surface.

UPDATE YOUR EXISTING ONLINE GAME

1. Extract ISLA-V1.72-Update.zip.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. On the repository's main file screen, choose Add file > Upload files.
4. Drag all 63 extracted files onto that screen. Upload the files themselves,
   not the ZIP and not the surrounding folder. Commit the changes.
5. Wait for your existing Cloudflare deployment to finish, then reload ISLA.
   The main menu should say V1.72.

Keep both existing Cloudflare Workers. Keep your existing wrangler.jsonc,
OWNER_ACCOUNT_ID, secrets, database bindings, and Worker settings. This update
ZIP intentionally does not contain a replacement wrangler.jsonc.

Your current game:
https://isla-global-multiplayer.cadocodes.workers.dev/

If Cloudflare asks for build settings, keep:
Build command: npm run build
Deploy command: npx wrangler deploy
Preview command: npx wrangler versions upload

The file isla-v16-upload.json retains its old filename for compatibility;
its version is 1.72. Upload it together with the other files. The build checks
every file before restoring the public, src, scripts, and test folders.

Existing accounts, maps, ownership, garage cars, and balances are preserved.
The previous Cado_Codes test credit is not applied again.

LOCAL PLAY

ISLA-Drive.html is also updated to V1.72. Open it in your usual browser and
refresh an existing tab to use the new editor and physics.
