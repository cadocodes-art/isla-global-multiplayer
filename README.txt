ISLA V1.6 — MAP MAKER, SEARCH & ACCOUNTS

START HERE

OCTOBER 18 — USERNAME ACCOUNTS AND OWNER DASHBOARD

No email address, paid domain, or email service is needed for accounts.
Players sign up with a username and password and save a private recovery
code. Your owner controls unlock only for the account ID you set in your
Cloudflare Worker. No signup or secret link can assign ownership.

OCTOBER 17 BUG FIXES — ALSO INCLUDED

This package includes the terrain, test-drive exit, and signup-button fixes.
Lowered ground now shows the real basin; horizon scenery cannot cover it.
Water recovery returns to stable dry land instead of a submerged road.
Save and play has a Back to editor button in the top-left corner, plus a
large return button in the pause menu. Account screens have Sign in and
Create account tabs at the top; the guest profile menu has separate buttons.
Previously saved maps use the corrected terrain automatically.
Account registration works immediately after this update deploys.

Use ISLA-V1.6-Accounts.zip (or the refreshed ISLA-V1.6-Update.zip) to update your existing GitHub repository.
The live game will change only after you upload these files and Cloudflare
finishes deploying. Your other multiplayer game is not involved.

1. Extract the update ZIP into a folder on your computer.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. Stay in the main file list — the page where package.json and your
   existing wrangler.jsonc appear. Do not open a subfolder.
4. Choose Add file > Upload files. Drag ALL the extracted files into it.
   Upload the actual files, not the ZIP or the folder containing them.
   Keep both traffic.js and traffic (1).js; they do different jobs.
   Include isla-v16-upload.json and upgrade-v16-config.cjs.
5. Commit the changes. Keep your existing wrangler.jsonc in the repository.
   It is deliberately absent from the update ZIP so your Worker name stays
   yours. The build adds the new account/map database binding automatically
   and preserves your existing global-room binding and migration history.
6. Let the existing Cloudflare deployment run. Keep these commands:
   Build:  npm run build
   Deploy: npx wrangler deploy
7. Refresh https://isla-globe-multiplayer.cadocodes.workers.dev/
   On a computer, use Ctrl+Shift+R if you still see the previous menu.

The upload checker verifies every update file before rebuilding the folder
structure. If it names a missing or changed file, upload that exact file
again from this ZIP. It also prevents older files in folders from silently
overriding a complete new flat upload.

ONE-TIME OWNER SETUP — AFTER UPLOADING THE UPDATE

1. Open the live ISLA game. Choose the profile icon > Create account.
   Pick your username and a password of at least 12 characters. You do not
   need to give the game, or ChatGPT, an email address.
2. Save the private recovery code shown after signup. You can download
   it as a text file or save it in your password manager. Keep it private;
   do not upload it to GitHub or send it in chat. Tick the saved checkbox
   and continue to your account.
3. On your profile, click Copy account ID. This ID is not a password.
4. Open Cloudflare > Workers & Pages > isla-globe-multiplayer > Settings
   > Variables and Secrets > Add. Choose Secret if a type is requested.
   In the name/key field enter exactly: OWNER_ACCOUNT_ID
   In the value field paste the account ID you copied.
   Save/deploy the change using Cloudflare's button. Storing it as a
   Secret also keeps it separate from settings in the GitHub files.
5. Refresh ISLA while signed into that account. Your profile now has
   Owner dashboard. Published map pages show your approval buttons.

You can bookmark the owner dashboard:
https://isla-globe-multiplayer.cadocodes.workers.dev/?view=owner

Anyone can know that address. Only your signed-in owner account can read
reports, approve maps, hide maps, or remove comments. The server checks
every action. Another player using your display name or editing the page
cannot acquire these permissions. The first person to sign up is NOT
automatically made the owner.

Existing ISLA accounts: use your current username and password. Previously
pending email accounts can also sign in with their original password.
Your garage and maps stay attached to the same account. First login will
provide a recovery code if you have not saved one yet. If already signed
in, open Password & recovery > Get a new recovery code.

This update replaces OWNER_EMAIL with OWNER_ACCOUNT_ID. The previous
EMAIL_API_KEY, EMAIL_FROM, and OWNER_EMAIL settings are unused; they do
not need to be deleted for this update to work. No emails are sent.

PASSWORDS AND RECOVERY

Forgot password? Enter your username, saved recovery code, and a new
password. Save the replacement recovery code shown afterward: the old
one stops working, and other signed-in sessions are signed out.
Password & recovery on your profile lets you change your password or
replace a recovery code using your current password. The game stores
hashes of passwords and recovery codes, never the readable originals.
Losing both your password and recovery code means losing account access.
There is no email reset. Account IDs cannot reset passwords or sign in.

YOUR EXISTING GARAGE

Guest saves remain on the device where you earned them. Signing in uses
your account garage. On your own profile, choose Import previous device
garage to bring your existing aura, cars, and paint into the new account.
Read the confirmation: this replaces the account garage and can happen
only once per account. Do this on the device with the save you want.
After that, sign into the same account on another device to use its garage.
No new test aura is added by this update.

Device-made maps can be copied into an account with Import device maps in
Map Maker. Your original local maps remain on that device. Cloud account
maps and device maps are separate, so signing out returns to the device's
own library and garage. Use one editor tab per map to avoid overwriting a
newer save from another tab or device.

