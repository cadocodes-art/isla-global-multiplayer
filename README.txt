ISLA V1.81 — MAP MAKER GROUPS & COPY / PASTE

UPDATE THE ONLINE GAME
1. Extract ISLA-V1.81-Update.zip.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. On the repository's main file screen, choose Add file > Upload files.
4. Drag ALL files from inside the extracted folder onto the upload screen.
   Upload the files themselves, including isla-v16-upload.json — not the ZIP
   and not the folder containing them. Commit the changes.
5. Wait for the existing Cloudflare deployment, then reload the game.
   The main menu and community header will show V1.81.

Keep your current wrangler.jsonc, Worker name, OWNER_ACCOUNT_ID, secrets,
database bindings, and settings. This ZIP has no replacement wrangler.jsonc.
Use the existing isla-global-multiplayer Worker. No new Worker is needed.
No account, map, aura balance, car, or owner setting is reset by this update.
No new playtest aura is granted. Momster's recent credit is already saved.

Build command: npm run build
Deploy command: npx wrangler deploy
Preview command: npx wrangler versions upload

The old filename isla-v16-upload.json is intentional. Its version is 1.81.
It verifies the complete upload and restores the required folders at build.
This package has not been deployed automatically.

USING THE NEW TOOLS
- Open a map, select Edit, then choose Object.
- Multi-select: turn it on and tap objects to add or remove them.
- Box select: drag a rectangle to add the objects it touches. Clear empties
  the selection. Use Select to return to tapping. Shift-click also adds or
  removes objects on desktop; camera panning has its own Pan button.
- Every selected object has an outline. The dock shows the selection count.
- Copy remembers the selected objects. Paste shows a transparent preview.
  Tap or drag on the map to position it, then choose Place objects or Cancel.
- Duplicate copies the current selection and opens the same placement preview.
- Copy/Paste works between your maps in the same browser tab and account.
  Browser session storage must be allowed for the clipboard to survive leaving
  the editor. This is the Map Maker's own clipboard, not your device clipboard.
- Copies keep paint, sign text, surface, scale, elevation and all three angles.
  Terrain and ground paint are not included. The starting diamond is never
  duplicated; it can still be moved as part of a selected group.
- With multiple objects selected, use the direction / Up / Down buttons to
  move the whole group. Select a rotation axis, enter an angle, and tap Rotate
  group. Scale by 2 doubles the group; 0.5 halves it. Each object's final scale
  must stay between 0.25x and 4x. Focus group centers the camera on your objects.
- If a paste or transform exceeds a map limit, the entire action is rejected.
  Object origins must stay in the editable area. Limits remain 1,200 objects,
  64 traffic cars, and the existing permitted elevation range.
- Undo / Redo handles each paste or group transform as one action.
- Two fingers pan and pinch to zoom in every selection / placement mode.
  Buttons are sized for touch; the lower tool panel scrolls to more controls.
- Ctrl/Cmd+C: copy. Ctrl/Cmd+V: preview paste. Ctrl/Cmd+D: duplicate.
  Escape cancels a paste. Ctrl/Cmd+Z: undo. Ctrl/Cmd+Shift+Z: redo.
  Shortcuts do not interfere with typing in signs or other text fields.

Your game: https://isla-global-multiplayer.cadocodes.workers.dev/
