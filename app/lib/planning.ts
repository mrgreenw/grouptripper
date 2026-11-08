import type {Config,Guest,Board} from './trip.ts';

export type Destination={id:string;name:string;description:string;ratings?:Record<string,number>;spendLevel?:number;comfort?:number};
export const dateVoted=(g:Guest)=>g.datesSubmitted??g.submitted;
export const placeVoted=(g:Guest)=>g.placesSubmitted??g.submitted;
export const prioritiesFor=(g:Guest,c:Config)=>Object.fromEntries(c.activities.map(a=>[a,g.priorities?.[a]??(g.interests.includes(a)?8:5)]));
export function dateOrder(g:Guest,c:Config){const available=c.dates.map(d=>d.id).filter(id=>g.available.includes(id));return [...(g.dateRanked||[]).filter(id=>available.includes(id)),...available.filter(id=>!g.dateRanked?.includes(id))];}
export function moveItem(ids:string[],id:string,index:number){const next=ids.filter(v=>v!==id);next.splice(Math.max(0,Math.min(index,next.length)),0,id);return next;}
export function applyRanks(ids:string[],values:Record<string,string>){
 const ranks=ids.map(id=>Number(values[id]));
 if(ranks.some(n=>!Number.isInteger(n)||n<1||n>ids.length)||new Set(ranks).size!==ids.length)throw Error(`Use each rank from 1 to ${ids.length} once.`);
 return [...ids].sort((a,b)=>Number(values[a])-Number(values[b]));
}

// These are illustrative trip styles, not researched scores for real cities.
const styles:Record<string,string>={
 'City reunion':'city','Resort reunion':'resort','Mountain golf retreat':'mountain-golf','Lakeside golf getaway':'house-golf','Coastal escape':'coast','Mountain retreat':'mountain','City weekend':'city','Lakeside house':'house','Beach rental':'coast','Mountain lodge':'mountain',
 'Golf resort':'golf','Coastal golf getaway':'coast-golf','Golf + city break':'city-golf','City stay':'city','Beach house':'coast','Countryside retreat':'mountain',
 'Lake cabin':'house','Mountain base':'mountain','City celebration':'city','Beach weekend':'coast','Resort weekend':'resort','Resort retreat':'resort','House getaway':'house','Resort escape':'resort'
};
export function destinationProfile(d:Destination,activities:string[]){
 if(d.ratings||d.spendLevel!==undefined||d.comfort!==undefined)return {ratings:d.ratings||{},spendLevel:d.spendLevel,comfort:d.comfort,source:'Organizer / nominee ratings'};
 const style=styles[d.name];if(!style)return {ratings:{},spendLevel:undefined,comfort:undefined,source:'Not rated yet'};
 const ratings=Object.fromEntries(activities.map(a=>{let v=5;const s=a.toLowerCase();
  if(/golf|course|practice/.test(s))v=style.includes('golf')||style==='golf'?9:style==='resort'?7:3;
  else if(/nightlife|live |entertainment|arts|culture|shopping|sightseeing/.test(s))v=style.includes('city')?9:style==='resort'?7:3;
  else if(/outdoor|outdoors|adventure/.test(s))v=/mountain|house|coast/.test(style)?9:style==='city'?4:7;
  else if(/food|meal|dinner/.test(s))v=style.includes('city')?9:7;
  else if(/relax|wellness|spa/.test(s))v=/resort|coast|mountain/.test(style)?9:style==='city'?5:7;
  else if(/together|kids|games|group|storytelling/.test(s))v=style==='house'?9:7;
  return [a,v];}));
 return {ratings,spendLevel:style==='house'?3:/resort|golf/.test(style)?8:6,comfort:/resort|golf/.test(style)?9:style==='house'?5:7,source:'Illustrative starter profile'};
}
export function matches(c:Config,g:Guest){const priorities=prioritiesFor(g,c);return c.destinations.map((d,index)=>{
 const profile=destinationProfile(d,c.activities);let total=0,weight=0,known=0;
 for(const a of c.activities){const w=priorities[a];if(w>0&&profile.ratings[a]!==undefined){total+=profile.ratings[a]*10*w;weight+=w;known++;}}
 if(profile.spendLevel!==undefined){total+=(100-Math.abs((g.spending??5)-profile.spendLevel)*10)*5;weight+=5;}
 if(profile.comfort!==undefined){total+=(100-Math.abs((g.comfort??5)-profile.comfort)*10)*4;weight+=4;}
 return {...d,score:weight?Math.round(total/weight):null,profile,known,index};
 }).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.index-b.index);}
