export type DemoControls={revision:number;tripsPaused:number;accountsPaused:number;shirtsPaused:number;tripsDaily:number;accountsDaily:number;tripsTotal:number;accountsTotal:number;designsTotal:number};
export type DemoUsage={trips:number;accounts:number;tripsToday:number;accountsToday:number;designs:number};
export const capFields=['tripsDaily','accountsDaily','tripsTotal','accountsTotal','designsTotal'] as const;
export const pauseFields=['tripsPaused','accountsPaused','shirtsPaused'] as const;
export function validateControls(a:Record<string,unknown>):DemoControls{
 const result={} as DemoControls;
 if(!Number.isSafeInteger(a.revision)||Number(a.revision)<0)throw Error('Refresh the controls and try again.');result.revision=Number(a.revision);
 for(const field of capFields){const n=a[field];if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>10000)throw Error('Limits must be whole numbers from 1 to 10,000.');result[field]=n;}
 for(const field of pauseFields){if(a[field]!==0&&a[field]!==1)throw Error('Choose a valid pause setting.');result[field]=a[field] as number;}
 return result;
}
