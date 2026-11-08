import test from 'node:test';
import assert from 'node:assert/strict';
import {shirtQuotaSettings,shirtLimitsFor} from '../app/lib/shirt-quotas.ts';
const id='00000000-0000-4000-8000-000000000020';
test('testing allowance is restricted to configured account IDs; ordinary users keep the guest pool',()=>{
 const config=shirtQuotaSettings({SHIRT_TEST_ACCOUNT_IDS:JSON.stringify([id,id]),SHIRT_TEST_DAILY_LIMIT:'20'});
 assert.deepEqual(config.testAccountIds,[id]);assert.deepEqual(shirtLimitsFor(id,config),{personal:20,total:20,pending:1,pool:'testing',windowHours:24});
 for(const member of ['howard','organizer','admin','00000000-0000-4000-8000-000000000099'])assert.deepEqual(shirtLimitsFor(member,config),{personal:2,total:10,pending:1,pool:'demo',windowHours:24});
});
test('missing or malformed configuration never grants an elevated allowance',()=>{
 for(const env of [{},{SHIRT_TEST_ACCOUNT_IDS:'bad'},{SHIRT_TEST_ACCOUNT_IDS:'["howard"]'},{SHIRT_TEST_ACCOUNT_IDS:JSON.stringify([id]),SHIRT_TEST_DAILY_LIMIT:'0'},{SHIRT_TEST_ACCOUNT_IDS:JSON.stringify([id]),SHIRT_TEST_DAILY_LIMIT:'101'},{SHIRT_TEST_ACCOUNT_IDS:JSON.stringify([id]),SHIRT_TEST_DAILY_LIMIT:'2.5'}])assert.equal(shirtLimitsFor(id,shirtQuotaSettings(env)).personal,2);
});
