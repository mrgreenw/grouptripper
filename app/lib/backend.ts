import {env} from 'cloudflare:workers';
import {createHash,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {getChatGPTUser} from '../chatgpt-auth';
import {isSiteOwner} from './owner-auth';
import {changeBoard,emptyBoard,emptyGuest,fail,type Board,type Action} from './trip';
type Settings={DB:D1Database;GROUPTRIPPER_MODE?:string;ORGANIZER_EMAIL?:string;TRIP_CODE_SHA256?:string;PRIVATE_TRIP_ADMIN_URL?:string};
export const settings=()=>env as unknown as Settings;
export const isLive=()=>['live','hosted'].includes(settings().GROUPTRIPPER_MODE||'');
export const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export function error(e:unknown){const x=e as {status?:number;message?:string};return response({error:x.status?x.message:'Could not complete the request. Please retry.'},x.status||500);}
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
export const cookieName=(r:Request)=>new URL(r.url).protocol==='https:'?'__Host-grouptripper':'grouptripper_local';
export const sessionKey=(r:Request)=>(r.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(r)+'='))?.slice(cookieName(r).length+1)||'';
export function cookie(r:Request,value:string,age=60*60*24*14){return `${cookieName(r)}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${new URL(r.url).protocol==='https:'?'; Secure':''}`;}
export function db(){if(!isLive())throw fail('This is a browser-only tour. No shared accounts or records are created.',403);if(!settings().DB)throw fail('Trip storage is not configured.',503);return settings().DB;}
export async function owner(){return isSiteOwner(await getChatGPTUser(),settings().ORGANIZER_EMAIL);}
export async function member(r:Request){const token=sessionKey(r);if(!/^[a-f0-9]{64}$/.test(token))return null;return (await db().prepare('SELECT member FROM grouptripper_sessions WHERE token=? AND expires>?').bind(digest(token),Date.now()).first<{member:string}>())?.member||null;}
export async function readBoard(){const row=await db().prepare('SELECT data,revision FROM grouptripper_trip WHERE id=?').bind('trip').first<{data:string;revision:number}>();return row?{...JSON.parse(row.data) as Board,revision:row.revision}:emptyBoard();}
export async function writeBoard(previous:Board,next:Board){
 if(previous.revision===0){const result=await db().prepare('INSERT OR IGNORE INTO grouptripper_trip (id,data,revision) VALUES (?,?,?)').bind('trip',JSON.stringify(next),next.revision).run();if(result.meta.changes)return;}
 const result=await db().prepare('UPDATE grouptripper_trip SET data=?,revision=? WHERE id=? AND revision=?').bind(JSON.stringify(next),next.revision,'trip',previous.revision).run();if(!result.meta.changes)throw fail('Someone saved changes first. Your draft is kept. Refresh and try again.',409);
}
export async function input(r:Request){if(r.headers.get('Origin')!==new URL(r.url).origin)throw fail('Submit from the trip website.',403);if(!r.headers.get('Content-Type')?.includes('application/json'))throw fail('Expected JSON.',415);const raw=await r.text();if(raw.length>40000)throw fail('That request is too large.',413);try{const v=JSON.parse(raw);if(!v||Array.isArray(v)||typeof v!=='object')throw Error();return v as Action;}catch{throw fail('Check the form fields.');}}
export async function tripRequest(r:Request){if(settings().GROUPTRIPPER_MODE==='hosted')return (await import('./hosted')).hostedTrip(r);try{
 if(!isLive()){if(r.method!=='GET')throw fail('The public tour does not accept shared writes.',403);return response({mode:'demo'});}
 const admin=await owner(),me=await member(r);if(!admin&&!me){if(r.method!=='GET')throw fail('Sign in first.',401);return response({mode:'live',signedIn:false,name:'GroupTripper'});}
 const b=await readBoard();if(r.method!=='GET'){const a=await input(r);if(a.revision!==b.revision)throw fail('The trip changed. Refresh before saving; your draft is kept.',409);const next=changeBoard(b,a,me||'organizer',admin);await writeBoard(b,next);return response({mode:'live',board:next,me,organizer:admin});}return response({mode:'live',board:b,me,organizer:admin});
 }catch(e){return error(e);}}
