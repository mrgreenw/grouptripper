import {env} from 'cloudflare:workers';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {db as tripDatabase,digest as tokenHash,input as validateInput,response,error as fail} from './backend';
import {tripSession} from './hosted';
import {fail as failure} from './trip';
import {shirtInput,validJobId,assetKinds} from './shirts';
type Bindings={BUCKET:R2Bucket;SHIRT_WORKER_TOKEN_SHA256?:string;SHIRT_COORDINATOR_TOKEN_SHA256?:string};
const config=()=>env as unknown as Bindings;
const now=()=>Math.floor(Date.now()/1000),token=()=>randomBytes(32).toString('hex');
const clean=(v:unknown,label:string,max:number,min=1)=>{if(typeof v!=='string'||v.length<min||v.length>max)throw failure(`Check ${label}.`);return v;};
type Job={id:string;trip_id:string;member_id:string;author:string;input:string;status:string;lease:string|null;lease_until:number|null;error:string|null;created_at:number;updated_at:number;deleted_at:number|null};
async function body(r:Request){const raw=await r.text();if(raw.length>10000)throw failure('Request too large.',413);try{return JSON.parse(raw) as Record<string,unknown>;}catch{throw failure('Invalid JSON.');}}
async function workerAuth(req:Request){const expected=config().SHIRT_WORKER_TOKEN_SHA256,raw=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(!expected||!/^[a-f0-9]{64}$/.test(expected)||!/^[a-f0-9]{64}$/.test(raw)||!timingSafeEqual(Buffer.from(tokenHash(raw)),Buffer.from(expected)))throw failure('Worker authorization failed.',401);return tripDatabase();}
export async function shirtsGET(req:Request){try{
 const who=await tripSession(req),db=tripDatabase(),reveal=new URL(req.url).searchParams.get('adult')==='1',since=now()-86400;
 const rows=await db.prepare('SELECT * FROM shirt_jobs WHERE trip_id=? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 80').bind(who.trip).all<Job>();
 const beat=await db.prepare("SELECT updated_at,state FROM shirt_worker WHERE id='local'").first<{updated_at:number;state:string}>();
 const counts=await db.prepare("SELECT SUM(CASE WHEN created_at>? THEN 1 ELSE 0 END) AS total,SUM(CASE WHEN member_id=? AND created_at>? THEN 1 ELSE 0 END) AS personal,SUM(CASE WHEN member_id=? AND status IN ('queued','rendering') THEN 1 ELSE 0 END) AS pending,MIN(CASE WHEN created_at>? THEN created_at END) AS oldest FROM shirt_jobs").bind(since,who.member,since,who.member,since).first<{total:number;personal:number;pending:number;oldest:number|null}>();
 return response({worker:beat&&beat.updated_at>now()-90?beat.state:'offline',enabled:!!config().SHIRT_WORKER_TOKEN_SHA256,limits:{personal:2,total:10,pending:1,personalRemaining:Math.max(0,2-(counts?.personal||0)),totalRemaining:Math.max(0,10-(counts?.total||0)),pendingNow:counts?.pending||0,windowHours:24},jobs:rows.results.map(j=>{const input=JSON.parse(j.input),hidden=input.nsfw&&!reveal;return {id:j.id,status:j.status,createdAt:j.created_at,author:j.author,mine:j.member_id===who.member,nsfw:input.nsfw,hidden,input:hidden?null:input,error:j.error,assets:j.status==='completed'&&!hidden?Object.fromEntries(assetKinds.map(k=>[k,`/api/shirts/${j.id}/${k}${input.nsfw?'?adult=1':''}`])):null};})});
 }catch(e){return fail(e);}}
