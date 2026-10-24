'use strict';
// Recover folder structure when a manual upload placed every file at the root.
// A checked V1.9 manifest takes precedence over older structured files.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
// A complete V1.9 flat upload replaces its matching structured files atomically
// after every checksum passes. This prevents old folders shadowing new uploads.
const manifestPath=path.join(root,'isla-v16-upload.json');
if(fs.existsSync(manifestPath)){
  const crypto=require('node:crypto'),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(!['1.6','1.7','1.71','1.72','1.8','1.81','1.9'].includes(manifest.version)||!Array.isArray(manifest.files))throw Error('Invalid V1.9 upload manifest.');
  for(const f of manifest.files){if(!/^[\w .()-]+$/.test(f.name)||!/^((public|src|scripts|test)(\/regression)?\/)?[\w .()-]+$/.test(f.destination))throw Error('Invalid upload path.');const source=path.join(root,f.name);if(!fs.existsSync(source)||crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')!==f.sha256)throw Error('Incomplete V1.9 upload: upload '+f.name+' again from the ZIP.');}
  for(const f of manifest.files){if(f.name===f.destination)continue;const destination=path.join(root,f.destination);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(root,f.name),destination);}
}
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
    'garage.js','cars-v19.js','player-collisions.js','daylight.js','playplace.js','maps.js','peaks.js','specials.js','utility-cars.js','multiplayer.js','game.js',
    'maker-core.js','maker-assets.js','maker-selection.js','maker-driving.js','community-api.js','map-editor.js','community-ui.js','custom-map.js','community.css','editor-test.js','social-rules.js','social-ui.js','social.css']) restore('public/' + name);
  restore('public/traffic.js', {matches:text => /\bW\.initTraffic\s*=/.test(text) && !/\bexport\s/.test(text)});
  restore('src/traffic.js', {matches:text => /\bexport\s+(?:const|function)\s+freshTraffic\b/.test(text)});
  restore('src/worker.js');restore('src/community.js');restore('src/social.js');

  // The following build regenerates world-data.json from the browser world.
  restore('src/world-data.json', {optional:true});
  for (const name of ['build-world.cjs','source-world.cjs','upgrade-v16-config.cjs']) restore('scripts/' + name);
  restore('scripts/build-offline.cjs', {optional:true});
  for (const name of ['game.test.cjs','global.test.cjs','paint.test.cjs','touch.test.cjs','city.test.cjs','special-cars.test.cjs','utility-cars.test.cjs','peaks.test.cjs','peaks-network.test.cjs','maker.test.cjs','community.test.cjs','v16-integration.test.cjs','v17.test.cjs','units.test.cjs','social.test.cjs']) restore('test/' + name, {optional:true});
  for (const name of ['aura','garage','island','nitro','physics','ramp','traffic','truck','water']) {
    restore('test/regression/' + name + '-check.cjs', {optional:true});
  }
  require('./scripts/upgrade-v16-config.cjs')(root);
  const ignore = path.join(root,'public/.assetsignore');
  const ignored=fs.existsSync(ignore)?fs.readFileSync(ignore,'utf8').split(/\r?\n/):[];
  for(const entry of ['qa.js','qa.html','*qa*','ISLA-Drive.html','.*'])if(!ignored.includes(entry))ignored.push(entry);
  fs.writeFileSync(ignore,ignored.filter(Boolean).join('\n')+'\n');
  console.log(restored ? 'ISLA: restored ' + restored + ' files to their expected folders.' : 'ISLA: folder structure is ready.');
} catch (error) {
  console.error('ISLA upload check: ' + error.message);
  process.exitCode = 1;
}

