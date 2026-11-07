import {randomBytes} from 'node:crypto';
import {db,digest,passwordHash,response} from './backend';
import {fail,type Action} from './trip';

// Called only after the site owner's verified identity and CSRF checks.
export async function issuePasswordReset(accountId:unknown){
 if(typeof accountId!=='string')throw fail('Choose an account.');
 const account=await db().prepare('SELECT id,username FROM grouptripper_accounts WHERE id=?').bind(accountId).first<{id:string;username:string}>();
 if(!account)throw fail('Account not found.',404);
 const token=randomBytes(32).toString('hex'),now=Date.now(),expires=now+30*60*1000;
 await db().prepare('INSERT INTO grouptripper_password_resets (account_id,token_hash,expires,created) VALUES (?,?,?,?) ON CONFLICT(account_id) DO UPDATE SET token_hash=excluded.token_hash,expires=excluded.expires,created=excluded.created').bind(account.id,digest(token),expires,now).run();
 return response({username:account.username,path:'/reset-password#token='+token,expires});
}

export async function resetPassword(a:Action){
 if(typeof a.token!=='string'||!/^[a-f0-9]{64}$/.test(a.token))throw fail('This reset link is invalid or expired. Ask the site owner for a new one.',400);
 if(typeof a.password!=='string'||a.password.length<8||a.password.length>256)throw fail('Use a password of at least 8 characters. No special symbols required.');
 const hash=digest(a.token),now=Date.now(),password=passwordHash(a.password);
 // D1 executes the batch atomically: a racing request cannot reuse the token.
 const result=await db().batch([
  db().prepare('UPDATE grouptripper_accounts SET password=? WHERE id=(SELECT account_id FROM grouptripper_password_resets WHERE token_hash=? AND expires>?)').bind(password,hash,now),
  db().prepare('DELETE FROM grouptripper_sessions WHERE member=(SELECT account_id FROM grouptripper_password_resets WHERE token_hash=? AND expires>?)').bind(hash,now),
  db().prepare('DELETE FROM grouptripper_password_resets WHERE token_hash=?').bind(hash)
 ]);
 if(result[0].meta.changes!==1)throw fail('This reset link is invalid or expired. Ask the site owner for a new one.',400);
 return response({saved:true});
}
