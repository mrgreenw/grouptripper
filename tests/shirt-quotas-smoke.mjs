import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {emptyBoard,emptyGuest} from '../app/lib/trip.ts';
const base=process.env.GROUPTRIPPER_TEST_URL||'http://127.0.0.1:5174';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Disposable loopback only');
const testers=['00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000021'];
const members=[...testers,...Array.from({length:6},()=>crypto.randomUUID())],trip=crypto.randomUUID(),time=Math.floor(Date.now()/1000),suffix=randomBytes(5).toString('hex');
const tokens=members.map(()=>randomBytes(32).toString('hex')),q=s=>"'"+String(s).replaceAll("'","''")+"'",hash=s=>createHash('sha256').update(s).digest('hex');
function sql(command){return JSON.parse(execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',command,'--json'],{encoding:'utf8'}));}
const idea={idea:'A fictional pine tree shirt for a local test.',headline:'Local test',slogan:'',shirtColor:'Cream',nsfw:false};
async function req(i,body,path='/api/shirts'){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:'grouptripper_local='+tokens[i],...(body?{Origin:base,'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
const submit=(i,extra={})=>req(i,{...idea,...extra,requestId:crypto.randomUUID()}),cancel=(i,id)=>req(i,{action:'cancel',id});
function seed(member,n,age=0){const ids=[];for(let i=0;i<n;i++){const id=crypto.randomUUID();ids.push(id);sql(`INSERT INTO shirt_jobs (id,trip_id,member_id,author,input,status,created_at,updated_at,deleted_at) VALUES (${q(id)},${q(trip)},${q(member)},'Local test',${q(JSON.stringify(idea))},${q(i%2?'failed':'cancelled')},${time-age},${time},${i%3?'NULL':time});`);}return ids;}
let seeded=false,originalControls;
try{
 assert.equal(sql('SELECT COUNT(*) AS n FROM grouptripper_accounts')[0].results[0].n,0,'Use empty disposable local storage');
 const board=emptyBoard();board.guests=members.map((id,i)=>emptyGuest(id,'Quota test '+i));
 sql(`INSERT INTO grouptripper_spaces (id,code,created) VALUES (${q(trip)},${q('trip-'+randomBytes(12).toString('hex'))},${Date.now()});INSERT INTO grouptripper_trip (id,data,revision) VALUES (${q(trip)},${q(JSON.stringify(board))},0);`);seeded=true;
 for(const [i,id] of members.entries())sql(`INSERT INTO grouptripper_accounts (id,username,password,created) VALUES (${q(id)},${q('quota '+i+' '+suffix)},'local-test-no-login',${Date.now()});INSERT INTO grouptripper_memberships (member,trip,role) VALUES (${q(id)},${q(trip)},'organizer');INSERT INTO grouptripper_sessions (token,member,trip,expires) VALUES (${q(hash(tokens[i]))},${q(id)},${q(trip)},${Date.now()+3600000});`);
 originalControls=sql("SELECT shirtsPaused,designsTotal FROM grouptripper_controls WHERE id='demo'")[0].results[0];
 const start=await req(0);assert.equal(start.status,200);assert.equal(start.data.limits.personal,20,'Set local SHIRT_TEST_ACCOUNT_IDS to the two test IDs');assert.equal(start.data.limits.pool,'testing');assert.equal((await req(2)).data.limits.personal,2);assert.equal((await req(0,undefined,'/api/admin')).status,401);
 seed(testers[0],2,86401);assert.equal((await req(0)).data.limits.personalRemaining,20);
 const publicIds=[];for(let i=3;i<8;i++)publicIds.push(...seed(members[i],2));
 assert.equal((await req(2)).data.limits.totalRemaining,0);assert.equal((await submit(2,{admin:true,pool:'testing',personal:20})).status,429);
 const first=await submit(0);assert.equal(first.status,201,JSON.stringify(first.data));assert.equal((await submit(0)).status,429);await cancel(0,first.data.id);assert.equal((await req(0)).data.limits.personalRemaining,19);
 seed(testers[0],18);const race=await Promise.all([submit(0),submit(0)]);assert.deepEqual(race.map(r=>r.status).sort(),[201,429]);await cancel(0,race.find(r=>r.status===201).data.id);
 assert.equal((await submit(0)).status,429);assert.equal((await req(0)).data.limits.personalRemaining,0);assert.equal((await req(1)).data.limits.personalRemaining,20);assert.equal((await submit(1)).status,429,'Test pool cap applies across configured accounts');
 for(const id of publicIds.slice(0,3))sql(`UPDATE shirt_jobs SET created_at=${time-86401} WHERE id=${q(id)}`);
 assert.equal((await req(2)).data.limits.totalRemaining,3,'Testing usage does not consume guest quota');
 for(let i=0;i<2;i++){const result=await submit(2);assert.equal(result.status,201);await cancel(2,result.data.id);}assert.equal((await submit(2)).status,429,'Ordinary per-account cap remains two');
 sql(`UPDATE shirt_jobs SET created_at=${time-86401} WHERE id=${q(first.data.id)}`);
 assert.equal((await req(0)).data.limits.personalRemaining,1);
 sql("UPDATE grouptripper_controls SET shirtsPaused=1 WHERE id='demo'");assert.equal((await submit(0)).status,429,'Admin testing still respects pause');
 sql("UPDATE grouptripper_controls SET shirtsPaused=0,designsTotal=(SELECT COUNT(*) FROM shirt_jobs) WHERE id='demo'");assert.equal((await submit(0)).status,429,'Admin testing still respects storage cap');
 console.log('PASS: independent guest/testing pools; configured-ID restriction; request spoof rejection; 20/day, 2/day, 10 shared/day and 1 pending; atomic race; cancelled/hidden/failed jobs count; rolling expiry; owner access remains protected; pause and storage caps apply.');
}finally{
 if(seeded){if(originalControls)sql(`UPDATE grouptripper_controls SET shirtsPaused=${originalControls.shirtsPaused},designsTotal=${originalControls.designsTotal} WHERE id='demo'`);const ids=members.map(q).join(',');sql(`DELETE FROM shirt_jobs WHERE trip_id=${q(trip)};DELETE FROM grouptripper_sessions WHERE member IN (${ids});DELETE FROM grouptripper_memberships WHERE member IN (${ids});DELETE FROM grouptripper_accounts WHERE id IN (${ids});DELETE FROM grouptripper_spaces WHERE id=${q(trip)};DELETE FROM grouptripper_trip WHERE id=${q(trip)};`);console.log('Disposable quota fixtures removed.');}
}
