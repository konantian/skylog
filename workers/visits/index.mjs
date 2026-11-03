import {DurableObject} from 'cloudflare:workers';

export class VisitCounter extends DurableObject {
  async read(){
    return (await this.ctx.storage.get('count'))??0;
  }
  async increment(){
    // Durable Object input/output gates keep this read-modify-write atomic.
    const count=(await this.read())+1;
    await this.ctx.storage.put('count',count);
    return count;
  }
}

export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin');
    const headers={'Cache-Control':'no-store','Vary':'Origin'};
    if(request.method==='GET')headers['Access-Control-Allow-Origin']='*';
    if(origin===env.ALLOWED_ORIGIN){
      headers['Access-Control-Allow-Origin']=origin;
      headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
    }
    const reply=(body,status=200)=>Response.json(body,{status,headers});
    if(new URL(request.url).pathname!=='/visits')return reply({error:'Not found'},404);
    if(request.method==='OPTIONS')return new Response(null,{status:origin===env.ALLOWED_ORIGIN?204:403,headers});
    if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed'},405);
    if(request.method==='POST'&&origin!==env.ALLOWED_ORIGIN)return reply({error:'Origin required'},403);
    try{
      const counter=env.VISITS.getByName('skylog');
      const count=request.method==='POST'?await counter.increment():await counter.read();
      return reply({count});
    }catch{
      return reply({error:'Counter temporarily unavailable'},503);
    }
  },
};
