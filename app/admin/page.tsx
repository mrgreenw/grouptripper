import OwnerDashboard from './owner-dashboard';
import {chatGPTSignInPath,chatGPTSignOutPath} from '../chatgpt-auth';
export const dynamic='force-dynamic';
export default function AdminPage(){return <OwnerDashboard signInUrl={chatGPTSignInPath('/admin')} signOutUrl={chatGPTSignOutPath('/admin')}/>;}
