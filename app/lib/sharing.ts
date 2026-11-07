export function shareLink(origin:string,code?:string){const url=new URL('/',origin);url.hash=code?'join='+encodeURIComponent(code):'create';return url.href;}
export function sharedEntry(hash:string):{entry:'join'|'create';code:string}|null{
 if(hash==='#create')return {entry:'create',code:''};
 const code=new URLSearchParams(hash.replace(/^#/, '')).get('join')?.trim().toLowerCase();
 return code&&/^trip-(?:[a-f0-9]{12}|[a-f0-9]{24})$/.test(code)?{entry:'join',code}:null;
}
