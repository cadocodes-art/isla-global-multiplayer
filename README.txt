ISLA V1.8 — FRIENDS, PROFILE UPDATES & MESSAGES

UPDATE YOUR EXISTING ONLINE GAME

1. Extract ISLA-V1.8-Update.zip.
2. Open https://github.com/cadocodes-art/isla-global-multiplayer
3. On the repository's main file screen, choose Add file > Upload files.
4. Drag ALL the extracted files onto that screen. Upload the files themselves,
   not the ZIP and not the surrounding folder. Commit the changes.
5. Wait for your existing Cloudflare deployment to finish, then reload ISLA.
   The main menu and community screens should say V1.8.

Keep BOTH existing Cloudflare Workers. Keep your existing wrangler.jsonc,
OWNER_ACCOUNT_ID, secrets, database bindings, and Worker settings. This update
ZIP intentionally does not contain a replacement wrangler.jsonc.

No new paid service, email setup, secret, or database binding is needed.
The existing community database gains the new social tables automatically.
Accounts, maps, approval ownership, aura, cars, and existing saves are retained.
The previous Cado_Codes test credit is NOT applied again.

Your game: https://isla-global-multiplayer.cadocodes.workers.dev/

If Cloudflare asks for build settings, keep:
Build command: npm run build
Deploy command: npx wrangler deploy
Preview command: npx wrangler versions upload

Upload isla-v16-upload.json too. Its old filename is intentional; its version
is now 1.8. It checks the upload and restores the correct folders during build.

HOW TO USE V1.8

- Main menu > profile dropdown > Friends & messages opens your inbox.
  Community screens also have a Friends button.
- Search for a creator, open their profile, and tap Add friend.
- Requests appear in Friends. The recipient must accept before either player
  can send a private message. Requests can also be declined or canceled.
- Open your profile to post an update (150 characters). Updates are public.
  Other signed-in players can like them. You can delete your own posts.
- Messages allow 500 characters. Received messages appear automatically while
  the conversation is open, usually within five seconds. Unread counts appear
  in the inbox. Load older messages to read further back.
- Liking someone's posts slightly favors their maps in Your feed. Sending them
  a friend request gives a larger boost; accepted friendships give a larger
  boost again. Canceling, unfriending, and unliking remove those boosts.
- Unfriend and Block are on the person's profile and in conversation Options.
  Blocking prevents new requests and messages in both directions. Unblocking
  does not automatically restore a friendship. Old messages remain reportable.

MESSAGE FILTERS & REPORTS

Profanity is censored in posts and messages. Message links and address-like
text are checked both in the composer and on the server before being stored.
Rejected messages stay in the composer so the sender can edit them; the account
is not banned. Checks include common web addresses, spaced/obfuscated links,
email addresses, street-address patterns, PO boxes, and coordinate pairs.
These are pattern checks, not a guarantee: unfamiliar formats or deliberate
disguises can evade them, and some innocent text may need rewording.

Use Report beside a received message. Reasons:
- Scam / phishing
- Inappropriate content
- Bullying / harassment
- Other (requires an explanation)

Public posts can also be reported. Map reports now offer:
- Bullying / harassment
- Inappropriate content
- Stolen content
- Other

Owner account > View my profile > Owner dashboard shows reports. The owner can
remove reported content and mark reports reviewed. Only the specific reported
message is provided as evidence; there is no owner UI for browsing private
conversations. Private messaging requires an account and an accepted friendship.
Messages are stored on the game server; this is not end-to-end encrypted chat.

Spam limits: one post per 20 seconds (up to 100 per day); one message per second
and up to 30 per minute; 15 new friend requests per hour. Login security is unchanged.

LOCAL FILE

ISLA-Drive.html is also updated. Driving and Map Maker still work locally.
Friends, profile posts, and messages require the online Cloudflare version.

The included ZIP is prepared for upload. It has not been deployed automatically.
