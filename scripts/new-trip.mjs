import {readFileSync,writeFileSync,existsSync} from 'node:fs';
if(!process.argv.includes('--confirm-new-site'))throw Error('Run only in your NEW copy: node scripts/new-trip.mjs --confirm-new-site');
if(existsSync('.wrangler/state'))throw Error('Local runtime state exists. Use a fresh checkout for a new trip.');
const path='.openai/hosting.json',config=JSON.parse(readFileSync(path,'utf8'));delete config.project_id;config.d1='DB';config.r2=null;writeFileSync(path,JSON.stringify(config,null,2)+'\n');
console.log('Template hosting identity cleared in this checkout. Create a NEW Site; never reconnect to the example Site. No remote resources changed.');
