# ISLA menu soundtrack — testing patch

Adds the supplied MP3 as a looping soundtrack for the main menu, Map Maker library/editor, Search and map-detail pages. Music pauses during driving (including map tests), on other community pages, and when the browser tab is hidden. The normal engine and ambient audio controls are separate.

Open Music · Energy in the menu or community pages, or the music-note button in the editor, for the play/pause toggle, music volume and track credits. Preferences stay on the device. Playback position is saved in the same tab and restored when the browser and server support seeking; the track may restart after a full page navigation. Browsers may require a tap before playback starts or resumes. Music does not bypass autoplay restrictions.

The provided 199.47-second MP3 is copied without editing or re-encoding. One audio element loops it, and a Web Audio gain node supports the separate volume control on iOS. The single-file offline export embeds the supplied track.

## Attribution

Song: Elektronomia - Energy [NCS Release]
Music provided by NoCopyrightSounds
Free Download/Stream: https://ncs.io/energy
Watch: https://youtu.be/fzNMd3Tu1Zw

## Permission before public release

Prepared for private testing at the user's request. NCS's game-use FAQ directs game developers to its commercial licensing form; the credit-only video permission does not establish permission for embedding music in a game. The user will seek permission before publicly publishing the track in ISLA. This patch does not claim a license has been granted.

Official policy: https://ncs.io/usage-policy/1/faqs-usage-policy
Licensing form: https://eu-submit.jotform.com/nocopyrightsounds/commercial-license-request

## Scope

This is a soundtrack follow-up to V2.23. It does not implement the separately discussed vault or planned coin/upgrade balance changes.

## Verification

- All 12 targeted music-controller and existing touch-control tests passed.
- The world build, Cloudflare Worker dry-run and single-file offline export passed.
- Actual Map Maker library and Search pages played the supplied MP3, opened the controls and credits, and retained volume and off preferences across navigation.
- Main-menu driving transitions and editor layout were checked with the actual HTML/CSS in isolated fixtures. The test browser could not initialize WebGL, so full 3D driving and editor interaction were not verified.
- The music dialog fits a 390-pixel phone viewport. Physical iPad/Safari audio still needs device testing.
- The preview server did not expose a seekable audio range, so restoring the track position across full page navigation could not be verified there.
