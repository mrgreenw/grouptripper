import {assetGET,assetPUT} from '../../../../lib/shirt-server';
type Context={params:Promise<{id:string;kind:string}>};
export async function GET(r:Request,c:Context){const {id,kind}=await c.params;return assetGET(r,id,kind);}
export async function PUT(r:Request,c:Context){const {id,kind}=await c.params;return assetPUT(r,id,kind);}
