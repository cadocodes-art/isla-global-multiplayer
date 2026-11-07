ISLA — MENU MUSIC TEST PATCH (V2.23)

PRIVATE TESTING
The supplied Energy MP3 is integrated for testing. Arrange NCS's game-use
permission before publishing this track publicly. See Menu-Music-Notes.md.

INSTALL ON A PRIVATE LOCAL COPY OF THE COMPLETE V2.23 REPOSITORY
1. Extract ISLA-Menu-Music-Test-Patch.zip.
2. Open the extracted ISLA-Menu-Music-Test-Patch folder.
3. Copy all 11 individual files into your local repository ROOT,
   replacing matching files and adding the new ones.
4. Keep all other files and your existing wrangler.jsonc.

For private local testing: Node.js 22+, npm ci, npm run dev.
Do not deploy this music patch to the public game before permission.

Music loops in the main menu, Map Maker, Search and map details.
It stops while driving and when the browser tab is hidden.
Open Music · Energy (or the editor's music-note button) for play/pause,
volume and credits. Your music preference saves on this device.
Tap if your browser needs interaction before starting the music.

The MP3 is your supplied file, unchanged. Attribution appears in-game.
This is a patch, not a full repository. It keeps V2.23's game behavior.
The planned vault and coin/upgrade pricing changes are not included.
Nothing has been published or uploaded to GitHub on your behalf.

After source edits, run node refresh-manifest.cjs before building.
