import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
test('public template contains no tracked local runtime, environment files or private image bundles',()=>{const files=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/);assert.ok(files.length>0);assert.ok(files.every(p=>!/^\.dev\.vars|^\.env(?!\.example)|^(?:node_modules|work|\.wrangler|\.sites-runtime)\//.test(p)));assert.deepEqual(readdirSync('public'),['favicon.svg']);});
test('template reset explicitly detaches hosting and requires confirmation',()=>{const script=readFileSync('scripts/new-trip.mjs','utf8');assert.ok(script.includes('--confirm-new-site'));assert.ok(script.includes('delete config.project_id'));assert.ok(script.includes("existsSync('.wrangler/state')"));});
test('donation section contains the supplied Venmo destination and no invented PayPal or Apple Cash link',()=>{const ui=readFileSync('app/grouptripper.tsx','utf8');assert.ok(ui.includes('https://venmo.com/u/Mark-Greenwood-14'));assert.ok(ui.includes('PayPal · link not provided'));assert.ok(ui.includes('Apple Cash · details not provided'));});
