'use client';
import {useId,useState} from 'react';
export default function PasswordField({creating=false,name='password',label='Password'}:{creating?:boolean;name?:string;label?:string}){
 const id=useId(),[visible,setVisible]=useState(false);
 return <div className="password-field"><label htmlFor={id}>{label}</label><div className="password-input"><input id={id} name={name} required type={visible?'text':'password'} minLength={creating?8:1} maxLength={256} autoComplete={creating?'new-password':'current-password'} autoCapitalize="none" autoCorrect="off" spellCheck={false}/><button type="button" aria-label={`${visible?'Hide':'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?'Hide':'Show'}</button></div>{creating&&<small>At least 8 characters. No special symbols required.</small>}</div>;
}
