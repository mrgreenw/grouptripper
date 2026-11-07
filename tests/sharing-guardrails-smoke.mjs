import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base=process.env.GROUPTRIPPER_TEST_URL||'http://127.0.0.1:5174';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Disposable loopback only');
const suffix=crypto.randomUUID().slice(0,8),prefix='share-test-'+suffix,password='local-demo-test-only';
function sql(s){return JSON.parse(execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',s,'--json'],{encoding:'utf8'}));}
async function req(path,cookie='',body,headers={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{Origin:base,'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json().catch(()=>null),cookie:r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ')};}
const registration=(label,code)=>({type:'register',groupAction:code?'join':'create',name:'QA '+label,username:prefix+label,tripName:prefix+label,templateId:'golf-trip',password,...(code?{code}:{})});
let original,owner;const createdTrips=[];
async function controls(patch){const state=await req('/api/admin',owner);const result=await req('/api/admin',owner,{...state.data.controls,...patch,revision:state.data.controls.revision,action:'controls'});assert.equal(result.status,200,JSON.stringify(result));return result.data;}
async function signup(label,code){const r=await req('/api/auth','',registration(label,code));assert.equal(r.status,200,JSON.stringify(r));const s=(await req('/api/trip',r.cookie)).data;if(!code)createdTrips.push(s.tripId);return {...s,cookie:r.cookie};}
try{
 sql('DELETE FROM grouptripper_limits');
 const sign=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'});owner=sign.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 original=(await req('/api/admin',owner)).data.controls;await controls({tripsPaused:0,accountsPaused:0,shirtsPaused:0});
 const a=await signup('a'),b=await signup('b',a.inviteCode);
 assert.equal((await req('/api/admin',a.cookie,{...original,action:'controls'})).status,401);
 assert.equal((await req('/api/admin',owner,{...original,action:'controls'},{Origin:'https://evil.example'})).status,403);
 assert.equal((await req('/api/invite',b.cookie,{action:'rotate',revision:0})).status,403);
 assert.equal((await req('/api/invite',a.cookie,{action:'pause',revision:0})).status,200);
 assert.equal((await req('/api/auth','',registration('paused',a.inviteCode))).status,403);
 assert.equal((await req('/api/trip',b.cookie)).status,200);
 assert.equal((await req('/api/invite',a.cookie,{action:'resume',revision:0})).status,409);
 assert.equal((await req('/api/invite',a.cookie,{action:'resume',revision:1})).status,200);
 const rotated=await req('/api/invite',a.cookie,{action:'rotate',revision:2});assert.equal(rotated.status,200);assert.notEqual(rotated.data.inviteCode,a.inviteCode);assert.equal(rotated.data.inviteCode.length,29);
 assert.equal((await req('/api/auth','',registration('old',a.inviteCode))).status,401);
 const c=await signup('c',rotated.data.inviteCode);assert.equal(c.tripId,a.tripId);
 // Existing membership can reopen a valid invite without duplicating a guest.
 assert.equal((await req('/api/auth',b.cookie,{type:'add-group',groupAction:'join',name:'QA b',code:rotated.data.inviteCode})).status,200);
 assert.equal((await req('/api/trip',b.cookie)).data.board.guests.length,3);
 await controls({tripsPaused:1,accountsPaused:1,shirtsPaused:1});
 assert.equal((await req('/api/auth','',registration('cap'))).status,429);
 assert.equal((await req('/api/auth',a.cookie,{...registration('extra'),type:'add-group'})).status,429);
 assert.equal((await req('/api/auth','',{type:'login',username:prefix+'a',password})).status,200);
 const gallery=await req('/api/shirts',a.cookie);assert.equal(gallery.status,200);assert.equal(gallery.data.enabled,false);assert.match(gallery.data.unavailable,/paused/);
 const idea={idea:'A fictional mountain badge for the local test.',headline:'QA',locationLine:'',eventLine:'',slogan:'',extraLines:'',shirtColor:'Cream',nsfw:false,requestId:crypto.randomUUID()};
 assert.equal((await req('/api/shirts',a.cookie,idea)).status,429);
 const before=(await req('/api/admin',owner)).data.usage;
 await controls({accountsPaused:0,tripsPaused:0,shirtsPaused:0,tripsDaily:before.tripsToday+1,accountsDaily:before.accountsToday+1});
 const raced=await Promise.all(['race1','race2'].map(n=>req('/api/auth','',registration(n))));assert.deepEqual(raced.map(r=>r.status).sort(),[200,429]);
 const after=(await req('/api/admin',owner)).data.usage;assert.equal(after.accounts,before.accounts+1);assert.equal(after.trips,before.trips+1);
 for(const r of raced)if(r.status===200)createdTrips.push((await req('/api/trip',r.cookie)).data.tripId);
 // A failed trip insert rolls back the account created earlier in the same batch.
 sql('DELETE FROM grouptripper_limits');
 await controls({tripsDaily:100,accountsDaily:1000,tripsTotal:after.trips+1,accountsTotal:after.accounts+100});
 const tripRace=await Promise.all(['triprace1','triprace2'].map(n=>req('/api/auth','',registration(n))));assert.deepEqual(tripRace.map(r=>r.status).sort(),[200,429]);
 const final=(await req('/api/admin',owner)).data.usage;assert.equal(final.trips,after.trips+1);assert.equal(final.accounts,after.accounts+1);
 for(const r of tripRace)if(r.status===200)createdTrips.push((await req('/api/trip',r.cookie)).data.tripId);
 // Only the verified owner can save controls, with compare-and-swap revisions.
 assert.equal((await req('/api/admin',owner,{...original,action:'controls'})).status,409);
 console.log('PASS: invite pause/resume/rotation and revocation; member privacy and organizer boundaries; existing member invite reopening; owner-only same-origin controls; signup/trip/shirt pause with existing login and gallery available; concurrent daily account+trip and total trip caps with atomic rollback and no orphan accounts.');
}finally{
 if(original&&owner)await controls(original);
 const filter=`SELECT id FROM grouptripper_accounts WHERE username LIKE '${prefix}%'`;
 for(const statement of [`DELETE FROM shirt_jobs WHERE member_id IN (${filter})`,`DELETE FROM grouptripper_sessions WHERE member IN (${filter})`,`DELETE FROM grouptripper_memberships WHERE member IN (${filter})`,`DELETE FROM grouptripper_accounts WHERE username LIKE '${prefix}%'`])sql(statement);
 const groups=createdTrips.map(x=>`'${x}'`).join(',');if(groups){sql(`DELETE FROM grouptripper_spaces WHERE id IN (${groups})`);sql(`DELETE FROM grouptripper_trip WHERE id IN (${groups})`);}sql('DELETE FROM grouptripper_limits');
}
