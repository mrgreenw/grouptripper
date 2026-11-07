'use client';
import {useState} from 'react';
import {shirtThemes,shirtThemeFor,starterInput,blankShirtInput} from './lib/shirt-starters';
import type {ShirtInput} from './lib/shirts';
import ShirtSample from './shirt-sample';
export default function ShirtStarters({tripKind='Golf trip',tripName='Your trip name',busy=false,onUse}:{tripKind?:string;tripName?:string;busy?:boolean;onUse?:(input:ShirtInput)=>boolean}){
 const [themeId,setThemeId]=useState(()=>shirtThemeFor(tripKind).id),[notice,setNotice]=useState('');
 const theme=shirtThemes.find(t=>t.id===themeId)!;
 async function useIdea(index:number){const input=starterInput(theme,tripName,index);if(onUse){if(onUse(input))setNotice('Idea loaded below. Edit it, then choose “Create my shirt” when ready.');return;}
 try{await navigator.clipboard.writeText(`${input.idea}\n\nSuggested slogan: ${input.slogan}\nShirt color: ${input.shirtColor}`);setNotice('Prompt copied. You can personalize it in your trip’s Shirt Studio.');}catch{setNotice('Select and copy the example prompt text below.');}}
 return <section className="shirt-starters card" aria-label="Shirt design starters"><div className="section-heading"><div><span className="eyebrow">A LITTLE INSPIRATION</span><h2>Start with a good idea.</h2><p>Pick a theme, borrow a prompt, and make it yours.</p></div><span className="pill">Free to explore · no designs used</span></div>
 <label className="shirt-theme-select">Example theme<select value={themeId} onChange={e=>{setThemeId(e.target.value);setNotice('');}}>{shirtThemes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
 <div className="shirt-starter-layout"><figure><ShirtSample theme={theme}/><figcaption>Illustrated sample · {theme.color.toLowerCase()}<br/>Your generated artwork will vary.</figcaption></figure><div className="shirt-idea-list"><span className="eyebrow">{theme.label.toUpperCase()} · TWO WAYS TO GO</span>{theme.ideas.map((idea,index)=><article className="shirt-idea" key={theme.id+index}><span className="shirt-idea-number">0{index+1}</span><h3>{idea.title}</h3><p>{idea.idea}</p><p className="shirt-slogan">“{idea.slogan}”</p><button disabled={busy} type="button" onClick={()=>void useIdea(index)}>{onUse?'Use this idea →':'Copy this prompt'}</button></article>)}{onUse?<button className="text-button" disabled={busy} type="button" onClick={()=>{if(onUse(blankShirtInput(tripName)))setNotice('Blank starting point ready. Describe your own idea below.');}}>Start from a blank idea</button>:<a className="primary" href="/#create">Create a trip & make it yours →</a>}</div></div>
 {notice&&<p className="success starter-notice" role="status">{notice}</p>}{onUse&&<p className="muted starter-footnote">Choosing an idea only fills in your draft. Your allowance is used when you submit a new design.</p>}</section>;
}
