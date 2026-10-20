const BASE='https://www.tone3000.com/api/v1',prefix='guitar.t3k.';
const get=k=>sessionStorage.getItem(prefix+k),set=(k,v)=>sessionStorage.setItem(prefix+k,v);
export function createToneClient(clientId){
  const redirect=location.origin+location.pathname;
  async function token(body){const r=await fetch(BASE+'/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...body,client_id:clientId()})});const data=await r.json();if(!r.ok||!data.access_token)throw Error(data.error_description||data.error||'Sign-in failed');set('access',data.access_token);set('refresh',data.refresh_token);set('expires',Date.now()+data.expires_in*1000);}
  async function api(path,format='json'){
    if(!get('access'))throw Error('Sign in to TONE3000 again.');
    if(Date.now()+30000>=Number(get('expires')))try{await token({grant_type:'refresh_token',refresh_token:get('refresh')});}catch{for(const n of ['access','refresh','expires'])sessionStorage.removeItem(prefix+n);throw Error('Sign in to TONE3000 again.');}
    const url=new URL(path.startsWith('https:')?path:BASE+path);if(url.origin!=='https://www.tone3000.com'||!url.pathname.startsWith('/api/v1/'))throw Error('Unsupported API URL');
    const r=await fetch(url,{headers:{Authorization:`Bearer ${get('access')}`}});if(!r.ok)throw Error(`TONE3000 request failed (${r.status})`);return format==='text'?r.text():format==='bytes'?r.arrayBuffer():r.json();
  }
  return {redirect,disconnect(){for(const n of ['access','refresh','expires'])sessionStorage.removeItem(prefix+n);},
    async begin(block,flow='select'){const id=clientId();if(!id||id.startsWith('t3k_cs_'))throw Error('Enter a Publishable Key in settings.');const verifier=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));const challenge=btoa(String.fromCharCode(...new Uint8Array(hash))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');const state=crypto.randomUUID();set('state',state);set('verifier',verifier);set('started',Date.now());set('block',block.id);set('flow',flow);
      const nam=['amp','drive'].includes(block.type),filters=nam?{format:'nam',architecture:'2',gears:block.type==='amp'?'amp_amp-cab':'pedal'}:{format:'ir',gears:block.type==='cab'?'cab':'space'};
      location.assign(BASE+'/oauth/authorize?'+new URLSearchParams({client_id:id,redirect_uri:redirect,response_type:'code',code_challenge:challenge,code_challenge_method:'S256',state,menubar:'true',...(flow==='catalog'?{}:{prompt:'select_tone',preview:'true',...filters})}));
    },
    async callback(){const p=new URLSearchParams(location.search);if(!['code','state','error','canceled'].some(k=>p.has(k)))return null;try{if(!get('state')||get('state')!==p.get('state')||Date.now()-Number(get('started'))>1800000)throw Error('Authentication state mismatch.');const verifier=get('verifier'),id=get('block'),flow=get('flow');for(const n of ['state','verifier','started','block','flow'])sessionStorage.removeItem(prefix+n);if(p.has('error'))throw Error('TONE3000 authentication canceled.');if(p.get('code'))await token({grant_type:'authorization_code',code:p.get('code'),code_verifier:verifier,redirect_uri:redirect});if(p.get('canceled')==='true')return null;if(flow==='catalog')return {blockId:id,catalog:true};const toneId=p.get('tone_id');if(!/^[0-9]+$/.test(toneId))throw Error('Missing tone ID.');return {blockId:id,toneId};}finally{history.replaceState(null,'',location.pathname);}},
    async tone(id,type){const nam=['amp','drive'].includes(type),q=nam?'&architecture=2':'';const [tone,first]=await Promise.all([api(`/tones/${id}${nam?'?architecture=2':''}`),api(`/models?tone_id=${id}&page=1&page_size=300${q}`)]);if(tone.format!==(nam?'nam':'ir'))throw Error('Choose a compatible tone format.');const models=[...first.data];for(let page=2;page<=first.total_pages;page++){const r=await api(`/models?tone_id=${id}&page=${page}&page_size=300${q}`);models.push(...r.data);}if(!models.length)throw Error('No compatible models available.');return {tone,models};},
    connected(){return !!get('access');},
    user(){return api('/user');},
    async list(type,{tab='trending',query='',page=1}={}){
      const nam=['amp','drive'].includes(type),gears=type==='amp'?['amp','amp-cab']:type==='drive'?['pedal']:type==='cab'?['cab']:['space'];
      if(tab==='search'){const params=new URLSearchParams({query,page:String(page),page_size:'25',gears:gears.join('_'),format:nam?'nam':'ir',...(nam?{architecture:'2'}:{})});return api('/tones/search?'+params);}
      if(tab==='trending'){const groups=await Promise.all(gears.map(gear=>api('/tones/trending?gear='+encodeURIComponent(gear))));return {data:groups.flatMap(x=>x.data),total_pages:1};}
      if(!['favorited','downloaded','created'].includes(tab))throw Error('Unknown library list');
      const params=new URLSearchParams({page:String(page),page_size:'25',query,...(gears.length===1?{gear:gears[0]}:{})});return api(`/tones/${tab}?${params}`);
    },
    download(model,type){return api(model.model_url,['amp','drive'].includes(type)?'text':'bytes');}
  };
}



