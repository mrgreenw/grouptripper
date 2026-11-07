import type {ShirtTheme} from './lib/shirt-starters';
export default function ShirtSample({theme}:{theme:ShirtTheme}){
 return <img key={theme.id} src={`/shirt-samples/${theme.id}-v2.webp`} width={1122} height={1402} alt={`${theme.label} AI-generated shirt concept: ${theme.heading}. ${theme.tagline}.`} className="shirt-sample" decoding="async"/>;
}
