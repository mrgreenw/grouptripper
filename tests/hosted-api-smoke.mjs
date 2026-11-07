import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=process.env.GROUPTRIPPER_TEST_URL||'http://127.0.0.1:5174';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Disposable loopback only');
const suffix=randomBytes(4).toString('hex'),password='local-demo-test-only',workerToken='b'.repeat(64),accounts=[],trips=[];
async function req(path='/api/trip',cookie='',body,extra={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{Origin:base,'Content-Type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined});let data;try{data=await r.json();}catch{data=null;}return {status:r.status,data,cookie:r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ')};}
function sql(s){return JSON.parse(execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',s,'--json'],{encoding:'utf8'}));}
async function signup(n,code){const a=await req('/api/auth','',{type:'register',groupAction:code?'join':'create',tripName:'Local '+n+' '+suffix,username:'qa '+n+' '+suffix,name:'Test '+n,password,...(code?{code}:{})});assert.equal(a.status,200,JSON.stringify(a.data));const s=(await req('/api/trip',a.cookie)).data;accounts.push(s.me);if(!code)trips.push(s.tripId);return {...s,cookie:a.cookie};}
const idea={idea:'A fictional mountain trip badge with pine trees.',headline:'Local test',locationLine:'',eventLine:'',slogan:'',extraLines:'',shirtColor:'Cream',nsfw:true};
const submit=(u,id=crypto.randomUUID())=>req('/api/shirts',u.cookie,{...idea,requestId:id});
const cancel=(u,id)=>req('/api/shirts',u.cookie,{action:'cancel',id});
try{
 assert.equal((await req()).data.mode,'hosted');assert.equal((await req('/api/shirts')).status,401);
 const a=await signup('a'),b=await signup('b'),c=await signup('c',a.inviteCode);assert.equal(a.organizer,true);assert.equal(c.organizer,false);assert.equal(c.tripId,a.tripId);assert.ok(!c.inviteCode);
 const signin=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'}),ownerCookie=signin.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');assert.ok(ownerCookie);
 for(const [cookie,headers] of [['',{}],[a.cookie,{}],['',{Authorization:'Bearer '+workerToken}],['',{'oai-authenticated-user-id':'pretend-owner','oai-authenticated-user-email':'seedy@sites.test'}]]){
  assert.equal((await req('/api/admin',cookie,undefined,headers)).status,401);
  assert.equal((await req('/api/admin/shirts/'+crypto.randomUUID()+'/artwork',cookie,undefined,headers)).status,401);
 }
 const overview=await req('/api/admin',ownerCookie);assert.equal(overview.status,200,JSON.stringify(overview.data));assert.ok(overview.data.trips.some(t=>t.id===a.tripId));assert.ok(overview.data.trips.some(t=>t.id===b.tripId));
 const ownerA=await req('/api/admin?trip='+a.tripId,ownerCookie);assert.equal(ownerA.status,200);assert.equal(ownerA.data.detail.board.config.name,a.board.config.name);assert.ok(!JSON.stringify(ownerA.data).includes('password'));assert.ok(!JSON.stringify(ownerA.data).includes(a.inviteCode));
 assert.equal((await req('/api/admin?trip='+crypto.randomUUID(),ownerCookie)).status,404);assert.equal((await req('/api/trip',ownerCookie)).data.signedIn,false);assert.equal((await req('/api/admin',ownerCookie,{type:'config'})).status,405);

 assert.equal((await req('/api/auth',b.cookie,{type:'switch',tripId:a.tripId})).status,403);
 assert.equal((await req('/api/trip',c.cookie,{type:'config',revision:c.board.revision,config:c.board.config})).status,403);
 const latest=(await req('/api/trip',a.cookie)).data,write={type:'message',revision:latest.board.revision,id:crypto.randomUUID(),text:'Only group A'};
 assert.equal((await req('/api/trip',a.cookie,write,{Origin:'https://bad.example'})).status,403);assert.equal((await req('/api/trip',a.cookie,write)).status,200);assert.equal((await req('/api/trip',b.cookie)).data.board.messages.length,0);
 assert.equal((await req('/api/trip',a.cookie,write)).status,409);
 const id=crypto.randomUUID();assert.equal((await submit(a,id)).status,201);assert.equal((await submit(a,id)).status,200);
 assert.equal((await req('/api/shirts',b.cookie)).data.jobs.length,0);assert.equal((await req('/api/shirts',a.cookie)).data.jobs[0].hidden,true);assert.equal((await req('/api/shirts?adult=1',a.cookie)).data.jobs[0].input.idea,idea.idea);
 assert.equal((await req('/api/shirts',c.cookie,{action:'delete',id})).status,404);assert.equal((await req(`/api/shirts/${id}/artwork`,b.cookie)).status,404);
 const pending=await Promise.all([submit(a),submit(a)]);assert.ok(pending.every(x=>x.status===429));
 const ownerHidden=await req('/api/admin?trip='+a.tripId,ownerCookie);assert.equal(ownerHidden.data.detail.jobs[0].hidden,true);assert.equal(ownerHidden.data.detail.jobs[0].input,null);
 const ownerRevealed=await req('/api/admin?trip='+a.tripId+'&adult=1',ownerCookie);assert.equal(ownerRevealed.data.detail.jobs[0].input.idea,idea.idea);assert.ok(!JSON.stringify(ownerRevealed.data).includes('lease'));

 assert.equal((await req('/api/shirts/worker','',{action:'claim'})).status,401);
 const claims=await Promise.all([1,2].map(()=>req('/api/shirts/worker','',{action:'claim'},{Authorization:'Bearer '+workerToken})));assert.equal(claims.filter(x=>x.data.job).length,1);const job=claims.find(x=>x.data.job).data.job;
 assert.equal((await req('/api/shirts/worker','',{action:'complete',id,lease:job.lease},{Authorization:'Bearer '+workerToken})).status,409);

 const webp=Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA','base64');
 for(const kind of ['artwork','shirt']){const upload=await fetch(base+'/api/shirts/'+id+'/'+kind,{method:'PUT',headers:{Authorization:'Bearer '+workerToken,'X-Render-Lease':job.lease,'Content-Type':'image/webp'},body:webp});assert.equal(upload.status,200);}
 assert.equal((await req('/api/shirts/worker','',{action:'complete',id,lease:job.lease},{Authorization:'Bearer '+workerToken})).status,200);
 assert.equal((await req('/api/admin/shirts/'+id+'/artwork',ownerCookie)).status,403);
 const image=await fetch(base+'/api/admin/shirts/'+id+'/artwork?adult=1',{headers:{Cookie:ownerCookie}});assert.equal(image.status,200);assert.equal(image.headers.get('Cache-Control'),'private, no-store');
 assert.equal((await req('/api/admin/shirts/'+id+'/artwork?adult=1',b.cookie)).status,401);
 assert.equal((await req('/api/shirts',a.cookie,{action:'delete',id})).status,200);
 assert.equal((await req('/api/shirts/worker','',{action:'heartbeat',id,lease:job.lease},{Authorization:'Bearer '+workerToken})).status,409);
 assert.equal((await req('/api/admin?trip='+a.tripId+'&adult=1',ownerCookie)).data.detail.jobs[0].removed,true);
 assert.equal((await req('/api/shirts/'+id+'/artwork?adult=1',a.cookie)).status,404);
 assert.equal((await fetch(base+'/api/admin/shirts/'+id+'/artwork?adult=1',{headers:{Cookie:ownerCookie}})).status,200);
 const second=await submit(a);assert.equal(second.status,201);await cancel(a,second.data.id);assert.equal((await submit(a)).status,429);
 const people=[b,c];for(let i=0;i<5;i++)people.push(await signup('extra'+i,a.inviteCode));
 for(const person of people){const result=await submit(person);assert.equal(result.status,201,JSON.stringify(result.data));await cancel(person,result.data.id);}
 assert.equal((await req('/api/shirts',b.cookie)).data.limits.totalRemaining,1);
 const race=await Promise.all([submit(b),submit(c)]);assert.deepEqual(race.map(x=>x.status).sort(),[201,429]);
 assert.equal((await req('/api/shirts',a.cookie)).data.limits.totalRemaining,0);
 const login=await req('/api/auth','',{type:'login',username:'qa a '+suffix,password});assert.equal(login.status,200);assert.equal((await req('/api/trip',login.cookie)).data.tripId,a.tripId);
 const joined=await req('/api/auth',a.cookie,{type:'add-group',groupAction:'join',name:'A in another group',code:b.inviteCode});assert.equal(joined.status,200);assert.equal((await req('/api/trip',a.cookie)).data.organizer,false);assert.equal((await submit(a)).status,429);
 await req('/api/auth',a.cookie,{type:'logout'});assert.equal((await req('/api/shirts',a.cookie)).status,401);
 console.log('PASS: verified owner-only demo overview/details/assets, no guest/worker/spoofed-header escalation, read-only owner access, adult concealment, private hidden assets; trip creation/join/login/switch, organizer boundaries, private groups and galleries, CSRF, stale writes, NSFW hiding, idempotency, worker leases, 1 pending/account, 2 daily/account across trips, concurrent global 10/day cap, hidden/canceled jobs retain quota.');
}finally{
 const ids=accounts.map(x=>`'${x}'`).join(','),groups=trips.map(x=>`'${x}'`).join(',');if(ids)for(const statement of [`DELETE FROM shirt_jobs WHERE member_id IN (${ids})`,`DELETE FROM grouptripper_sessions WHERE member IN (${ids})`,`DELETE FROM grouptripper_memberships WHERE member IN (${ids})`,`DELETE FROM grouptripper_accounts WHERE id IN (${ids})`])sql(statement);if(groups)for(const statement of [`DELETE FROM grouptripper_spaces WHERE id IN (${groups})`,`DELETE FROM grouptripper_trip WHERE id IN (${groups})`])sql(statement);
}
