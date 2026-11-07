import {ownerAssetGET} from '../../../../../lib/shirt-server';
type Context={params:Promise<{id:string;kind:string}>};
export async function GET(r:Request,c:Context){const {id,kind}=await c.params;return ownerAssetGET(r,id,kind);}