const params={N:32768,r:8,p:3,maxmem:48*1024*1024};
export function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,32,params).toString('hex');}
export function check(password:unknown,encoded:string){const [salt,hash]=encoded.split(':');const value=typeof password==='string'&&password.length<=256?password:'';return timingSafeEqual(scryptSync(value,salt,32,params),Buffer.from(hash,'hex'));}
export async function throttle(r:Request){const expires=Math.floor(Date.now()/600000),key=digest((r.headers.get('CF-Connecting-IP')||'local')+':'+expires);await db().prepare('DELETE FROM grouptripper_limits WHERE expires<?').bind(Date.now()).run();await db().prepare('INSERT INTO grouptripper_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(key,(expires+1)*600000).run();const row=await db().prepare('SELECT count FROM grouptripper_limits WHERE key=?').bind(key).first<{count:number}>();if((row?.count||0)>20)throw fail('Too many attempts. Try again in ten minutes.',429);}
export async function authRequest(r:Request){if(settings().GROUPTRIPPER_MODE==='hosted')return (await import('./hosted')).hostedAuth(r);try{
 db();const a=await input(r);if(a.type==='logout'){await db().prepare('DELETE FROM grouptripper_sessions WHERE token=?').bind(digest(sessionKey(r))).run();const res=response({saved:true});res.headers.set('Set-Cookie',cookie(r,'',0));return res;}
 await throttle(r);const username=typeof a.username==='string'?a.username.trim().toLowerCase():'';if(!/^[a-z0-9][a-z0-9_.-]{2,39}$/.test(username))throw fail('Use a username of 3–40 letters, numbers, dots, dashes or underscores.');let id='';
 if(a.type==='register'){
  const configured=settings().TRIP_CODE_SHA256;if(!configured||!/^[a-f0-9]{64}$/.test(configured))throw fail('The organizer needs to configure a trip code.',503);if(typeof a.code!=='string'||digest(a.code.trim().toLowerCase())!==configured)throw fail('The trip code did not match.',401);
  if(typeof a.password!=='string'||a.password.length<12||a.password.length>256)throw fail('Use a password of 12–256 characters.');if(typeof a.name!=='string'||a.name.trim().length<2||a.name.trim().length>40)throw fail('Use a display name of 2–40 characters.');const name=a.name.trim();
  const b=await readBoard();if(b.guests.length>=50)throw fail('This trip has reached 50 guests.');if(b.guests.some(g=>g.name.toLowerCase()===name.toLowerCase()))throw fail('That display name is in use.',409);if(await db().prepare('SELECT id FROM grouptripper_accounts WHERE username=?').bind(username).first())throw fail('That username is in use.',409);
  id=crypto.randomUUID();const next={...b,revision:b.revision+1,guests:[...b.guests,emptyGuest(id,name)]};const hash=passwordHash(a.password);await db().prepare('INSERT OR IGNORE INTO grouptripper_trip (id,data,revision) VALUES (?,?,0)').bind('trip',JSON.stringify(emptyBoard())).run();
  const out=await db().batch([db().prepare('INSERT INTO grouptripper_accounts (id,username,password) SELECT ?,?,? WHERE (SELECT revision FROM grouptripper_trip WHERE id=?)=?').bind(id,username,hash,'trip',b.revision),db().prepare('UPDATE grouptripper_trip SET data=?,revision=? WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM grouptripper_accounts WHERE id=?)').bind(JSON.stringify(next),next.revision,'trip',b.revision,id)]);if(!out[1].meta.changes)throw fail('The guest list changed. Please try registering again.',409);
 }else if(a.type==='login'){
  const row=await db().prepare('SELECT id,password FROM grouptripper_accounts WHERE username=?').bind(username).first<{id:string;password:string}>();const valid=check(a.password,row?.password||'00000000000000000000000000000000:'+ '00'.repeat(32));if(!row||!valid)throw fail('Username or password did not match.',401);id=row.id;
 }else throw fail('Unsupported account action.');
 await db().prepare('DELETE FROM grouptripper_sessions WHERE expires<?').bind(Date.now()).run();const token=randomBytes(32).toString('hex');await db().prepare('INSERT INTO grouptripper_sessions (token,member,expires) VALUES (?,?,?)').bind(digest(token),id,Date.now()+14*86400000).run();const res=response({saved:true});res.headers.set('Set-Cookie',cookie(r,token));return res;
 }catch(e){return error(e);}}
