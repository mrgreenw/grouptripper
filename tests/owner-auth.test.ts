import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSiteOwner,privateAdminLink} from '../app/lib/owner-auth.ts';
test('site owner requires configured identity and verified user ID; trip organizer status is insufficient',()=>{
 assert.equal(isSiteOwner(null,'owner@example.test'),false);
 assert.equal(isSiteOwner({userId:'',email:'owner@example.test'},'owner@example.test'),false);
 assert.equal(isSiteOwner({userId:'owner',email:'owner@example.test'},''),false);
 assert.equal(isSiteOwner({userId:'guest',email:'other@example.test'},'owner@example.test'),false);
 assert.equal(isSiteOwner({userId:'owner',email:' OWNER@example.test '},'owner@example.test'),true);
});
test('optional admin navigation only permits HTTPS without credentials',()=>{
 for(const url of [undefined,'javascript:alert(1)','//example.test/admin','http://example.test/admin','https://token@example.test/admin'])assert.equal(privateAdminLink(url),null);
 assert.equal(privateAdminLink('https://example.test/admin'),'https://example.test/admin');
});