export async function shirtsPOST(req:Request){try{
 const a=await validateInput(req),who=await tripSession(req),db=tripDatabase(),time=now();
 if(a.action==='cancel'||a.action==='delete'){
  const id=clean(a.id,'Design',36,36);if(!validJobId(id))throw failure('Choose a valid design.');
  const j=await db.prepare('SELECT id FROM shirt_jobs WHERE id=? AND trip_id=? AND member_id=?').bind(id,who.trip,who.member).first();if(!j)throw failure('Design not found.',404);
  if(a.action==='cancel')await db.prepare("UPDATE shirt_jobs SET status='cancelled',updated_at=? WHERE id=? AND status='queued'").bind(time,id).run();
  else await db.prepare("UPDATE shirt_jobs SET deleted_at=?,updated_at=?,lease_until=NULL,status=CASE WHEN status='queued' THEN 'cancelled' WHEN status='rendering' THEN 'failed' ELSE status END WHERE id=?").bind(time,time,id).run();
  return response({saved:true});
 }
 if(!config().SHIRT_WORKER_TOKEN_SHA256)throw failure('Shirt Studio is not connected yet.',503);
 let design;try{design=shirtInput(a);}catch(e){throw failure((e as Error).message);}
 const id=clean(a.requestId,'Request',36,36);if(!validJobId(id))throw failure('Invalid request ID.');
 const existing=await db.prepare('SELECT id FROM shirt_jobs WHERE id=? AND member_id=? AND trip_id=?').bind(id,who.member,who.trip).first();if(existing)return response(existing);
 const board=await db.prepare('SELECT data FROM grouptripper_trip WHERE id=?').bind(who.trip).first<{data:string}>(),author=JSON.parse(board!.data).guests.find((g:{id:string})=>g.id===who.member)?.name||'Guest';
 // One INSERT statement makes both daily caps and the pending limit atomic, even across trips.
 const result=await db.prepare("INSERT INTO shirt_jobs (id,trip_id,member_id,author,input,status,created_at,updated_at) SELECT ?,?,?,?,?,'queued',?,? WHERE (SELECT COUNT(*) FROM shirt_jobs WHERE member_id=? AND status IN ('queued','rendering'))<1 AND (SELECT COUNT(*) FROM shirt_jobs WHERE member_id=? AND created_at>?)<2 AND (SELECT COUNT(*) FROM shirt_jobs WHERE created_at>?)<10").bind(id,who.trip,who.member,author,JSON.stringify(design),time,time,who.member,who.member,time-86400,time-86400).run();
 if(!result.meta.changes)throw failure('Demo limit reached: 1 pending design per person, 2 per person in 24 hours, and 10 total across all trips in 24 hours. Canceling or deleting does not restore a daily allowance.',429);
 return response({id},201);
 }catch(e){return fail(e);}}
