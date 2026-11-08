import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.GROUPTRIPPER_TEST_URL||'http://127.0.0.1:5174';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Disposable loopback only');
const tag=randomBytes(4).toString('hex'),password='local-planner-test-only',accounts=[],trips=[];
async function req(cookie='',body,path='/api/trip'){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{Origin:base,'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ')};}
async function create(name,code){const username='planner-'+name+'-'+tag;const result=await req('',{type:'register',groupAction:code?'join':'create',templateId:'golf-trip',tripName:'Planner QA '+tag,username,name,password,...(code?{code}:{})},'/api/auth');assert.equal(result.status,200,JSON.stringify(result.data));const data=(await req(result.cookie)).data;accounts.push(data.me);if(!code)trips.push(data.tripId);return {...data,cookie:result.cookie,username};}
async function action(who,body){const current=(await req(who.cookie)).data;return req(who.cookie,{...body,revision:current.board.revision});}
function sql(command){execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',command,'--json'],{stdio:'pipe'});}
let keep=false;
try{
 const a=await create('Alex'),b=await create('Jordan',a.inviteCode),other=await create('Casey');const dates=a.board.config.dates.map(d=>d.id),places=a.board.config.destinations.map(d=>d.id);
 assert.equal(places.length,5);
 assert.equal((await action(a,{type:'rsvp',rsvp:'in'})).status,200);
 assert.equal((await action(a,{type:'dates',available:dates.slice(0,2),dateRanked:[dates[1],dates[0]]})).status,200);
 assert.equal((await action(a,{type:'priorities',priorities:{Golf:10,Nightlife:2},spending:3,comfort:7})).status,200);
 assert.equal((await action(a,{type:'accommodations',budget:a.board.config.budgets[1],room:'Shared room'})).status,200);
 let mine=(await req(a.cookie)).data;assert.equal(mine.board.guests.find(g=>g.id===a.me).placesSubmitted,false);
 assert.equal((await action(a,{type:'ballot',ranked:places,ballotMode:'auto'})).status,200);
 let concealed=(await req(b.cookie)).data.board.guests.find(g=>g.id===a.me);assert.equal(concealed.datesSubmitted,true);assert.equal(concealed.placesSubmitted,true);assert.deepEqual(concealed.ranked,[]);assert.deepEqual(concealed.available,[]);
 const stale=(await req(b.cookie)).data.board.revision;
 assert.equal((await action(b,{type:'nominate',name:'A new place for the group',description:'Local fixture, intentionally unrated'})).status,200);
 assert.equal((await req(b.cookie,{type:'rsvp',rsvp:'in',revision:stale})).status,409);
 assert.equal((await req(other.cookie)).data.board.config.destinations.length,5);
 assert.equal((await action(b,{type:'config',config:a.board.config})).status,403);
 mine=(await req(a.cookie)).data;assert.deepEqual(mine.board.guests.find(g=>g.id===a.me).ranked,places);
 const nominateId=mine.board.config.destinations.at(-1).id;
 assert.equal((await action(a,{type:'ballot',ranked:[nominateId,...places.slice(0,4)],ballotMode:'manual'})).status,200);
 const signin=await req('',{type:'login',username:a.username,password},'/api/auth');assert.equal(signin.status,200);assert.equal((await req(signin.cookie)).data.board.guests.find(g=>g.id===a.me).ranked[0],nominateId);
 assert.equal((await action(a,{type:'priorities',priorities:{Golf:0,Nightlife:10},spending:10,comfort:10})).status,200);assert.equal((await req(a.cookie)).data.board.guests.find(g=>g.id===a.me).ranked[0],nominateId);
 console.log('PASS: guided saves, separate ballots, rankings persist across sign-in, no silent vote overwrite, result redaction, nominations, tenant isolation, organizer boundaries and stale-write protection.');
 if(process.argv.includes('--keep-ui-fixture')){mkdirSync('work',{recursive:true});writeFileSync('work/planner-qa.json',JSON.stringify({accounts,trips,username:b.username}));keep=true;console.log('Browser QA username: '+b.username);}
}finally{if(!keep){const ids=accounts.map(v=>`'${v}'`).join(','),groups=trips.map(v=>`'${v}'`).join(',');if(ids)for(const t of ['grouptripper_sessions','grouptripper_memberships'])sql(`DELETE FROM ${t} WHERE member IN (${ids})`);if(ids)sql(`DELETE FROM grouptripper_accounts WHERE id IN (${ids})`);if(groups)for(const t of ['grouptripper_spaces','grouptripper_trip'])sql(`DELETE FROM ${t} WHERE id IN (${groups})`);}}
