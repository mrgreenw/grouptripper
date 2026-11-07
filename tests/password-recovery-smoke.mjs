import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base=process.env.GROUPTRIPPER_TEST_URL||'http://127.0.0.1:5174';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Disposable loopback only');
const suffix=randomBytes(6).toString('hex'),accounts=[],trips=[],password='Local Test Password 22!';
function sql(command){return JSON.parse(execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',command,'--json'],{encoding:'utf8'}));}
async function req(path='/api/trip',cookie='',body,headers={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie,'CF-Connecting-IP':'local-recovery-'+suffix,...(body?{Origin:base,'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return {status:r.status,data,cookie:r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};}
try{
 const people=[];
 for(const n of ['a','b']){const username='recovery '+n+' '+suffix,reg=await req('/api/auth','',{type:'register',groupAction:'create',tripName:'Recovery test '+n,templateId:'golf-trip',name:'Recovery '+n,username,password});assert.equal(reg.status,200,JSON.stringify(reg.data));const current=await req('/api/trip',reg.cookie);accounts.push(current.data.me);trips.push(current.data.tripId);people.push({...current.data,username,cookie:reg.cookie});}
 const [a,b]=people;
 const signin=await fetch(base+'/signin-with-chatgpt?return_to=%2Fadmin',{redirect:'manual'}),ownerCookie=signin.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.ok(ownerCookie);
 const action={action:'password-reset',accountId:a.me};
 for(const cookie of ['',a.cookie,b.cookie])assert.equal((await req('/api/admin',cookie,action)).status,401);
 assert.equal((await req('/api/admin',ownerCookie,action,{Origin:'https://bad.example'})).status,403);
 assert.equal((await req('/api/admin',ownerCookie,{...action,accountId:crypto.randomUUID()})).status,404);
 const detail=await req('/api/admin?trip='+a.tripId,ownerCookie);assert.equal(detail.status,200);assert.deepEqual(detail.data.detail.accounts,[{id:a.me,username:a.username}]);assert.ok(!JSON.stringify(detail.data).includes('password'));
 const extraSession=await req('/api/auth','',{type:'login',username:a.username.toUpperCase(),password});assert.equal(extraSession.status,200);
 async function issue(){const r=await req('/api/admin',ownerCookie,action);assert.equal(r.status,200,JSON.stringify(r.data));const url=new URL(r.data.path,base);assert.equal(url.pathname,'/reset-password');assert.equal(url.search,'');const token=new URLSearchParams(url.hash.slice(1)).get('token');assert.match(token,/^[a-f0-9]{64}$/);return token;}
 const reset=(token,newPassword=password)=>req('/api/auth','',{type:'reset-password',token,password:newPassword});
 const expired=await issue(),stored=sql(`SELECT token_hash FROM grouptripper_password_resets WHERE account_id='${a.me}'`)[0].results[0].token_hash;assert.equal(stored,createHash('sha256').update(expired).digest('hex'));assert.notEqual(stored,expired);
 sql(`UPDATE grouptripper_password_resets SET expires=0 WHERE account_id='${a.me}'`);assert.equal((await reset(expired)).status,400);
 const replaced=await issue(),token=await issue();assert.equal((await reset(replaced)).status,400);assert.equal((await reset('bad')).status,400);assert.equal((await reset(token,'short')).status,400);
 assert.equal((await req('/api/trip',a.cookie)).data.me,a.me);
 const passwords=['New Local Password 1','New Local Password 2'],race=await Promise.all(passwords.map(p=>reset(token,p)));assert.deepEqual(race.map(r=>r.status).sort(),[200,400]);const winner=passwords[race.findIndex(r=>r.status===200)];
 for(const cookie of [a.cookie,extraSession.cookie])assert.equal((await req('/api/trip',cookie)).data.signedIn,false);
 assert.equal((await req('/api/trip',b.cookie)).data.me,b.me);
 assert.equal((await req('/api/auth','',{type:'login',username:a.username,password})).status,401);
 const login=await req('/api/auth','',{type:'login',username:a.username,password:winner});assert.equal(login.status,200,JSON.stringify(login.data));const restored=await req('/api/trip',login.cookie);assert.equal(restored.data.me,a.me);assert.deepEqual(restored.data.board,a.board);
 assert.equal((await reset(token)).status,400);
 console.log('PASS: owner-only recovery; CSRF; username visibility; token hashing, expiry, replacement and atomic single use; old passwords rejected and sessions revoked; new sign-in restores unchanged trip; other accounts unaffected.');
}finally{
 if(accounts.length){const ids=accounts.map(id=>`'${id}'`).join(','),groups=trips.map(id=>`'${id}'`).join(',');sql(`DELETE FROM grouptripper_password_resets WHERE account_id IN (${ids});DELETE FROM grouptripper_sessions WHERE member IN (${ids});DELETE FROM grouptripper_memberships WHERE member IN (${ids});DELETE FROM grouptripper_accounts WHERE id IN (${ids});DELETE FROM grouptripper_spaces WHERE id IN (${groups});DELETE FROM grouptripper_trip WHERE id IN (${groups});`);console.log('Disposable recovery fixtures removed.');}
}
