import {guestBoard} from './planning';
import {randomBytes} from 'node:crypto';
import {resetPassword} from './password-recovery';
import {db,digest,sessionKey,cookie,input,response,error,passwordHash,check,throttle} from './backend';
import {changeBoard,emptyBoard,emptyGuest,fail,type Board,type Action} from './trip';
import {checkAdmission,admissionError} from './guardrails';
import {configFromTemplate} from './trip-templates';
export type TripSession={member:string;trip:string;role:string};
export async function tripSession(r:Request):Promise<TripSession>{
 const raw=sessionKey(r);if(!/^[a-f0-9]{64}$/.test(raw))throw fail('Sign in to your trip first.',401);
 const s=await db().prepare('SELECT s.member,s.trip,m.role FROM grouptripper_sessions s JOIN grouptripper_memberships m ON m.member=s.member AND m.trip=s.trip WHERE s.token=? AND s.expires>?').bind(digest(raw),Date.now()).first<TripSession>();
 if(!s)throw fail('Sign in to your trip first.',401);return s;
}
export async function scopedBoard(trip:string):Promise<Board>{const row=await db().prepare('SELECT data,revision FROM grouptripper_trip WHERE id=?').bind(trip).first<{data:string;revision:number}>();if(!row)throw fail('Trip not found.',404);return {...JSON.parse(row.data),revision:row.revision};}
async function sessionPayload(s:TripSession){
 const board=await scopedBoard(s.trip),rows=await db().prepare('SELECT m.trip,t.data FROM grouptripper_memberships m JOIN grouptripper_trip t ON t.id=m.trip WHERE m.member=?').bind(s.member).all<{trip:string;data:string}>();
 const space=s.role==='organizer'?await db().prepare('SELECT code,invites_paused,invite_revision FROM grouptripper_spaces WHERE id=?').bind(s.trip).first<{code:string;invites_paused:number;invite_revision:number}>():null;
 return {mode:'hosted',board:guestBoard(board,s.member),me:s.member,organizer:s.role==='organizer',tripId:s.trip,inviteCode:space?.code,invitesPaused:!!space?.invites_paused,inviteRevision:space?.invite_revision,groups:rows.results.map(x=>({id:x.trip,name:(JSON.parse(x.data) as Board).config.name}))};
}
export async function hostedTrip(r:Request){try{
 let s:TripSession;try{s=await tripSession(r);}catch(e){if(r.method==='GET'&&(e as {status:number}).status===401)return response({mode:'hosted',signedIn:false});throw e;}
 if(r.method!=='GET'){
  const a=await input(r),b=await scopedBoard(s.trip);if(a.revision!==b.revision)throw fail('Someone saved first. Refresh the trip and try again; your draft is kept.',409);
  const next=changeBoard(b,a,s.member,s.role==='organizer');const out=await db().prepare('UPDATE grouptripper_trip SET data=?,revision=? WHERE id=? AND revision=?').bind(JSON.stringify(next),next.revision,s.trip,b.revision).run();if(!out.meta.changes)throw fail('The trip changed while saving. Refresh and try again.',409);
 }
 return response(await sessionPayload(s));
 }catch(e){return error(e);}}
