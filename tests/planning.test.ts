import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyBoard,emptyGuest,changeBoard,defaultConfig,validateConfig,demoBoard} from '../app/lib/trip.ts';
import {dateOrder,dateVoted,placeVoted,autoBallot,matches,roomFit,monthCells,planningResults,guestBoard,applyRanks,moveItem,destinationProfile} from '../app/lib/planning.ts';
const fixture=()=>{const b=emptyBoard();b.guests=[emptyGuest('a','Alex'),emptyGuest('b','Jordan')];return b;};
test('guided actions keep preference saves distinct from date and place ballots',()=>{
 let b=fixture();b=changeBoard(b,{type:'rsvp',rsvp:'in'},'a');assert.equal(dateVoted(b.guests[0]),false);
 b=changeBoard(b,{type:'priorities',priorities:{Outdoors:10},spending:3,comfort:7},'a');assert.equal(b.guests[0].preferencesSaved,true);assert.equal(placeVoted(b.guests[0]),false);assert.equal(b.guests[0].ranked.length,3);
 b=changeBoard(b,{type:'dates',available:[b.config.dates[0].id],dateRanked:[b.config.dates[0].id]},'a');assert.equal(dateVoted(b.guests[0]),true);assert.equal(placeVoted(b.guests[0]),false);
 b=changeBoard(b,{type:'ballot',ranked:autoBallot(b.config,b.guests[0]),ballotMode:'auto'},'a');assert.equal(b.guests[0].submitted,true);assert.equal(placeVoted(b.guests[1]),false);
});
test('previously submitted guests retain their votes when updating only sliders or RSVP',()=>{
 const b=demoBoard(),g=b.guests[0],next=changeBoard(b,{type:'priorities',priorities:{Outdoors:0},spending:10,comfort:10},g.id);
 assert.deepEqual(next.guests[0].ranked,g.ranked);assert.equal(dateVoted(next.guests[0]),true);assert.equal(placeVoted(next.guests[0]),true);
 assert.deepEqual(changeBoard(b,{type:'rsvp',rsvp:'pending'},g.id).guests[0].available,g.available);
});
test('sliders change sort order, never filter low matches or unknown places',()=>{
 const b=fixture();b.config.activities=['Golf','Nightlife'];b.config.destinations=[{id:'golf',name:'Golf option',description:'',ratings:{Golf:10,Nightlife:0}},{id:'city',name:'City option',description:'',ratings:{Golf:0,Nightlife:10}},{id:'new',name:'Unknown city',description:''}];
 const g=b.guests[0];g.priorities={Golf:10,Nightlife:0};assert.equal(matches(b.config,g)[0].id,'golf');g.priorities={Golf:0,Nightlife:10};const m=matches(b.config,g);assert.equal(m[0].id,'city');assert.equal(m.length,3);assert.equal(m[2].score,null);
 assert.equal(destinationProfile({id:'coast',name:'Unknown city',description:''},['Golf']).source,'Not rated yet');
});
test('five-choice ballot validates length, duplicates and foreign IDs; a submitted ballot can be changed',()=>{
 let b=fixture();b.config.destinations=Array.from({length:7},(_,i)=>({id:'p'+i,name:'Place '+i,description:''}));
 for(const ranked of [[],['p0'],['p0','p1','p2','p3','p4','p5'],['p0','p0','p2','p3','p4'],['p0','p1','p2','p3','foreign']])assert.throws(()=>changeBoard(b,{type:'ballot',ranked,ballotMode:'manual'},'a'));
 b=changeBoard(b,{type:'ballot',ranked:['p0','p1','p2','p3','p4'],ballotMode:'manual'},'a');b=changeBoard(b,{type:'ballot',ranked:['p6','p1','p2','p3','p4'],ballotMode:'manual'},'a');assert.equal(b.guests[0].ranked[0],'p6');assert.equal(planningResults(b).destinations[0].points,5);
});
test('date rankings cover exactly the available options; empty availability is a submitted vote',()=>{
 let b=fixture();assert.throws(()=>changeBoard(b,{type:'dates',available:[b.config.dates[0].id],dateRanked:[]},'a'));
 b=changeBoard(b,{type:'dates',available:[],dateRanked:[]},'a');assert.equal(planningResults(b).dates[0].no.length,1);assert.equal(planningResults(b).dates[0].waiting.length,1);
 const g={...b.guests[0],available:b.config.dates.map(d=>d.id),dateRanked:[b.config.dates[1].id]};assert.deepEqual(dateOrder(g,b.config),[b.config.dates[1].id,b.config.dates[0].id,b.config.dates[2].id]);
});
test('results are redacted at the API boundary until both ballots are in, while RSVP/status stays visible',()=>{
 const b=demoBoard();b.guests.push(emptyGuest('new','New guest'));const view=guestBoard(b,'new');assert.equal(view.guests[0].name,'Alex');assert.equal(view.guests[0].rsvp,'in');assert.equal(placeVoted(view.guests[0]),true);assert.deepEqual(view.guests[0].ranked,[]);assert.deepEqual(view.guests[0].available,[]);assert.equal(view.guests[0].budget,'');
 assert.deepEqual(guestBoard(b,'demo-0'),b);assert.notDeepEqual(view,b);assert.ok(b.guests[0].ranked.length);
});
test('guest nominations are scoped to the board and reject duplicates/cap/invalid profiles',()=>{
 const b=fixture(),next=changeBoard(b,{type:'nominate',name:'New place',description:'A group suggestion'},'a');assert.equal(next.config.destinations.length,4);assert.equal(b.config.destinations.length,3);
 assert.throws(()=>changeBoard(next,{type:'nominate',name:'new place'},'b'),{status:409});assert.throws(()=>changeBoard(b,{type:'nominate',name:'A',ratings:{Golf:99}},'a'));
 assert.throws(()=>changeBoard(b,{type:'nominate',name:'A'},'stranger'),{status:401});
});
test('profiles validate finite bounded numbers; room fit warns at both budget extremes',()=>{
 assert.throws(()=>validateConfig({...defaultConfig,destinations:[{id:'bad',name:'Bad',description:'',ratings:{Outdoors:NaN}}]}));
 const c={...defaultConfig,budgets:['Under $1,000','$1,000–$1,500','$1,500–$2,000','$2,000–$2,500','$2,500+']};
 assert.equal(roomFit('Master suite',c.budgets[0],c).level,'warning');assert.equal(roomFit('Couch / Broom Closet',c.budgets[4],c).level,'muted');assert.equal(roomFit('Private room',c.budgets[4],c).level,'good');
});
test('calendar uses UTC dates and includes leap days; manual ranking requires a permutation',()=>{
 const cells=monthCells(2028,1);assert.ok(cells.includes('2028-02-29'));assert.equal(cells.filter(Boolean).length,29);
 assert.deepEqual(applyRanks(['a','b','c'],{a:'3',b:'1',c:'2'}),['b','c','a']);assert.throws(()=>applyRanks(['a','b'],{a:'1',b:'1'}));assert.deepEqual(moveItem(['a','b','c'],'c',0),['c','a','b']);
});
