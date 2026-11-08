export type ShirtQuotaSettings={testAccountIds:string[];testDaily:number};
export type ShirtQuotaEnvironment={SHIRT_TEST_ACCOUNT_IDS?:string;SHIRT_TEST_DAILY_LIMIT?:string};
export function shirtQuotaSettings(env:ShirtQuotaEnvironment):ShirtQuotaSettings{
 const fallback={testAccountIds:[],testDaily:20};
 try{
  const ids:unknown=JSON.parse(env.SHIRT_TEST_ACCOUNT_IDS||'[]'),limit=Number(env.SHIRT_TEST_DAILY_LIMIT||'20');
  if(!Array.isArray(ids)||ids.length>50||!ids.every(id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))||!Number.isInteger(limit)||limit<1||limit>100)return fallback;
  return {testAccountIds:[...new Set(ids)] as string[],testDaily:limit};
 }catch{return fallback;}
}
export function shirtLimitsFor(member:string,config:ShirtQuotaSettings){
 const testing=config.testAccountIds.includes(member);
 return {personal:testing?config.testDaily:2,total:testing?config.testDaily:10,pending:1,pool:testing?'testing' as const:'demo' as const,windowHours:24};
}