export const autoBallot=(c:Config,g:Guest)=>matches(c,g).slice(0,5).map(d=>d.id);
export function roomFit(room:string,budget:string,c:Config){
 if(!budget||/flexible|not sure/i.test(room))return {level:'neutral',label:'Flexible'};
 const tier=/master|suite/i.test(room)?4:/private/i.test(room)?3:/shared room/i.test(room)?2:/shared bed/i.test(room)?1:/couch|closet/i.test(room)?0:null;
 if(tier===null)return {level:'neutral',label:'Discuss with the group'};
 const index=c.budgets.indexOf(budget);if(index<0)return {level:'neutral',label:'Choose a budget'};
 const expected=Math.round(index*4/Math.max(1,c.budgets.length-1));
 if(tier>expected+1)return {level:'warning',label:'May exceed your budget'};
 if(tier<expected-1)return {level:'muted',label:'Below this budget’s usual room expectation'};
 return {level:'good',label:'Likely fit'};
}
export function planningResults(b:Board){const voters=b.guests.filter(g=>g.rsvp!=='out');return {
 voters,
 dates:b.config.dates.map(d=>{const yes=voters.filter(g=>dateVoted(g)&&g.available.includes(d.id)),no=voters.filter(g=>dateVoted(g)&&!g.available.includes(d.id)),waiting=voters.filter(g=>!dateVoted(g));const points=yes.reduce((n,g)=>{const ranked=dateOrder(g,b.config);const rank=ranked.indexOf(d.id);return n+(rank<0?0:b.config.dates.length-rank);},0);return {...d,yes,no,waiting,points};}).sort((a,b)=>b.yes.length-a.yes.length||b.points-a.points||a.id.localeCompare(b.id)),
 destinations:b.config.destinations.map(d=>({...d,points:voters.reduce((n,g)=>{const rank=g.ranked.slice(0,5).indexOf(d.id);return n+(placeVoted(g)&&rank>=0?5-rank:0);},0),first:voters.filter(g=>placeVoted(g)&&g.ranked[0]===d.id).length})).sort((a,b)=>b.points-a.points)
 };}
export const dayDate=(id:string)=>new Date(id+'T12:00:00Z');
export function dateLabel(d:Config['dates'][number]){const fmt=(id:string)=>dayDate(id).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});return `${fmt(d.id)}${d.end!==d.id?' – '+fmt(d.end):''}, ${d.id.slice(0,4)}`;}
export function monthCells(year:number,month:number){const first=new Date(Date.UTC(year,month,1)),last=new Date(Date.UTC(year,month+1,0));return Array.from({length:Math.ceil((first.getUTCDay()+last.getUTCDate())/7)*7},(_,i)=>{const day=i-first.getUTCDay()+1;return day<1||day>last.getUTCDate()?null:new Date(Date.UTC(year,month,day)).toISOString().slice(0,10);});}

/** Keep other ballots out of the guest payload until both of this guest's votes are in. */
export function guestBoard(board:Board,me:string|null){
 const voter=board.guests.find(g=>g.id===me);
 if(voter&&dateVoted(voter)&&placeVoted(voter))return board;
 return {...board,guests:board.guests.map(g=>g.id===me?g:{...g,available:[],dateRanked:[],ranked:[],budget:'',room:'',interests:[],priorities:{},spending:undefined,comfort:undefined,datesSubmitted:dateVoted(g),placesSubmitted:placeVoted(g)})};
}
