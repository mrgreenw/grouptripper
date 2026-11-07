import test from 'node:test';
import assert from 'node:assert/strict';
import {shirtThemes,shirtThemeFor,starterInput,blankShirtInput} from '../app/lib/shirt-starters.ts';
import {shirtInput} from '../app/lib/shirts.ts';
import {tripTemplates} from '../app/lib/trip-templates.ts';
test('every demo theme has a sample and two server-valid prompt starters',()=>{
 assert.equal(shirtThemes.length,8);assert.equal(new Set(shirtThemes.map(t=>t.id)).size,8);
 for(const t of tripTemplates){const theme=shirtThemeFor(t.id==='custom'?'Custom trip':t.label);assert.equal(theme.id,t.id);assert.equal(theme.ideas.length,2);assert.notEqual(theme.ideas[0].idea,theme.ideas[1].idea);for(let i=0;i<2;i++){const input=starterInput(theme,'Our actual trip',i);assert.deepEqual(shirtInput(input),input);assert.equal(input.headline,'Our actual trip');assert.equal(input.locationLine,'');assert.equal(input.eventLine,'');assert.equal(input.nsfw,false);}}
});
test('theme matching supports existing labels, straight apostrophes, and custom fallback',()=>{assert.equal(shirtThemeFor("Girls' weekend").id,'girls-weekend');assert.equal(shirtThemeFor('BOYS WEEKEND').id,'boys-weekend');assert.equal(shirtThemeFor('Golf trip').id,'golf-trip');assert.equal(shirtThemeFor('Our ski adventure').id,'custom');});
test('starter drafts are independent and blank drafts require an original idea before submission',()=>{
 const t=shirtThemeFor('Golf trip'),a=starterInput(t,'A'.repeat(100)),b=starterInput(t,'Actual name',1);assert.equal(a.headline.length,60);assert.equal(b.shirtColor,'Navy');a.idea='Changed';assert.notEqual(starterInput(t,'Another').idea,'Changed');
 const blank=blankShirtInput('Actual name');assert.equal(blank.headline,'Actual name');assert.equal(blank.idea,'');assert.equal(blank.slogan,'');assert.throws(()=>shirtInput(blank));
});
