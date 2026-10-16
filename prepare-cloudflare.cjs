'use strict';
// Recover folder structure when a manual upload placed every file at the root.
// Existing files in their proper folders always take precedence.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const looseFiles = fs.readdirSync(root, {withFileTypes:true})
  .filter(entry => entry.isFile()).map(entry => entry.name);
let restored = 0;

function restore(relative, {optional=false, matches=null}={}) {
  const destination = path.join(root, relative);
  if (fs.existsSync(destination)) {
    if (matches && !matches(fs.readFileSync(destination, 'utf8'))) {
      throw new Error(relative + ' contains the wrong traffic file. Upload the original matching file.');
    }
    return;
  }
  const basename = path.basename(relative);
  const candidates = matches
    ? looseFiles.filter(name => /^traffic(?: \(\d+\))?\.js$/i.test(name))
    : looseFiles.filter(name => name === basename);
  const sourceName = candidates.find(name => !matches || matches(fs.readFileSync(path.join(root,name),'utf8')));
  if (!sourceName) {
    if (optional) return;
    throw new Error('Upload is missing ' + relative + '. Upload ' + basename + ' from the complete ISLA package.');
  }
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.copyFileSync(path.join(root,sourceName), destination);
  restored++;
}

try {
  for (const name of ['index.html','style.css','THREE-LICENSE.txt','three.min.js',
    'world.js','islands.js','ramps.js','physics.js','aura.js','player-rules.js',
    'garage.js','multiplayer.js','game.js']) restore('public/' + name);
  restore('public/traffic.js', {matches:text => /\bW\.initTraffic\s*=/.test(text) && !/\bexport\s/.test(text)});
  restore('src/traffic.js', {matches:text => /\bexport\s+(?:const|function)\s+freshTraffic\b/.test(text)});
  restore('src/worker.js');
  // The following build regenerates world-data.json from the browser world.
  restore('src/world-data.json', {optional:true});
  for (const name of ['build-world.cjs','source-world.cjs']) restore('scripts/' + name);
  restore('scripts/build-offline.cjs', {optional:true});
  for (const name of ['game.test.cjs','global.test.cjs','paint.test.cjs']) restore('test/' + name, {optional:true});
  for (const name of ['aura','garage','island','nitro','physics','ramp','traffic','truck','water']) {
    restore('test/regression/' + name + '-check.cjs', {optional:true});
  }
  const ignore = path.join(root,'public/.assetsignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, 'qa.js\nqa.html\n.*\n');
  console.log(restored ? 'ISLA: restored ' + restored + ' files to their expected folders.' : 'ISLA: folder structure is ready.');
} catch (error) {
  console.error('ISLA upload check: ' + error.message);
  process.exitCode = 1;
}
