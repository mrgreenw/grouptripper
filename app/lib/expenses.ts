export type ExpensePerson={id:string;name:string;rsvp:'in'|'out'|null;archived:boolean};
export type ExpenseData={description:string;amountCents:number;currency:'USD';paidBy:string;participantIds:string[];date:string;notes:string};
export type ExpenseEntry=ExpenseData&{id:string;version:number;createdBy:string;createdByName:string;updatedByName:string;createdAt:string;updatedAt:string;archivedAt:string|null;canEdit:boolean};
export type ExpenseBalance={id:string;paidCents:number;shareCents:number;balanceCents:number};
export type ExpenseTransfer={from:string;to:string;amountCents:number};
export type ExpenseSummary={totalCents:number;count:number;balances:ExpenseBalance[];transfers:ExpenseTransfer[]};
export type ExpenseBoard={entries:ExpenseEntry[];people:ExpensePerson[];me:string|null;isOrganizer:boolean;summary:ExpenseSummary;asOf:string};
export const maximumExpenseCents=10_000_000;
const bad=(message:string,status=400)=>Object.assign(new Error(message),{status});

// Parse decimal dollars as integers, never using floating-point money arithmetic.
export function parseExpenseAmount(value:unknown):number{
 if(typeof value!=='string'||!/^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim()))throw bad('Enter a USD amount with no more than two decimal places.');
 const [dollars,cents='']=value.trim().split('.');
 const amount=Number(dollars)*100+Number(cents.padEnd(2,'0'));
 if(amount<1||amount>maximumExpenseCents)throw bad('Enter an amount from $0.01 to $100,000.00.');
 return amount;
}
export const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export const everyoneForExpense=(people:ExpensePerson[])=>people.filter(p=>!p.archived&&p.rsvp!=='out').map(p=>p.id).sort();
function text(value:unknown,label:string,max:number,required=false){
 if(typeof value!=='string')throw bad(`${label} must be text.`);
 const result=value.trim();
 if(result.length>max||(required&&!result)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result))throw bad(`${label} ${required?'is required and ':''}must be ${max} characters or fewer.`);
 return result;
}
export function validateExpense(value:unknown,people:ExpensePerson[],existing?:ExpenseData):ExpenseData{
 if(!value||typeof value!=='object'||Array.isArray(value))throw bad('Check the expense details.');
 const input=value as Record<string,unknown>;
 if(input.currency!=='USD')throw bad('Expenses are recorded in USD. Convert other currencies before entering them.');
 const description=text(input.description,'Description',120,true),notes=text(input.notes,'Notes',1000);
 const amountCents=parseExpenseAmount(input.amount),date=text(input.date,'Expense date',10,true);
 if(!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw bad('Enter a valid expense date between 2000 and 2099.');
 const paidBy=text(input.paidBy,'Person who paid',100,true),payer=people.find(p=>p.id===paidBy);
 if(!payer||(payer.archived&&existing?.paidBy!==paidBy))throw bad('Choose a current trip member as the payer.');
 if(!Array.isArray(input.participantIds)||!input.participantIds.length||input.participantIds.length>50||input.participantIds.some(id=>typeof id!=='string'||id.length>100)||new Set(input.participantIds).size!==input.participantIds.length)throw bad('Select at least one person, without duplicates (up to 50 people).');
 const participantIds=(input.participantIds as string[]).slice().sort();
 for(const id of participantIds){const person=people.find(p=>p.id===id);if(!person||(person.archived&&!existing?.participantIds.includes(id)))throw bad('A selected person is no longer active. Review who shares this expense.');}
 if(input.splitMode!=='all'&&input.splitMode!=='selected')throw bad('Choose everyone or selected people.');
 if(input.splitMode==='all'&&JSON.stringify(participantIds)!==JSON.stringify(everyoneForExpense(people)))throw bad('The participant list changed. Refresh, then choose Everyone again before saving.',409);
 return {description,amountCents,currency:'USD',paidBy,participantIds,date,notes};
}
export const canEditExpense=(createdBy:string,viewer:string,isOrganizer:boolean)=>createdBy===viewer||isOrganizer;

export function expenseShares(amountCents:number,participantIds:string[]){
 if(!Number.isSafeInteger(amountCents)||amountCents<1||amountCents>maximumExpenseCents||!participantIds.length||participantIds.length>50||new Set(participantIds).size!==participantIds.length)throw bad('This expense has an invalid amount or split.');
 const ids=participantIds.slice().sort(),base=Math.floor(amountCents/ids.length),remainder=amountCents%ids.length;
 return ids.map((id,index)=>({id,amountCents:base+(index<remainder?1:0)}));
}
export function summarizeExpenses(entries:(ExpenseData&{archivedAt?:string|null})[]):ExpenseSummary{
 const balances=new Map<string,ExpenseBalance>();
 const person=(id:string)=>{let value=balances.get(id);if(!value){value={id,paidCents:0,shareCents:0,balanceCents:0};balances.set(id,value);}return value;};
 let totalCents=0,count=0;
 for(const entry of entries){
  if(entry.archivedAt)continue;
  const shares=expenseShares(entry.amountCents,entry.participantIds);
  totalCents+=entry.amountCents;count++;
  person(entry.paidBy).paidCents+=entry.amountCents;
  for(const share of shares)person(share.id).shareCents+=share.amountCents;
 }
 const rows=[...balances.values()].sort((a,b)=>a.id.localeCompare(b.id));
 for(const row of rows)row.balanceCents=row.paidCents-row.shareCents;
 // Net all costs, then match debtors to creditors. At most n-1 transfers.
 const creditors=rows.filter(r=>r.balanceCents>0).map(r=>({id:r.id,remaining:r.balanceCents}));
 const debtors=rows.filter(r=>r.balanceCents<0).map(r=>({id:r.id,remaining:-r.balanceCents}));
 const order=(a:{id:string;remaining:number},b:{id:string;remaining:number})=>b.remaining-a.remaining||a.id.localeCompare(b.id);
 creditors.sort(order);debtors.sort(order);
 const transfers:ExpenseTransfer[]=[];
 let c=0,d=0;
 while(c<creditors.length&&d<debtors.length){
  const amountCents=Math.min(creditors[c].remaining,debtors[d].remaining);
  transfers.push({from:debtors[d].id,to:creditors[c].id,amountCents});
  creditors[c].remaining-=amountCents;debtors[d].remaining-=amountCents;
  if(!creditors[c].remaining)c++;if(!debtors[d].remaining)d++;
 }
 return {totalCents,count,balances:rows,transfers};
}
