import type {ShirtTheme} from './lib/shirt-starters';
export default function ShirtSample({theme:t}:{theme:ShirtTheme}){
 return <svg viewBox="0 0 440 490" role="img" aria-label={`${t.label} illustrated sample shirt: ${t.heading}`} className="shirt-sample" style={{background:t.paper}}>
 <ellipse cx="220" cy="450" rx="137" ry="15" fill="#152a23" opacity=".09"/>
 <path d="M131 54 172 37 Q220 64 268 37L309 54 393 133 336 189 309 164V427Q220 450 131 427V164L104 189 47 133Z" fill={t.fabric} stroke="#182c2a" strokeOpacity=".2" strokeWidth="2"/>
 <path d="M172 37Q220 114 268 37Q220 64 172 37Z" fill="#101e20" opacity=".18"/>
 <path d="M177 44Q220 106 263 44M135 417Q220 438 305 417M54 132 104 179M386 132 336 179" fill="none" stroke={t.ink} strokeOpacity=".16" strokeWidth="2"/>
 <g fill={t.ink} stroke={t.ink}><path d="M156 186Q220 158 284 186M155 322Q220 347 285 322" fill="none" strokeWidth="1.5"/><circle cx="153" cy="191" r="2"/><circle cx="287" cy="191" r="2"/>
 <text x="220" y="160" textAnchor="middle" stroke="none" fontFamily="Georgia,serif" fontSize={t.heading.length>17?13:15} fontWeight="700" letterSpacing="1.5">{t.heading}</text>
 <g transform="translate(220 250)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Artwork id={t.id} accent={t.accent}/></g>
 <text x="220" y="365" textAnchor="middle" stroke="none" fontFamily="Arial,sans-serif" fontSize="7.5" fontWeight="700" letterSpacing="1">{t.tagline}</text>
 <path d="m215 382 5-4 5 4-5 4Z" stroke="none" fill={t.accent}/></g>
 </svg>;
}
function Star({x,y,size=5}:{x:number;y:number;size?:number}){return <path d={`M${x} ${y-size}Q${x} ${y} ${x+size} ${y}Q${x} ${y} ${x} ${y+size}Q${x} ${y} ${x-size} ${y}Q${x} ${y} ${x} ${y-size}Z`} stroke="none"/>;}
function Artwork({id,accent}:{id:string;accent:string}){
 switch(id){
 case 'family-reunion':return <><circle cx="0" cy="-13" r="51" fill="none" opacity=".4"/><g fill={accent} stroke="none">{[[-25,-21],[-11,-38],[13,-38],[29,-19],[0,-12]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="20"/>)}</g><path d="M0 43V-15M0 7-22-13M0-2 20-25M0 29-15 45M0 32 17 46M-36 49Q0 39 37 49" fill="none" strokeWidth="4"/><Star x={-49} y={32}/><Star x={48} y={31}/></>;
 case 'golf-trip':return <><path d="M-51-37 0-53 51-37V7Q48 40 0 59Q-48 40-51 7Z" fill="none"/><path d="M-29 32 24-30M29 32-24-30" fill="none" strokeWidth="3"/><path d="m24-30 7-8 13 4-2 10-16 1M-24-30l-7-8-13 4 2 10 16 1Z" fill={accent} stroke="none"/><circle cy="5" r="14"/><g fill={accent} stroke="none">{[[-5,0],[4,-3],[7,7],[-3,10]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.8"/>)}</g><path d="M0-32V-12M0-31l17 6-17 6ZM-23 41Q0 33 23 41" fill="none"/><Star x={-66} y={-6}/><Star x={66} y={-6}/></>;
 case 'girls-weekend':return <><circle cy="-5" r="47" fill="none"/><circle cy="-10" r="22" fill={accent} stroke="none"/>{[-46,-27,0,27,46].map((x,i)=><path key={i} d={`M${x} -45l${x/7} -9`} fill="none"/>)}{[14,25,36].map(y=><path key={y} d={`M-39 ${y}q13-9 26 0t26 0t26 0`} fill="none"/>)}<Star x={-61} y={12} size={8}/><Star x={60} y={-22} size={6}/></>;
 case 'boys-weekend':return <><circle cx="19" cy="-24" r="24" fill={accent} stroke="none"/><path d="M-60 28-23-30 4 4 22-15 59 29ZM-36-10-23-30-9-12M6 3 22-15 35 6" fill="none"/><path d="M-56 47h112M-34 41l9-16 9 16h-5l7 10h-22l7-10ZM34 35l8-15 8 15h-4l6 12H32l6-12Z"/><path d="M-3 57Q21 40 0 32" fill="none"/><Star x={-53} y={-37}/></>;
 case 'bachelor-party':return <><g transform="rotate(-15)"><rect x="-42" y="-42" width="54" height="78" rx="5" fill="none"/><text x="-32" y="-24" fontSize="14" stroke="none" fontFamily="Georgia">A</text></g><g transform="rotate(13)"><rect x="-6" y="-35" width="54" height="78" rx="5" fill={accent} stroke="none"/><path d="M20 13C-1-1 12-15 20-5C29-15 42-1 20 13Z" stroke="none"/><text x="1" y="-15" stroke="none" fontSize="14" fontFamily="Georgia">A</text></g><Star x={-59} y={17} size={7}/><Star x={48} y={-53} size={9}/><path d="M-27 57h54" fill="none"/></>;
 case 'bachelorette-party':return <><path d="M0-61v14" fill="none"/><circle r="42" fill={accent} stroke="none"/><circle r="42" fill="none"/><ellipse rx="15" ry="42" fill="none"/><ellipse rx="31" ry="42" fill="none"/><path d="M-36-21h72M-42 0h84M-36 21h72M0-42v84" fill="none"/><Star x={-59} y={-39} size={10}/><Star x={60} y={19} size={12}/><Star x={-48} y={44} size={6}/><path d="M-26 58q26-8 52 0" fill="none"/></>;
 case 'birthday-weekend':return <><path d="M-36-1q36-14 72 0v38q-36 12-72 0Z" fill="none"/><path d="M-35 3q9 17 18 0q9 17 18 0q9 17 18 0q9 17 17 0" fill={accent} stroke="none"/><path d="M-45 44h90M-21-8v-19M0-12v-19M21-8v-19" fill="none" strokeWidth="4"/>{[-21,0,21].map(x=><path key={x} d={`M${x} -46q-11 13 0 13q11 0 0-13Z`} fill={accent} stroke="none"/>)}<Star x={-58} y={-21} size={7}/><Star x={55} y={-17} size={10}/><path d="M-53 17l-5 5M50 34l7 4M-39-45l-4-5M39-43l4-5" fill="none"/></>;
 default:return <><circle r="44" fill="none"/><circle r="50" fill="none" strokeDasharray="2 5"/><path d="M0-38 10-10 38 0 10 10 0 38-10 10-38 0-10-10Z" fill={accent} stroke="none"/><path d="M0-38V38M-38 0H38" fill="none"/><circle r="6"/><text y="-59" textAnchor="middle" fontSize="10" stroke="none" fontFamily="Arial">N</text><Star x={-63} y={25}/><Star x={64} y={-25}/></>;
 }
}
