ISLA / CLOUDFLARE GLOBAL ROOM
Prepared October 16, 2026

This package is ready for you to upload and deploy. It has not been published
to your accounts. Use a new GitHub repository so this setup stays separate
from your other game on Render.

WHAT IS INCLUDED

- One shared global room, with a 32-driver playtest limit. No room codes.
- Global Room buttons in the opening screen and the top bar.
- A car-name prompt: 3-20 characters, A-Z/a-z, digits, underscores and periods.
  Names are checked both in the browser and on the server.
- Free garage paint: choose any color or enter a six-digit hex color.
  Each owned car remembers its own paint, visible to other drivers.
- Shared traffic, building damage, visible player names, and session aura.
- All five garage vehicles, including the 100,000-aura Big Truck.
- Solo driving remains available through Take the Wheel.

MANUAL SETUP: GITHUB

1. Extract ISLA-Cloudflare.zip into a new folder on your computer.
2. Sign in at https://github.com as cadocodes-art.
3. Open https://github.com/new and create a repository named
   isla-drive-cloudflare. Private is fine. Do not select your other game's
   repository. You can leave the initial README option off.
4. Open the new repository's upload link, or Add file > Upload files.
5. Drag the CONTENTS of the extracted folder into the upload area:
   public, src, scripts, test, package.json, package-lock.json,
   wrangler.jsonc, README.txt, .node-version, and .gitignore.
   Upload extracted files, not the ZIP itself or the outer enclosing folder.
6. Click Commit changes. At the repository's top level, you should see
   package.json and wrangler.jsonc beside the four folders.

MANUAL SETUP: CLOUDFLARE

7. Sign in at https://dash.cloudflare.com and select your account.
8. Go to Workers & Pages > Create application > GitHub
   (some screens label this Import a repository).
9. Connect GitHub. If asked which repositories Cloudflare may access, choose
   only isla-drive-cloudflare. Then select that repository in Cloudflare.
10. Use these settings:

    Worker/project name:   isla-drive
    Production branch:     main
    Root directory:        leave blank (repository root)
    Build command:         npm run build
    Deploy command:        npx wrangler deploy
    Node version:          automatic from the included .node-version file
    Workers plan:          Free

    The Worker name must match "name": "isla-drive" in wrangler.jsonc.
    If you already have a Cloudflare Worker with that name, choose a new name
    in BOTH the file and the dashboard before deploying.

    Choose a Workers project with a deploy command. This multiplayer server
    cannot run from a Pages/static-file-only upload. The package already
    configures its assets and SQLite Durable Object; you do not need to
    create a separate database, buy a domain, or add a server URL.

11. Click Save and Deploy. Wait for a successful production deployment.
12. Open the provided https://isla-drive.<your-subdomain>.workers.dev address.
    If Cloudflare asks you to choose a workers.dev subdomain, pick one and
    finish that account setup. The exact address appears in your dashboard.
13. Click Global Room, enter a name such as Cado_Truck.01, and join.
14. Share that same game address with a friend. Both drivers should appear
    in Global Room's player list. Press G in-game to choose paint.

Future commits to main automatically rebuild this Cloudflare game. This
procedure makes no changes to your Render service or its repository.

IF A STEP DOES NOT WORK

- Repository missing: check that Cloudflare's GitHub app can access the new
  repository under cadocodes-art, then refresh the repository picker.
- Missing package.json/wrangler configuration: the files may be nested one
  folder too deep. Move the extracted contents to the repository root, or
  set Root directory to the folder that actually contains package.json.
- Worker name mismatch: set the dashboard name to isla-drive, or change the
  name in wrangler.jsonc to exactly match the dashboard.
- Wrong Node version: set the build variable NODE_VERSION to 24.18.0 and retry.
- Asked for paid Durable Objects: this package uses SQLite, which supports
  Workers Free. Check that the uploaded wrangler.jsonc still includes
  new_sqlite_classes, and that you are deploying this Cloudflare package.
- Solo loads but joining fails: open your game address followed by /healthz.
  It should show ok:true, room:GLOBAL, capacity:32, version:2. If it does not,
  inspect the Cloudflare deployment log; a static-only upload is insufficient.
- Version mismatch: refresh both browser tabs after the deployment finishes.
- Room full: the limit is 32 drivers. Disconnected spots are held for 90 seconds.
- Lost connection: the game tries to reconnect. If the reservation expires,
  click Global Room and join again.

PLAYTEST DETAILS

Names and paint are public to everyone in this global room. Names are display
labels, not accounts or exclusive usernames. The strict profanity filter
checks common English and some other-language terms anywhere in a name,
including punctuation, repeated-letter, and common digit substitutions.
It can reject innocent words containing a blocked substring. No word list
can detect every language or creative spelling. Its list is in
public/player-rules.js and is shared by browser and server.

Other player cars currently pass through yours. Traffic and destruction are
shared. No player can rebuild the world while others are using it. The world
refreshes after it has been empty for ten minutes, once reconnect reservations
have expired. Brief server sleep preserves the room and damaged buildings.

Aura, owned cars, and paint save in each browser. There is no account/cloud-save
system. Your local downloaded game's save remains where it is; browsers do
not automatically transfer that save to the new workers.dev website. A new
browser or website address starts with a fresh garage. The room leaderboard
tracks aura earned in the current session. This version is for playtesting,
not a tamper-proof competitive economy.

FREE PLAN LIMITS

The project uses features available on Workers Free. Cloudflare currently
includes 100,000 Durable Object request units per day, with incoming WebSocket
messages counted at a 20:1 ratio. That is roughly 55 total active-driver hours
per day at this game's 10 updates/second, before other messages and requests.
It is an estimate, not a guarantee. Other account usage also consumes quotas.
There are separate compute/storage/build limits. Hibernation and slower parked
updates reduce usage. On Free, operations over the relevant limit fail; daily
limits reset at 00:00 UTC. Keep the Free plan selected and check usage during
playtests. A full 32-driver room cannot be promised unlimited daily uptime.

Verified official setup and pricing references:
https://developers.cloudflare.com/workers/ci-cd/builds/
https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
https://developers.cloudflare.com/durable-objects/platform/pricing/

OPTIONAL LOCAL DEVELOPMENT

Install Node.js 22 or later. From this folder:
  npm ci
  npm run dev

Open the local address printed by Wrangler. To run the automated checks:
  npm test

To produce a standalone solo HTML file:
  npm run build:offline

Production assets live in public. Server code lives in src. The build command
regenerates the server's island/traffic manifest from the same client world.
The test suite covers the original driving features, saved paint, name rules,
global joins, shared state, 32-driver capacity, reconnects, and real Durable
Object hibernation. No keys or account tokens are included in this package.
Three.js's license is included in public/THREE-LICENSE.txt.