function displayName(a:Action){if(typeof a.name!=='string'||a.name.trim().length<2||a.name.trim().length>40)throw fail('Use a display name of 2–40 characters.');return a.name.trim();}
async function addGroup(r:Request,a:Action,id:string,account?:{username:string;password:string}){
 if(a.groupAction!=='create'&&a.groupAction!=='join')throw fail('Choose whether to create or join a trip.');
 const creating=a.groupAction==='create',name=displayName(a);await checkAdmission(!!account,creating);let trip:string,b:Board,code='';
 if(creating){
  if(typeof a.tripName!=='string'||a.tripName.trim().length<2||a.tripName.trim().length>80)throw fail('Give your trip a name of 2–80 characters.');
  const config=configFromTemplate(a.templateId,{name:a.tripName.trim(),organizer:name,customKind:a.customKind,startDate:a.startDate,endDate:a.endDate,firstDestination:a.firstDestination});
  trip=crypto.randomUUID();code='trip-'+randomBytes(12).toString('hex');b=emptyBoard(config);
 }else{
  const raw=typeof a.code==='string'?a.code.trim().toLowerCase():'';
  const space=await db().prepare('SELECT id,invites_paused FROM grouptripper_spaces WHERE code=?').bind(raw).first<{id:string;invites_paused:number}>();if(!space)throw fail('That trip code did not match. Check with your organizer.',401);trip=space.id;b=await scopedBoard(trip);
  if(await db().prepare('SELECT role FROM grouptripper_memberships WHERE trip=? AND member=?').bind(trip,id).first())return trip;
  if(space.invites_paused)throw fail('Invites for this trip are paused. Ask the organizer to reopen them.',403);code=raw;
 }
 if(b.guests.length>=50)throw fail('This trip has reached its 50-person limit.');if(b.guests.some(g=>g.name.toLowerCase()===name.toLowerCase()))throw fail('That display name is in use in this trip.',409);
 if((await db().prepare('SELECT COUNT(*) AS n FROM grouptripper_memberships WHERE member=?').bind(id).first<{n:number}>())!.n>=5)throw fail('The demo supports up to five trips per account.');
 const next={...b,revision:b.revision+1,guests:[...b.guests,emptyGuest(id,name)]},batch:D1PreparedStatement[]=[];
 if(creating){
  if(account)batch.push(db().prepare('INSERT INTO grouptripper_accounts (id,username,password,created) VALUES (?,?,?,?)').bind(id,account.username,account.password,Date.now()));
  batch.push(db().prepare('INSERT INTO grouptripper_spaces (id,code,created) VALUES (?,?,?)').bind(trip,code,Date.now()),db().prepare('INSERT INTO grouptripper_trip (id,data,revision) VALUES (?,?,?)').bind(trip,JSON.stringify(next),next.revision),db().prepare("INSERT INTO grouptripper_memberships (member,trip,role) VALUES (?,?,'organizer')").bind(id,trip));
 }else{
  // Account, membership and board update use the same revision and one atomic batch.
  if(account)batch.push(db().prepare('INSERT INTO grouptripper_accounts (id,username,password,created) SELECT ?,?,?,? WHERE (SELECT revision FROM grouptripper_trip WHERE id=?)=? AND EXISTS(SELECT 1 FROM grouptripper_spaces WHERE id=? AND code=? AND invites_paused=0)').bind(id,account.username,account.password,Date.now(),trip,b.revision,trip,code));
  batch.push(db().prepare("INSERT INTO grouptripper_memberships (member,trip,role) SELECT ?,?,'guest' WHERE (SELECT revision FROM grouptripper_trip WHERE id=?)=? AND EXISTS(SELECT 1 FROM grouptripper_spaces WHERE id=? AND code=? AND invites_paused=0)").bind(id,trip,trip,b.revision,trip,code),db().prepare('UPDATE grouptripper_trip SET data=?,revision=? WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM grouptripper_memberships WHERE member=? AND trip=?)').bind(JSON.stringify(next),next.revision,trip,b.revision,id,trip));
 }
 const out=await db().batch(batch);if(!out.at(-1)?.meta.changes)throw fail('The guest list changed. Please try joining again.',409);return trip;
}
async function startSession(r:Request,id:string,trip:string){await db().prepare('DELETE FROM grouptripper_sessions WHERE expires<?').bind(Date.now()).run();const token=randomBytes(32).toString('hex');await db().prepare('INSERT INTO grouptripper_sessions (token,member,expires,trip) VALUES (?,?,?,?)').bind(digest(token),id,Date.now()+14*86400000,trip).run();const res=response({saved:true});res.headers.set('Set-Cookie',cookie(r,token));return res;}
export async function hostedAuth(r:Request){try{
 const a=await input(r);if(a.type==='logout'){await db().prepare('DELETE FROM grouptripper_sessions WHERE token=?').bind(digest(sessionKey(r))).run();const res=response({saved:true});res.headers.set('Set-Cookie',cookie(r,'',0));return res;}
 await throttle(r);
 if(a.type==='reset-password')return await resetPassword(a);
 if(a.type==='switch'||a.type==='add-group'){
  const s=await tripSession(r);let trip:string;
  if(a.type==='switch'){const m=await db().prepare('SELECT trip FROM grouptripper_memberships WHERE member=? AND trip=?').bind(s.member,typeof a.tripId==='string'?a.tripId:'').first<{trip:string}>();if(!m)throw fail('You are not a member of that trip.',403);trip=m.trip;}else trip=await addGroup(r,a,s.member);
  await db().prepare('UPDATE grouptripper_sessions SET trip=? WHERE token=?').bind(trip,digest(sessionKey(r))).run();return response({saved:true});
 }
 const username=typeof a.username==='string'?a.username.trim().toLowerCase():'';if(username.length<2||username.length>40||/[\u0000-\u001f]/.test(username))throw fail('Use a username of 2–40 characters. Spaces are fine.');
 if(a.type==='register'){
  await checkAdmission(true,a.groupAction==='create');
  if(typeof a.password!=='string'||a.password.length<8||a.password.length>256)throw fail('Use a password of at least 8 characters. No special symbols required.');
  if(await db().prepare('SELECT id FROM grouptripper_accounts WHERE username=?').bind(username).first())throw fail('That username is already registered. Sign in or choose another.',409);
  const id=crypto.randomUUID(),trip=await addGroup(r,a,id,{username,password:passwordHash(a.password)});return startSession(r,id,trip);
 }
 if(a.type!=='login')throw fail('Unsupported account action.');
 const account=await db().prepare('SELECT id,password FROM grouptripper_accounts WHERE username=?').bind(username).first<{id:string;password:string}>(),valid=check(a.password,account?.password||'00000000000000000000000000000000:'+ '00'.repeat(32));if(!account||!valid)throw fail('Username or password did not match.',401);
 const first=await db().prepare('SELECT trip FROM grouptripper_memberships WHERE member=? ORDER BY trip LIMIT 1').bind(account.id).first<{trip:string}>();if(!first)throw fail('No hosted trip is linked to this account.',403);return startSession(r,account.id,first.trip);
 }catch(e){return error(admissionError(e));}}

export async function hostedInvite(r:Request){try{
 const s=await tripSession(r);if(s.role!=='organizer')throw fail('Only the trip organizer can manage invites.',403);
 const a=await input(r);if(!['pause','resume','rotate'].includes(String(a.action))||!Number.isInteger(a.revision))throw fail('Choose a valid invite action.');
 const sql=a.action==='rotate'?'code=?':'invites_paused=?',value=a.action==='rotate'?'trip-'+randomBytes(12).toString('hex'):a.action==='pause'?1:0;
 const result=await db().prepare(`UPDATE grouptripper_spaces SET ${sql},invite_revision=invite_revision+1 WHERE id=? AND invite_revision=?`).bind(value,s.trip,a.revision as number).run();
 if(!result.meta.changes)throw fail('Invite settings changed. Refresh the trip and try again.',409);return response(await sessionPayload(s));
 }catch(e){return error(e);}}
