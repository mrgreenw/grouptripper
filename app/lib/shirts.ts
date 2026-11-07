export type ShirtInput={idea:string;headline:string;locationLine:string;eventLine:string;slogan:string;extraLines:string;shirtColor:string;nsfw:boolean};
export const legacyShirtLettering={locationLine:'',eventLine:'',extraLines:''};
export const shirtColors=['Washed charcoal','Cream','Forest green','Navy'] as const;
export function shirtInput(value:Record<string,unknown>):ShirtInput{
 const text=(key:string,min:number,max:number,fallback?:string)=>{const v=value[key]===undefined?fallback:value[key];if(typeof v!=='string'||v.trim().length<min||v.trim().length>max||/[\u0000-\u0008\u000b-\u001f\u007f]/.test(v))throw new Error(`Check ${key}: use ${min}–${max} characters.`);return v.trim();};
 if(typeof value.nsfw!=='boolean')throw new Error('Choose whether this design is NSFW.');
 const shirtColor=text('shirtColor',1,30);if(!shirtColors.includes(shirtColor as typeof shirtColors[number]))throw new Error('Choose a listed shirt color.');
 const extraLines=text('extraLines',0,240,'');if(extraLines.split('\n').length>4||extraLines.split('\n').some(line=>line.length>80))throw new Error('Use up to four extra lines, with at most 80 characters each.');
 return {idea:text('idea',10,1800),headline:text('headline',0,60),locationLine:text('locationLine',0,80,legacyShirtLettering.locationLine),eventLine:text('eventLine',0,80,legacyShirtLettering.eventLine),slogan:text('slogan',0,120),extraLines,shirtColor,nsfw:value.nsfw};
}
export const validJobId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
export const assetKinds=['artwork','shirt'] as const;
