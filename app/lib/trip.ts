import {dateVoted,placeVoted,autoBallot,planningResults,type Destination} from './planning.ts';
import {parseExpenseAmount,summarizeExpenses,type ExpenseData} from './expenses.ts';
export const modules=['travel','meals','groceries','agenda','messages','expenses'] as const;
export type Module=typeof modules[number];
export type Config={name:string;kind:string;welcome:string;organizer:string;dates:{id:string;end:string;label:string}[];destinations:Destination[];activities:string[];budgets:string[];rooms:string[];modules:Module[]};
export type Guest={id:string;name:string;rsvp:'in'|'out'|'pending';available:string[];ranked:string[];budget:string;room:string;interests:string[];submitted:boolean;dateRanked?:string[];priorities?:Record<string,number>;spending?:number;comfort?:number;datesSubmitted?:boolean;placesSubmitted?:boolean;preferencesSaved?:boolean;ballotMode?:'auto'|'manual'};
export type Cost=ExpenseData&{id:string;createdBy:string;removed:boolean};
export type Plan={id:string;kind:Module;title:string;details:string;owner:string;done:boolean};
export type Message={id:string;author:string;text:string};
export type Board={revision:number;config:Config;guests:Guest[];expenses:Cost[];plans:Plan[];messages:Message[]};
export const defaultConfig:Config={name:'The Long Weekend',kind:'Friends getaway',organizer:'Your organizer',welcome:'A little adventure. Good food. Your favorite people. Let’s find a place and a weekend that work for everyone.',dates:[{id:'2027-06-10',end:'2027-06-13',label:'June 10–13'},{id:'2027-06-17',end:'2027-06-20',label:'June 17–20'},{id:'2027-06-24',end:'2027-06-27',label:'June 24–27'}],destinations:[{id:'coast',name:'Coastal escape',description:'Beach walks, fresh seafood, and a house with room for everyone.'},{id:'mountains',name:'Mountain retreat',description:'Scenic trails, slow mornings, and evenings around the fire.'},{id:'city',name:'City weekend',description:'Neighborhood cafés, museums, and a very good dinner reservation.'}],activities:['Food & drink','Outdoors','Arts & culture','Relaxation','Nightlife'],budgets:['Under $500','$500–$1,000','$1,000–$1,500','$1,500+'],rooms:['Shared room','Private room','Flexible'],modules:[...modules]};
export const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
function text(v:unknown,label:string,max:number,min=1){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)throw fail(`${label} must be ${min}–${max} characters.`);return v.trim();}
function strings(v:unknown,label:string,max=12){if(!Array.isArray(v)||v.length<1||v.length>max)throw fail(`${label}: enter 1–${max} choices.`);const result=v.map(s=>text(s,label,60));if(new Set(result).size!==result.length)throw fail(`${label} cannot contain duplicate choices.`);return result;}
function date(v:unknown){const d=text(v,'Date',10);if(!/^20\d\d-\d\d-\d\d$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw fail('Use valid dates between 2000 and 2099.');return d;}
function scale(v:unknown,label:string){if(typeof v!=='number'||!Number.isInteger(v)||v<0||v>10)throw fail(`${label} must be a whole number from 0 to 10.`);return v;}
function ratings(v:unknown,activities:string[]){if(!v||typeof v!=='object'||Array.isArray(v))throw fail('Check the activity ratings.');if(Object.keys(v).some(k=>!activities.includes(k)))throw fail('Choose listed activities.');return Object.fromEntries(Object.entries(v).map(([k,n])=>[k,scale(n,k)]));}
function profileFields(d:Destination,activities:string[]){return {...(d.ratings!==undefined?{ratings:ratings(d.ratings,activities)}:{}),...(d.spendLevel!==undefined?{spendLevel:scale(d.spendLevel,'Price level')}:{}),...(d.comfort!==undefined?{comfort:scale(d.comfort,'Accommodation quality')}:{})};}
export function validateConfig(value:unknown):Config{
 if(!value||typeof value!=='object')throw fail('Choose a valid trip configuration.');const c=value as Config;
 if(!Array.isArray(c.dates)||c.dates.length<1||c.dates.length>12)throw fail('Add 1–12 date options.');
 const dates=c.dates.map(d=>{const id=date(d.id),end=date(d.end);if(end<id)throw fail('A date option must end on or after it starts.');return {id,end,label:text(d.label,'Date label',60)};});if(new Set(dates.map(d=>d.id)).size!==dates.length)throw fail('Date options need unique starting dates.');
 if(!Array.isArray(c.destinations)||c.destinations.length<1||c.destinations.length>12)throw fail('Add 1–12 destinations.');const destinations=c.destinations.map(d=>{const id=text(d.id,'Destination ID',50);if(!/^[a-z0-9-]+$/.test(id))throw fail('Destination IDs use lowercase letters, numbers and hyphens.');return {id,name:text(d.name,'Destination name',80),description:text(d.description,'Destination description',300,0),...profileFields(d,strings(c.activities,'Activities'))};});if(new Set(destinations.map(d=>d.id)).size!==destinations.length)throw fail('Destination IDs must be unique.');
 if(!Array.isArray(c.modules)||c.modules.some(m=>!modules.includes(m))||new Set(c.modules).size!==c.modules.length)throw fail('Choose supported planning tabs.');
 return {name:text(c.name,'Trip name',80),kind:text(c.kind,'Trip type',60),organizer:text(c.organizer,'Organizer display name',60),welcome:text(c.welcome,'Welcome',600),dates,destinations,activities:strings(c.activities,'Activities'),budgets:strings(c.budgets,'Budget bands',8),rooms:strings(c.rooms,'Room preferences',8),modules:c.modules};
}
export const emptyGuest=(id:string,name:string):Guest=>({id,name,rsvp:'pending',available:[],ranked:[],budget:'',room:'',interests:[],submitted:false});
export const emptyBoard=(config=defaultConfig):Board=>({revision:0,config:structuredClone(config),guests:[],expenses:[],plans:[],messages:[]});
export function demoBoard():Board{const b=emptyBoard();b.guests=['Alex','Jordan','Morgan','Taylor','Casey','Riley'].map((name,i)=>({...emptyGuest(`demo-${i}`,name),rsvp:i===5?'pending':'in',available:i===5?[]:b.config.dates.filter((_,d)=>(d+i)%3!==0).map(d=>d.id),ranked:i===5?[]:i%2?['coast','city','mountains']:['mountains','coast','city'],budget:'$500–$1,000',room:'Flexible',interests:['Food & drink','Outdoors'],submitted:i!==5}));b.plans=[{id:'welcome',kind:'agenda',title:'Welcome dinner',details:'First evening · choose a favorite local spot together.',owner:'demo-0',done:false},{id:'breakfast',kind:'meals',title:'Big group breakfast',details:'Jordan is on pancakes. Bring your favorite coffee.',owner:'demo-1',done:false},{id:'coffee',kind:'groceries',title:'Coffee & breakfast supplies',details:'Enough for six people for three mornings.',owner:'demo-1',done:false},{id:'carpool',kind:'travel',title:'Share a ride',details:'Alex has two spare seats. Coordinate here once dates are confirmed.',owner:'demo-0',done:false}];b.messages=[{id:'hello',author:'demo-2',text:'Can we leave one afternoon unplanned? A little room to wander would be lovely.'}];b.expenses=[{id:'demo-house',description:'House deposit · fictional example',amountCents:60000,currency:'USD',paidBy:'demo-0',participantIds:['demo-0','demo-1','demo-2','demo-3','demo-4'],date:'2027-06-01',notes:'Demo expense only',createdBy:'demo-0',removed:false}];return b;}
function selected(value:unknown,allowed:string[],label:string){if(!Array.isArray(value)||value.some(x=>typeof x!=='string'||!allowed.includes(x))||new Set(value).size!==value.length)throw fail(`Check ${label}.`);return value as string[];}
export type Action={type:string;[key:string]:unknown};
export function changeBoard(original:Board,a:Action,actor:string,organizer=false):Board{
 const b=structuredClone(original),g=b.guests.find(g=>g.id===actor),c=b.config;
 if(!g&&!organizer)throw fail('Sign in to your trip first.',401);
 if(a.type==='config'){
  if(!organizer)throw fail('Only the organizer can change trip settings.',403);const next=validateConfig(a.config);
  // Never silently drop choices that guests already submitted.
  for(const guest of b.guests){if(guest.available.some(id=>!next.dates.some(d=>d.id===id))||guest.ranked.some(id=>!next.destinations.some(d=>d.id===id))||(guest.budget&&!next.budgets.includes(guest.budget))||(guest.room&&!next.rooms.includes(guest.room))||guest.interests.some(v=>!next.activities.includes(v)))throw fail('A guest has already used a choice you removed. Keep existing choices and add new ones instead.',409);}
  b.config=next;
 }else if(a.type==='nominate'){
  if(!g)throw fail('Join the trip to nominate a place.');
  if(c.destinations.length>=12)throw fail('This trip has reached 12 places. Ask the organizer to update the shortlist.');
  const name=text(a.name,'Destination name',80);if(c.destinations.some(d=>d.name.toLowerCase()===name.toLowerCase()))throw fail('That place is already on the shortlist.',409);
  const id='place-'+crypto.randomUUID();c.destinations.push({id,name,description:text(a.description??'','Description',300,0),...profileFields(a as unknown as Destination,c.activities)});
 }else if(['rsvp','dates','priorities','accommodations','ballot'].includes(a.type)){
  if(!g)throw fail('Join as a guest to vote.');
  // Materialize legacy submission states before editing just one section.
  g.datesSubmitted=dateVoted(g);g.placesSubmitted=placeVoted(g);
  if(a.type==='rsvp'){
   if(!['in','out','pending'].includes(String(a.rsvp)))throw fail('Choose an RSVP.');g.rsvp=a.rsvp as Guest['rsvp'];
  }else if(a.type==='dates'){
   g.available=selected(a.available,c.dates.map(d=>d.id),'dates');g.dateRanked=selected(a.dateRanked,g.available,'date ranking');
   if(g.dateRanked.length!==g.available.length)throw fail('Rank every available date once.');g.datesSubmitted=true;
  }else if(a.type==='priorities'){
   g.priorities=ratings(a.priorities,c.activities);g.spending=scale(a.spending,'Budget sensitivity');g.comfort=scale(a.comfort,'Accommodation quality');
   g.interests=c.activities.filter(v=>(g.priorities?.[v]??5)>=6);g.preferencesSaved=true;
   // Submitted votes stay intact until the voter explicitly submits an update.
   if(!g.placesSubmitted&&g.ballotMode!=='manual')g.ranked=autoBallot(c,g);
  }else if(a.type==='accommodations'){
   g.budget=text(a.budget,'Budget',60);g.room=text(a.room,'Room',60);
   if(!c.budgets.includes(g.budget)||!c.rooms.includes(g.room))throw fail('Choose a listed budget and room preference.');g.preferencesSaved=true;
   if(!g.placesSubmitted&&g.ballotMode!=='manual')g.ranked=autoBallot(c,g);
  }else{
   g.ranked=selected(a.ranked,c.destinations.map(d=>d.id),'destination ranking');
   if(g.ranked.length!==Math.min(5,c.destinations.length))throw fail(`Choose your top ${Math.min(5,c.destinations.length)} destinations.`);
   if(!['auto','manual'].includes(String(a.ballotMode)))throw fail('Choose a ballot mode.');g.ballotMode=a.ballotMode as 'auto'|'manual';g.placesSubmitted=true;
  }
  g.submitted=g.datesSubmitted&&g.placesSubmitted;
 }else if(a.type==='preferences'){
  if(!g)throw fail('Join as a guest to submit preferences.');if(!['in','out','pending'].includes(String(a.rsvp)))throw fail('Choose an RSVP.');g.rsvp=a.rsvp as Guest['rsvp'];g.available=selected(a.available,c.dates.map(d=>d.id),'dates');g.ranked=selected(a.ranked,c.destinations.map(d=>d.id),'destination ranking');g.interests=selected(a.interests,c.activities,'activities');g.budget=text(a.budget,'Budget',60,0);g.room=text(a.room,'Room',60,0);if((g.budget&&!c.budgets.includes(g.budget))||(g.room&&!c.rooms.includes(g.room)))throw fail('Choose a listed budget and room preference.');g.datesSubmitted=true;g.placesSubmitted=g.ranked.length===Math.min(5,c.destinations.length);g.preferencesSaved=true;g.submitted=g.placesSubmitted;
 }else if(a.type==='expense'){
  if(!c.modules.includes('expenses'))throw fail('Expenses are disabled.');const id=text(a.id,'Expense ID',60);const old=b.expenses.find(e=>e.id===id);if(old&&old.createdBy!==actor&&!organizer)throw fail('Only the submitter or organizer can edit this expense.',403);if(old?.removed)throw fail('Restore the expense before editing.');const ids=selected(a.participantIds,b.guests.map(g=>g.id),'people sharing the cost');if(!ids.length)throw fail('Select at least one person.');if(a.splitMode==='all'&&JSON.stringify([...ids].sort())!==JSON.stringify(b.guests.filter(g=>g.rsvp!=='out').map(g=>g.id).sort()))throw fail('The guest list changed. Choose Everyone again.',409);if(!['all','selected'].includes(String(a.splitMode)))throw fail('Choose a split.');const paidBy=text(a.paidBy,'Payer',60);if(!b.guests.some(g=>g.id===paidBy))throw fail('Choose a trip guest as payer.');const entry:Cost={id,description:text(a.description,'Expense',120),amountCents:parseExpenseAmount(a.amount),currency:'USD',paidBy,participantIds:ids.sort(),date:date(a.date),notes:text(a.notes??'','Notes',1000,0),createdBy:old?.createdBy||actor,removed:false};if(old)Object.assign(old,entry);else{if(b.expenses.length>=500)throw fail('This trip has reached 500 expenses.');b.expenses.push(entry);}
 }else if(a.type==='remove-expense'||a.type==='restore-expense'){
  const e=b.expenses.find(e=>e.id===a.id);if(!e)throw fail('Expense not found.');if(e.createdBy!==actor&&!organizer)throw fail('Only the submitter or organizer can change this expense.',403);e.removed=a.type==='remove-expense';
 }else if(a.type==='plan'){
  const kind=a.kind as Module;if(!['travel','meals','groceries','agenda'].includes(kind)||!c.modules.includes(kind))throw fail('Choose an enabled planning tab.');if(b.plans.length>=300)throw fail('This trip has reached 300 plans.');const id=text(a.id,'Plan ID',60);if(b.plans.some(p=>p.id===id))throw fail('This plan was already saved.',409);b.plans.push({id,kind,title:text(a.title,'Title',120),details:text(a.details,'Details',1000,0),owner:actor,done:false});
 }else if(a.type==='toggle-plan'||a.type==='remove-plan'){
  const p=b.plans.find(p=>p.id===a.id);if(!p)throw fail('Plan not found.');if(p.owner!==actor&&!organizer)throw fail('Only its author or organizer can change this plan.',403);if(a.type==='toggle-plan')p.done=!p.done;else b.plans=b.plans.filter(item=>item.id!==p.id);
 }else if(a.type==='message'){
  if(!c.modules.includes('messages'))throw fail('Messages are disabled.');if(b.messages.length>=300)throw fail('This trip has reached 300 messages.');b.messages.push({id:text(a.id,'Message ID',60),author:actor,text:text(a.text,'Message',2000)});
 }else throw fail('Unsupported action.');b.revision++;return b;
}
export const totals=(b:Board)=>summarizeExpenses(b.expenses.filter(e=>!e.removed));
export const results=planningResults;