export async function assetGET(req:Request,id:string,kind:string){try{
 const who=await tripSession(req),db=tripDatabase();if(!validJobId(id)||!assetKinds.includes(kind as 'shirt'))throw failure('Image not found.',404);
 const job=await db.prepare("SELECT * FROM shirt_jobs WHERE id=? AND trip_id=? AND status='completed' AND deleted_at IS NULL").bind(id,who.trip).first<Job>();if(!job)throw failure('Image not found.',404);
 if(JSON.parse(job.input).nsfw&&new URL(req.url).searchParams.get('adult')!=='1')throw failure('Reveal adult designs first.',403);
 const obj=await config().BUCKET.get(`shirts/${id}/${job.lease}/${kind}.webp`);if(!obj)throw failure('Image not found.',404);
 return new Response(obj.body,{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':`inline; filename="trip-shirt-${id}-${kind}.webp"`}});
 }catch(e){return fail(e);}}
export async function workerPOST(req:Request){try{
 const db=await workerAuth(req),input=await body(req),time=now();
 if(input.action==='status'){
  const state=['ready','busy','comfy-offline'].includes(String(input.state))?String(input.state):'busy';
  await db.prepare("INSERT INTO shirt_worker (id,state,updated_at) VALUES ('local',?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at").bind(state,time).run();return response({ok:true});
 }
 if(input.action==='claim'){
  // Abandoned renders fail visibly rather than silently charging another render.
  await db.prepare("UPDATE shirt_jobs SET status='failed',error='The render worker disconnected. Submit again when it is online.',updated_at=? WHERE status='rendering' AND lease_until<?").bind(time,time).run();
  const lease=token();const job=await db.prepare("UPDATE shirt_jobs SET status='rendering',lease=?,lease_until=?,updated_at=? WHERE id=(SELECT id FROM shirt_jobs WHERE status='queued' ORDER BY created_at LIMIT 1) AND NOT EXISTS(SELECT 1 FROM shirt_jobs WHERE status='rendering') RETURNING *").bind(lease,time+300,time).first<Job>();
  return response({job:job?{id:job.id,input:JSON.parse(job.input),lease}:null});
 }
 const id=clean(input.id,'Design',36,36),lease=clean(input.lease,'Lease',64,64);
 const job=await db.prepare("SELECT * FROM shirt_jobs WHERE id=? AND lease=? AND status='rendering' AND lease_until>=?").bind(id,lease,time).first<Job>();
 if(!job)throw failure('This render lease is no longer active.',409);
 if(input.action==='heartbeat'){await db.prepare("UPDATE shirt_jobs SET lease_until=?,updated_at=? WHERE id=? AND lease=? AND status='rendering'").bind(time+300,time,id,lease).run();return response({ok:true});}
 if(input.action==='complete'){
  for(const kind of assetKinds)if(!await config().BUCKET.head(`shirts/${id}/${lease}/${kind}.webp`))throw failure('Both render images must be uploaded first.',409);
  await db.prepare("UPDATE shirt_jobs SET status='completed',updated_at=? WHERE id=? AND lease=? AND status='rendering'").bind(time,id,lease).run();return response({ok:true});
 }
 if(input.action==='fail'){
  const reason=input.reason==='render'?'The local render failed. The organizer can check its logs.':'The worker could not finish this design. Please try again.';
  await db.prepare("UPDATE shirt_jobs SET status='failed',error=?,updated_at=? WHERE id=? AND lease=? AND status='rendering'").bind(reason,time,id,lease).run();return response({ok:true});
 }
 throw failure('Unknown worker action.');
 }catch(e){return fail(e);}}
export async function assetPUT(req:Request,id:string,kind:string){try{
 const db=await workerAuth(req);if(!validJobId(id)||!assetKinds.includes(kind as 'shirt'))throw failure('Invalid asset.',400);
 const lease=req.headers.get('X-Render-Lease')||'';const job=await db.prepare("SELECT id FROM shirt_jobs WHERE id=? AND lease=? AND status='rendering' AND lease_until>=?").bind(id,lease,now()).first();if(!job)throw failure('Render lease expired.',409);
 if(req.headers.get('Content-Type')!=='image/webp')throw failure('Expected WebP.',415);
 const max=8*1024*1024;const reader=req.body?.getReader();if(!reader)throw failure('Empty image.');let length=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>max){await reader.cancel();throw failure('Image exceeds 8 MB.',413);}chunks.push(part.value);}
 const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 if(length<20||new TextDecoder().decode(bytes.slice(0,4))!=='RIFF'||new TextDecoder().decode(bytes.slice(8,12))!=='WEBP')throw failure('Invalid image.',415);
 const key=`shirts/${id}/${lease}/${kind}.webp`;
 await config().BUCKET.put(key,bytes,{httpMetadata:{contentType:'image/webp'}});
 // A delete may have arrived while the upload body or storage write was in flight.
 const active=await db.prepare("SELECT id FROM shirt_jobs WHERE id=? AND lease=? AND status='rendering' AND deleted_at IS NULL AND lease_until>=?").bind(id,lease,now()).first();
 if(!active){await config().BUCKET.delete(key);throw failure('Render lease expired.',409);}
 return response({ok:true});
 }catch(e){return fail(e);}}

export async function coordinatorPOST(req:Request){try{
 const expected=config().SHIRT_COORDINATOR_TOKEN_SHA256,raw=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
 if(!expected||!/^[a-f0-9]{64}$/.test(expected)||!/^[a-f0-9]{64}$/.test(raw)||!timingSafeEqual(Buffer.from(tokenHash(raw)),Buffer.from(expected)))throw failure('Coordinator authorization failed.',401);
 const db=tripDatabase(),input=await body(req),time=now();
 if(!['monitoring','starting','wake-sent','unreachable','paused'].includes(String(input.state)))throw failure('Invalid coordinator state.');
 await db.prepare("INSERT INTO shirt_worker (id,state,updated_at) VALUES ('coordinator',?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at").bind(String(input.state),time).run();
 const counts=await db.prepare("SELECT SUM(CASE WHEN status='queued' THEN 1 ELSE 0 END) AS queued,SUM(CASE WHEN status='rendering' THEN 1 ELSE 0 END) AS rendering FROM shirt_jobs WHERE deleted_at IS NULL").first<{queued:number|null;rendering:number|null}>();
 const worker=await db.prepare("SELECT state,updated_at FROM shirt_worker WHERE id='local'").first<{state:string;updated_at:number}>();
 return response({queued:counts?.queued||0,rendering:counts?.rendering||0,worker:{state:worker?.state||'offline',online:!!worker&&worker.updated_at>time-90},checkedAt:time});
 }catch(e){return fail(e);}}
