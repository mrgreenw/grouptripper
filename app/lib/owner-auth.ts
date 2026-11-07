// Identity headers are supplied by the Sites gateway, never by guest accounts.
export function isSiteOwner(user:{userId:string;email:string}|null,email:string|undefined){
 return !!user?.userId && !!email?.trim() && user.email.trim().toLowerCase()===email.trim().toLowerCase();
}
export function privateAdminLink(value:string|undefined){
 if(!value)return null;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
