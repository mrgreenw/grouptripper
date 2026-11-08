import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tripTemplates,configFromTemplate} from '../app/lib/trip-templates.ts';
import {defaultConfig,emptyBoard,validateConfig,changeBoard,emptyGuest} from '../app/lib/trip.ts';
const now=new Date('2026-12-20T23:30:00Z'),base={name:'Our own name',organizer:'Our organizer'};
test('all seven themed starters produce editable valid configs with future example weekends and no guest data',()=>{
 assert.equal(tripTemplates.length,8);assert.equal(new Set(tripTemplates.map(t=>t.id)).size,8);
 for(const template of tripTemplates.filter(t=>t.id!=='custom')){
  const config=configFromTemplate(template.id,base,now);assert.deepEqual(validateConfig(config),config);assert.equal(config.name,base.name);assert.equal(config.organizer,base.organizer);assert.equal(config.kind,template.label);assert.equal(config.dates.length,3);
  for(const date of config.dates){assert.ok(new Date(date.id)>now);assert.equal(new Date(date.end).getUTCDay(),0);assert.equal((Date.parse(date.end)-Date.parse(date.id))/86400000,template.nights);}
  const board=emptyBoard(config);assert.equal(board.guests.length,0);assert.equal(board.plans.length,0);assert.equal(board.messages.length,0);assert.equal(board.expenses.length,0);
  board.guests.push(emptyGuest('creator','Test organizer'));const changed=changeBoard(board,{type:'config',config:{...config,name:'Edited',activities:['Our activity']}},'creator',true);assert.equal(changed.config.name,'Edited');assert.deepEqual(changed.config.activities,['Our activity']);
 }
});
test('custom trip uses supplied dates and destination instead of themed examples',()=>{
 const custom=configFromTemplate('custom',{...base,customKind:'Ski trip',startDate:'2027-02-08',endDate:'2027-02-15',firstDestination:'Our cabin'},now);
 assert.equal(custom.kind,'Ski trip');assert.deepEqual(custom.dates,[{id:'2027-02-08',end:'2027-02-15',label:'First date option'}]);assert.deepEqual(custom.destinations,[{id:'first-destination',name:'Our cabin',description:''}]);assert.ok(!custom.activities.includes('Golf'));
 for(const patch of [{startDate:undefined},{endDate:'2027-02-01'},{firstDestination:'   '},{startDate:'2027-02-29'}])assert.throws(()=>configFromTemplate('custom',{...base,startDate:'2027-02-08',endDate:'2027-02-15',firstDestination:'Our cabin',...patch},now));
});
test('removing a weekend closes default label gaps without moving dates or saved votes',()=>{
 const config=configFromTemplate('golf-trip',base,now),board=emptyBoard(config),third=config.dates[2];
 board.guests.push({...emptyGuest('guest','Test guest'),available:[third.id],dateRanked:[third.id],datesSubmitted:true});
 const next=changeBoard(board,{type:'config',config:{...config,dates:config.dates.filter((_,i)=>i!==1)}},'organizer',true);
 assert.deepEqual(next.config.dates.map(d=>d.label),['Weekend option 1','Weekend option 2']);
 assert.deepEqual(next.config.dates[1],{...third,label:'Weekend option 2'});
 assert.deepEqual(next.guests,board.guests);
 assert.equal(board.config.dates[2].label,'Weekend option 3');
 const firstRemoved=validateConfig({...config,dates:config.dates.slice(1)});
 assert.deepEqual(firstRemoved.dates.map(d=>d.label),['Weekend option 1','Weekend option 2']);
 const custom=validateConfig({...config,dates:[config.dates[0],{...third,label:'Labor Day weekend'}]});
 assert.equal(custom.dates[1].label,'Labor Day weekend');
 assert.throws(()=>changeBoard(board,{type:'config',config:{...config,dates:config.dates.slice(0,2)}},'organizer',true),{status:409});
});
test('unknown templates fail; independent copies and older clients preserve their behavior',()=>{
 for(const id of ['',null,'secret-trip',{id:'golf-trip'}])assert.throws(()=>configFromTemplate(id,base,now));
 const a=configFromTemplate('golf-trip',base,now),b=configFromTemplate('golf-trip',base,now);a.activities.push('Changed');a.destinations[0].name='Changed';a.rooms[0]='Changed';assert.notDeepEqual(a,b);assert.deepEqual(b,configFromTemplate('golf-trip',base,now));assert.notEqual(defaultConfig.destinations[0].name,'Changed');
 assert.deepEqual(configFromTemplate(undefined,base,now),{...defaultConfig,name:base.name,organizer:base.organizer});
});
