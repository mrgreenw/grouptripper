import {demoControls,demoUsage} from './guardrails';
import {issuePasswordReset} from './password-recovery';
import {validateControls,capFields,pauseFields} from './demo-controls';
import {getChatGPTUser} from '../chatgpt-auth';
import {db,error,input,response,settings} from './backend';
import {isSiteOwner,privateAdminLink} from './owner-auth';
import {fail,type Board} from './trip';
import {assetKinds,validJobId} from './shirts';
export async function requireSiteOwner(){
 const user=await getChatGPTUser();
 if(!user)throw fail('Sign in with the site owner’s ChatGPT account.',401);
 if(!isSiteOwner(user,settings().ORGANIZER_EMAIL))throw fail('This ChatGPT account is not the site owner.',403);
 if(settings().GROUPTRIPPER_MODE!=='hosted')throw fail('This dashboard is for the hosted demo.',403);
 return db();
}
export async function ownerGET(req:Request){try{
 const database=await requireSiteOwner(),url=new URL(req.url),page=Math.max(0,Math.min(100000,Number.parseInt(url.searchParams.get('page')||'0')||0)),trip=url.searchParams.get('trip'),time=Math.floor(Date.now()/1000);
 const counts=await database.prepare('SELECT (SELECT COUNT(*) FROM grouptripper_spaces) AS trips,(SELECT COUNT(*) FROM grouptripper_accounts) AS accounts,(SELECT COUNT(*) FROM shirt_jobs WHERE created_at>?) AS designsToday,(SELECT COUNT(*) FROM shirt_jobs WHERE status IN (\'queued\',\'rendering\')) AS pending').bind(time-86400).first();
 const rows=await database.prepare('SELECT s.id,s.created,t.data,(SELECT COUNT(*) FROM shirt_jobs j WHERE j.trip_id=s.id) AS designs FROM grouptripper_spaces s JOIN grouptripper_trip t ON t.id=s.id ORDER BY s.created DESC,s.id LIMIT 25 OFFSET ?').bind(page*25).all<{id:string;created:number;data:string;designs:number}>();
 const trips=rows.results.map(row=>{const b=JSON.parse(row.data) as Board;return {id:row.id,name:b.config.name,organizer:b.config.organizer,created:row.created,guests:b.guests.length,in:b.guests.filter(g=>g.rsvp==='in').length,submitted:b.guests.filter(g=>g.rsvp!=='out'&&g.submitted).length,expected:b.guests.filter(g=>g.rsvp!=='out').length,designs:row.designs};});
 const beats=await database.prepare('SELECT id,state,updated_at FROM shirt_worker').all<{id:string;state:string;updated_at:number}>();
 let detail=null;
 if(trip){
  if(!validJobId(trip))throw fail('Choose a valid demo trip.',404);
  const row=await database.prepare('SELECT t.data,t.revision FROM grouptripper_trip t JOIN grouptripper_spaces s ON s.id=t.id WHERE t.id=?').bind(trip).first<{data:string;revision:number}>();
  if(!row)throw fail('Demo trip not found.',404);
  const jobs=await database.prepare('SELECT id,author,input,status,error,created_at,deleted_at FROM shirt_jobs WHERE trip_id=? ORDER BY created_at DESC LIMIT 80').bind(trip).all<{id:string;author:string;input:string;status:string;error:string|null;created_at:number;deleted_at:number|null}>();
  const accounts=await database.prepare('SELECT a.id,a.username FROM grouptripper_accounts a JOIN grouptripper_memberships m ON m.member=a.id WHERE m.trip=? ORDER BY a.username').bind(trip).all<{id:string;username:string}>();
  detail={accounts:accounts.results,id:trip,board:{...JSON.parse(row.data) as Board,revision:row.revision},jobs:jobs.results.map(j=>{const input=JSON.parse(j.input),hidden=!!input.nsfw&&url.searchParams.get('adult')!=='1';return {id:j.id,author:j.author,status:j.status,error:j.error,createdAt:j.created_at,removed:!!j.deleted_at,nsfw:!!input.nsfw,hidden,input:hidden?null:input,assets:j.status==='completed'&&!hidden?Object.fromEntries(assetKinds.map(k=>[k,`/api/admin/shirts/${j.id}/${k}${input.nsfw?'?adult=1':''}`])):null};})};
 }
 return response({controls:await demoControls(),usage:await demoUsage(),counts,trips,page,detail,worker:beats.results.map(b=>({id:b.id,state:b.state,online:b.updated_at>time-90})),privateTripAdminUrl:privateAdminLink(settings().PRIVATE_TRIP_ADMIN_URL)});
 }catch(e){return error(e);}}

export async function ownerPOST(req:Request){try{
 const database=await requireSiteOwner(),a=await input(req);if(a.action==='password-reset')return await issuePasswordReset(a.accountId);if(a.action!=='controls')throw fail('Unsupported admin action.');
 let c;try{c=validateControls(a);}catch(e){throw fail((e as Error).message);}
 const fields=[...capFields,...pauseFields],result=await database.prepare(`UPDATE grouptripper_controls SET ${fields.map(f=>f+'=?').join(',')},revision=revision+1 WHERE id='demo' AND revision=?`).bind(...fields.map(f=>c[f]),c.revision).run();
 if(!result.meta.changes)throw fail('Settings changed in another window. Refresh before saving.',409);
 return response({controls:await demoControls(),usage:await demoUsage()});
 }catch(e){return error(e);}}
