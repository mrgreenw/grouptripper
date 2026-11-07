'use client';
import {useEffect,useState} from 'react';
import {shareLink} from './lib/sharing';
export default function SharePanel({tripName,code,paused=false,busy=false,onManage}:{tripName?:string;code?:string;paused?:boolean;busy?:boolean;onManage?:(action:'pause'|'resume'|'rotate')=>void}){
 const [message,setMessage]=useState('');
 async function share(copy=false){const url=shareLink(location.origin,code),title=code?`Join ${tripName}`:'Plan your own trip with GroupTripper',text=code?`Join our trip on GroupTripper. Create an account or sign in to RSVP and help plan. No ChatGPT account needed.`:'Create your own group trip on GroupTripper: pick a template, invite your people, vote on dates and places, and try Shirt Studio. No ChatGPT account needed.';
 try{if(!copy&&navigator.share){await navigator.share({title,text,url});setMessage('Share sheet opened.');}else{await navigator.clipboard.writeText(text+'\n'+url);setMessage('Link copied. Paste it into your group text.');}}
 catch(e){if((e as Error).name!=='AbortError')setMessage('Copy the link from the field below to share it.');}}
 return <section className="card share-panel" aria-label={code?'Trip invitations':'Share GroupTripper'}><div><span className="eyebrow">{code?'YOUR TRIP':'PASS IT ON'}</span><h3>{code?'Invite your people':'Know someone planning a trip?'}</h3><p>{code?'Anyone with this invite can join your group. Share it with the people you want on this trip.':'Share GroupTripper so friends can build their own trip. This link includes none of your group’s details.'}</p></div>
 {code&&paused&&<p className="callout">Invites are paused. Current members can still use this trip.</p>}
 <div className="actions"><button className="primary" disabled={busy||(!!code&&paused)} onClick={()=>void share()}>{code?'Share this trip ↗':'Share GroupTripper ↗'}</button><button disabled={busy||(!!code&&paused)} onClick={()=>void share(true)}>Copy {code?'invite':'create-a-trip'} link</button></div>
 <details><summary>{code?'Invite link & code':'View share link'}</summary><ShareField code={code}/>{code&&<p className="share-code">Trip code: <strong>{code}</strong></p>}</details>
 {onManage&&<div className="actions invite-controls"><button disabled={busy} onClick={()=>onManage(paused?'resume':'pause')}>{paused?'Resume invites':'Pause invites'}</button><button disabled={busy} onClick={()=>{if(confirm('Replace the invite link and code? Previous invites will stop working. Current members keep access.'))onManage('rotate');}}>Replace invite link</button></div>}
 {message&&<p role="status">{message}</p>}</section>;
}
function ShareField({code}:{code?:string}){const [origin,setOrigin]=useState('');useEffect(()=>setOrigin(location.origin),[]);return <label>Share link<input aria-label="Share link" readOnly value={origin?shareLink(origin,code):''} onFocus={e=>e.target.select()}/></label>;}