MAP MAKER

- 30 original map slots; separate Level copies and Trash sections.
- Five templates: Grassy plains, Sandy shores, Ocean, Snowy, Road mania.
- Pick 1,024 m, 2,048 m, or 4,096 m square after choosing the template.
  Template scenery continues beyond the editable area.
- Build tools occupy the bottom quarter. Drag a tile into the preview,
  or choose it and tap the ground. Pan, Orbit, and zoom controls also work
  on mobile. On desktop, right-drag orbits, Shift-drag pans, wheel zooms.
- Each visible grid square is 1 square meter. The grid follows your view.
- Trees, roads, homes, buildings, skyscrapers, apartments, rocks, bushes,
  ramps, traffic cars, and one starting diamond are included.
- Choose asphalt or stone for straight, curved, and intersection roads.
  Join road pieces at their ends. Traffic follows connected road pieces;
  it turns back at road ends. No roads means no moving traffic.
- Edit has separate Object and Ground / water modes. Roads follow the
  ground underneath. Move objects by 0.25, 0.5, 1, or 5 m; rotate and scale
  from 0.25x to 4x. The diamond arrow chooses the starting direction.
- Ground elevation uses smooth hills and basins. Below 0 m fills with
  water; raise the ocean floor above 0 m to make land. Paint grass, sand,
  or snow in individual cells or use a larger brush.
- Undo/Redo retain the last 40 edits during an editing session. Ctrl+Z
  undoes, Ctrl+Y redoes. Delete selected or all of the same kind.
- The corner menu has Save and play map, Save and exit map, and Save map.
  During a test drive, use Back to editor at the top left to return.
  Changes also autosave every 30 seconds. Save before closing the tab.
- First Save and exit asks for a name (30 characters) and description
  (150 characters). Each save updates the thumbnail from your editor view.
- Trash can restore maps for five days. After that, they are permanently
  purged. Deleting a published map also removes it from public discovery.
- Sharing publishes a snapshot. Editing a draft leaves the last shared
  version playable. Sharing again publishes a new, unapproved version.
- Everyone drives their own garage cars. The starting diamond is hidden
  during driving. Draft testing and unapproved maps do not earn aura.

Limits per map: 1,200 objects, 64 traffic cars, 200 terrain edits, and
12,000 painted cells. These keep custom maps practical in a browser.
Small maps are the easiest choice on phones.

SEARCH, ACCOUNTS & APPROVAL

- Seven tabs: Latest approved, Latest unapproved, Most popular approved,
  Most popular unapproved, Trending, Potential, and Your feed.
- Searches include maps and creators, sorted by popularity, 9 per page.
- Popularity combines unique drivers and likes. Trending emphasizes the
  most recent 48 hours. Potential includes maps by creators with approved
  maps. Your feed uses follows, played creators, and liked-map templates.
- Map pages have solo play, a global room for that map, likes, comments,
  reports, and copying. Each global room holds up to 32 drivers.
- Comments have a 150-character limit and a server-enforced 20-second
  cooldown. Common profanity is censored. Reports reach the owner.
- Copies retain creator credit and cannot receive approval. Identical
  reuploads are also linked to their source. Manual review is still needed
  for edited copies and reports; automatic similarity checks are limited.
- Only owner-approved published versions award aura. Republishing or
  revoking approval removes that version's eligibility and approval star.
- Profiles show username, stars, followers, uploaded maps, an optional
  aura count, and Summer / Cosmic / Snowy themes.
- Guests can choose a driving name and join global rooms with a Guest
  label. They cannot upload maps or have a profile. Social actions that
  need an identity ask players to sign in.
- Passwords are hashed, never displayed. Sessions use secure cookies.
  Forgotten passwords use saved recovery codes; profile settings can change them.

LOCAL VERSION

ISLA-Drive.html is also updated. Open it at the same location and in the
same browser to retain your previous offline garage. Local Map Maker and
test driving work without a server. Accounts and public Search require
the online game. Local map drafts use this browser's IndexedDB storage.
Clearing browser site data removes guest saves and local drafts.

FULL PROJECT ALTERNATIVE

ISLA-Cloudflare.zip contains the structured project for working with
public/, src/, scripts/, and test/ folders directly. For your existing
site, keep your existing wrangler.jsonc and run the included build so it
adds V1.6 bindings without changing your Worker name. Do not replace your
Worker configuration with the full project's example name, isla-drive.
Use either the flat update workflow above or the structured project.

VALIDATION & PRACTICAL LIMITS

The package has automated checks for the existing driving game plus
account signup/recovery, authorization, map validation, publication
snapshots, copied-map provenance, comments, cloud garage purchases,
approved-map aura eligibility, and custom multiplayer rooms.
The editor's save/play flow and community screens were also tested locally.
Accounts and recovery need no outgoing email setup.

The community database is a single SQLite Durable Object, designed for
this initial community release. It is not load-tested for a large public
launch. Cloudflare usage limits still apply:
https://developers.cloudflare.com/durable-objects/platform/pricing/

Aura awards have server checks, limits, and duplicate protection, but
driving physics still run in the browser. This is not a fully authoritative
anti-cheat system. The one-time legacy garage import intentionally trusts
the device save. Approval and account ownership are checked on the server.
