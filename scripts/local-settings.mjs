import {createHash,randomBytes} from 'node:crypto';
import {writeFileSync,existsSync} from 'node:fs';
if(existsSync('.dev.vars'))throw Error('.dev.vars already exists; edit it deliberately rather than overwriting.');
const live=process.argv.includes('--live');const code=randomBytes(18).toString('hex');
writeFileSync('.dev.vars',live?`GROUPTRIPPER_MODE=live\nORGANIZER_EMAIL=seedy@sites.test\nTRIP_CODE_SHA256=${createHash('sha256').update(code).digest('hex')}\n`:'GROUPTRIPPER_MODE=demo\n',{mode:0o600});
if(live)console.log('Disposable local trip code (do not use in production): '+code);else console.log('Browser-only demo configured.');
