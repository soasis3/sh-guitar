import {inputConstraints,captureReport,buildMonitorGraph} from './audio-routing.js';
import {iconButton} from './ui-icons.js';
import {FACTORY_PRESETS,createPresetLoader} from './factory-presets.js';
import './rig.css';
import {wireDrag} from './chain-drag.js';
import {createToneLibrary} from './tone-library.js';
import {controlKnob} from './control-knob.js';
import {defaultCache} from './model-cache.js';
import {TYPES,PARAMS,MAX_BLOCKS,newBlock,addBlock,moveBlock,orderedLanes,validateRig,buildRigGraph} from './rig-core.js';
import {createToneClient} from './rig-tone.js';
const $=id=>document.getElementById(id),db=v=>10**(v/20);
let rig,selected,ctx,stream,inputGain,outputGain,graph,split,frame,building=false,details=null;
let saveQueue=Promise.resolve();
let insertion=null;
let monitorMode='effects';
for(const [id,kind,label]of [['settingsOpen','settings','Settings'],['serialMode','serial','Serial routing'],['parallelMode','parallel','Parallel stereo routing']])iconButton($(id),kind,label);
const message=()=>{};
function showError(text){$('errorText').textContent=text;if(!$('errorDialog').open)$('errorDialog').showModal();}
$('errorClose').onclick=()=>$('errorDialog').close();
const laneNames={pre:'PRE',A:'A · LEFT',B:'B · RIGHT',post:'POST'};
function persist(){const snapshot=structuredClone(rig);saveQueue=saveQueue.catch(()=>{}).then(()=>defaultCache(snapshot,'rig-v2'));return saveQueue;}
const client=createToneClient(()=>$('clientId').value.trim());
const loadFactory=createPresetLoader(client);
const library=createToneLibrary({client,onLoad:applyAsset,onAuth:async block=>{await persist();await client.begin(block,'catalog');},onCatalog:async block=>{await persist();await client.begin(block,'select');}});
$('clientId').value=localStorage.getItem('guitar.t3k.clientId')||import.meta.env.VITE_TONE3000_CLIENT_ID||'';
$('clientId').onchange=()=>{if($('clientId').value.trim().startsWith('t3k_cs_')){$('clientId').value='';message('');return;}localStorage.setItem('guitar.t3k.clientId',$('clientId').value.trim());};
$('redirectUri').textContent=client.redirect;
$('disconnect').onclick=()=>{client.disconnect();message('');};
const current=()=>rig.blocks.find(b=>b.id===selected);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function lanes(select,value){const options=rig.blocks.some(b=>b.lane==='B')?['pre','A','B','post']:orderedLanes(rig);select.replaceChildren(...options.map(l=>new Option(l==='B'&&rig.mode==='serial'?'B · Parked':laneNames[l],l)));select.value=value;}
const iconPaths={comp:'<path d="M8 7v18M16 7v18M24 7v18M5 12h6M13 21h6M21 14h6"/>',drive:'<path d="M3 17h5l4-10 8 19 4-10h5"/>',amp:'<rect x="4" y="7" width="24" height="19" rx="3"/><path d="M5 13h22M9 10h.1M13 10h.1M8 18h16M8 22h16"/>',cab:'<rect x="5" y="4" width="22" height="25" rx="3"/><circle cx="16" cy="17" r="7"/><circle cx="16" cy="17" r="2"/>',delay:'<path d="M5 12v8M10 8v16M16 11v10M22 13v6M27 15v2"/>',reverb:'<path d="M3 23c2 0 2-14 5-14s3 16 6 16 3-18 6-18 3 16 6 16h3"/>'};
function chain(){
  $('blockCount').textContent=`${rig.blocks.length} / ${MAX_BLOCKS}`;
  $('serialMode').setAttribute('aria-pressed',String(rig.mode==='serial'));$('parallelMode').setAttribute('aria-pressed',String(rig.mode==='parallel'));$('addOpen').disabled=rig.blocks.length>=MAX_BLOCKS||building;
  const root=$('chain');root.replaceChildren();
  const parallel=rig.mode==='parallel',pre=rig.blocks.filter(b=>b.lane==='pre'),a=rig.blocks.filter(b=>b.lane==='A'),b=rig.blocks.filter(b=>b.lane==='B'),post=rig.blocks.filter(b=>b.lane==='post');
  const branchWidth=Math.max(a.length,parallel?b.length:0,1),columns=pre.length+branchWidth+post.length;
  const step=104,startX=80,y=52,yB=146,width=startX+(columns-1)*step+116,height=parallel?208:118;
  const board=el('div',undefined,'signal-board');board.style.width=width+'px';board.style.height=height+'px';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('aria-hidden','true');svg.classList.add('signal-wires');
  function wire(d,cls=''){const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',d);if(cls)p.setAttribute('class',cls);svg.append(p);}
  wire(`M 12 ${y} H ${width-13}`);
  const splitX=startX+pre.length*step-step/2,mergeX=startX+(pre.length+branchWidth-1)*step+step/2;
  if(parallel){wire(`M ${splitX} ${y} V ${yB} H ${mergeX} V ${y}`,'branch-wire');for(const x of [splitX,mergeX]){const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','3');svg.append(dot);}}
  board.append(svg);
  function endpoint(text,x,yy){const e=el('span',text,'signal-endpoint');e.style.left=x+'px';e.style.top=yy+'px';board.append(e);}endpoint('IN',0,y);endpoint(parallel?'L / R':'OUT',width-29,y);
  function node(block,column,yy){const x=startX+column*step,button=el('button',undefined,'signal-node '+block.type+(selected===block.id?' selected':'')+(!block.enabled?' off':''));button.dataset.block=block.id;button.style.left=(x-27)+'px';button.style.top=(yy-27)+'px';button.setAttribute('aria-pressed',String(selected===block.id));button.setAttribute('aria-label',`${TYPES[block.type]} · ${block.lane} · ${block.enabled?'ON':'OFF'} · ${block.asset?.name||'Built-in effect'}`);button.title=block.asset?.name||TYPES[block.type];
    const icon=document.createElementNS(svg.namespaceURI,'svg');icon.setAttribute('viewBox','0 0 32 32');icon.setAttribute('aria-hidden','true');icon.innerHTML=iconPaths[block.type];button.append(icon,el('span',TYPES[block.type],'node-label'));
    if(block.asset?.tone){button.append(el('span','T3K','node-source'));const url=block.asset.tone.images?.[0];if(url?.startsWith('https://')){const img=el('img');img.src=url;img.alt='';button.append(img);}}
    button.onclick=()=>{if(button.dataset.dragged==='true')return;selected=block.id;details=null;chain();editor();};button.dataset.lane=block.lane;wireDrag(button,block,{getRig:()=>rig,isBusy:()=>building,viewport:$('chain'),onDrop:(block,drop)=>structure(()=>{moveBlock(rig,block.id,drop.lane,drop.beforeId);selected=block.id;details=null;message('');})});board.append(button);
  }
  pre.forEach((n,i)=>node(n,i,y));a.forEach((n,i)=>node(n,pre.length+i,y));if(parallel)b.forEach((n,i)=>node(n,pre.length+i,yB));post.forEach((n,i)=>node(n,pre.length+branchWidth+i,y));
  if(parallel){endpoint('A',splitX+7,y-30);endpoint('B',splitX+7,yB-30);}
  function plusAt(x,yy,lane,beforeId=null){const plus=el('button','＋','chain-insert');plus.dataset.lane=lane;plus.dataset.before=beforeId||'';plus.style.left=(x-15)+'px';plus.style.top=(yy-15)+'px';plus.disabled=rig.blocks.length>=MAX_BLOCKS||building;plus.setAttribute('aria-label',`${laneNames[lane]} ${beforeId?'Before':'At end'} Add effect`);plus.onclick=()=>{insertion={lane,beforeId};lanes($('addLane'),lane);$('addDialog').querySelector('h2').textContent='Add effect';$('addDialog').showModal();};board.append(plus);}
  pre.forEach((n,i)=>plusAt(startX+i*step-step/2,y,'pre',n.id));
  a.forEach((n,i)=>plusAt(startX+(pre.length+i)*step-step/2,y,'A',n.id));
  if(!a.length)plusAt(startX+pre.length*step,y,'A');
  post.forEach((n,i)=>plusAt(startX+(pre.length+branchWidth+i)*step-step/2,y,'post',n.id));
  if(post.length)plusAt(startX+(columns-1)*step+step/2,y,'post');else plusAt(mergeX+step/2,y,'post');
  if(parallel){b.forEach((n,i)=>plusAt(startX+(pre.length+i)*step-step/2,yB,'B',n.id));plusAt(startX+(pre.length+b.length)*step-step/2,yB,'B');}
  root.append(board);
  if(!parallel&&b.length)root.append(el('span',`B: ${b.length} parked blocks`,'parked-note'));
}
function editor(){
  const b=current(),root=$('editor');root.replaceChildren();if(!b){root.append(el('p','Add an effect with +.','note'));return;}
  root.dataset.effect=b.type;
  const top=el('div',undefined,'control-header'),identity=el('div',undefined,'control-identity');identity.append(el('span',String(rig.blocks.indexOf(b)+1).padStart(2,'0'),'control-index'),el('h2',TYPES[b.type]),el('span',['amp','drive'].includes(b.type)?'NAM A2':['cab','reverb'].includes(b.type)?'IR LOADER':'SG EFFECT','control-format'));top.append(identity);
  const toggle=el('label',undefined,'effect-power'),check=el('input');check.type='checkbox';check.checked=b.enabled;check.disabled=building||(!b.asset&&!['comp','delay'].includes(b.type));check.setAttribute('aria-label',TYPES[b.type]+' enabled');const powerIcon=el('i');powerIcon.setAttribute('aria-hidden','true');powerIcon.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 3v9M6.3 5.7a8 8 0 1 0 11.4 0"/></svg>';toggle.title=b.enabled?'Bypass effect':'Enable effect';toggle.append(check,powerIcon);check.onchange=async()=>{b.enabled=check.checked;rig.factoryPreset=null;$('preset').value='custom';toggle.title=b.enabled?'Bypass effect':'Enable effect';graph?.controls.get(b.id)?.update({...b.params,enabled:b.enabled});await persist();chain();if(ctx)await rebuild();};top.append(toggle);root.append(top);
  if(!['comp','delay'].includes(b.type)){
    const model=el('div',undefined,'control-model'),copy=el('div',undefined,'model-copy');
    if(b.asset?.tone?.images?.[0]?.startsWith('https://')){const img=el('img');img.src=b.asset.tone.images[0];img.alt='';model.append(img);}
    copy.append(el('span',b.asset?.tone?.title||b.asset?.name||'Choose a tone from TONE3000.','model-title'),el('span',b.asset?.tone?`${b.asset.name.split(' / ').at(-1)} · @${b.asset.tone.user?.username||'creator'} · TONE3000`:b.asset?'Selected model':['amp','drive'].includes(b.type)?'NAM capture':'Impulse response','model-subtitle'));model.append(copy);
    const actions=el('div',undefined,'model-actions'),browse=el('button','Browse tones','model-library');iconButton(browse,'browse','Browse TONE3000 tones');browse.onclick=()=>library.open(b);browse.disabled=building;
    actions.append(browse);model.append(actions);root.append(model);
  }
  if(details?.blockId===b.id){const box=el('div',undefined,'tone-details');if(details.tone.images?.[0]?.startsWith('https://')){const img=el('img');img.src=details.tone.images[0];img.alt='Tone artwork';box.append(img);}box.append(el('p',`${details.tone.title} · ${details.tone.gear} · ${details.tone.format} · @${details.tone.user?.username||'creator'} · TONE3000`),el('p',details.tone.description||'','note tone-description'));const link=el('a','View on TONE3000 ↗');link.href=`https://www.tone3000.com/tones/${details.tone.id}`;link.target='_blank';link.rel='noopener';box.append(link);const variants=el('select');variants.setAttribute('aria-label','Capture model');variants.replaceChildren(...details.models.map((m,i)=>new Option(m.name,String(i))));const label=el('label','Model');label.append(variants);box.append(label);const load=el('button','Load selected model','primary');load.onclick=async()=>{load.disabled=true;const chosen=details;try{message('');const model=chosen.models[Number(variants.value)],data=await client.download(model,b.type),name=`${chosen.tone.title} / ${model.name}`;await applyAsset(b,['amp','drive'].includes(b.type)?{name,text:data,tone:chosen.tone}:{name,bytes:data,tone:chosen.tone});}catch(e){showError(e.message);load.disabled=false;}};box.append(load);root.append(box);}
  const hints={threshold:'Threshold',ratio:'Ratio',attack:'Attack',release:'Release',level:'Output level',input:'Input level',time:'Delay time',feedback:'Feedback',mix:'Wet mix',bass:'Bass',mid:'Mid',treble:'Treble',presence:'Presence'};
  const params=el('div',undefined,'knob-row');
  for(const [p,name,min,max,step,unit]of PARAMS[b.type])params.append(controlKnob({label:name,value:b.params[p],min,max,step,unit,hint:hints[p],ariaLabel:TYPES[b.type]+' '+name,onChange:value=>{b.params[p]=value;rig.factoryPreset=null;$('preset').value='custom';graph?.controls.get(b.id)?.update({...b.params,enabled:b.enabled});persist();}}));
  root.append(params);
  const footer=el('div',undefined,'control-footer'),tools=el('div',undefined,'editor-tools'),route=el('select');route.setAttribute('aria-label','Signal path');lanes(route,b.lane);route.onchange=()=>structure(()=>{b.lane=route.value;});const routeLabel=el('label',undefined,'lane-select');routeLabel.append(route);tools.append(routeLabel);
  for(const [text,action]of [['←',()=>move(-1)],['→',()=>move(1)],['Duplicate',()=>{const clone=structuredClone(b);clone.id=crypto.randomUUID();addBlock(rig,clone);selected=clone.id;}],['Delete',()=>{rig.blocks=rig.blocks.filter(x=>x.id!==b.id);selected=rig.blocks[0]?.id;}]]){const button=el('button');iconButton(button,text==='←'?'earlier':text==='→'?'later':text==='Duplicate'?'duplicate':'delete',text==='←'?'Move earlier':text==='→'?'Move later':text);button.disabled=building||(text==='Duplicate'&&rig.blocks.length>=MAX_BLOCKS);button.onclick=()=>structure(action);tools.append(button);}
  footer.append(tools);root.append(footer);
}
function move(direction){const b=current(),same=rig.blocks.filter(x=>x.lane===b.lane),index=same.indexOf(b),next=same[index+direction];if(!next)return;const i=rig.blocks.indexOf(b),j=rig.blocks.indexOf(next);[rig.blocks[i],rig.blocks[j]]=[rig.blocks[j],rig.blocks[i]];}
async function structure(action){if(building)return;try{action();rig.factoryPreset=null;$('preset').value='custom';await persist();chain();editor();if(ctx)await rebuild();}catch(e){showError(e.message);}}
async function applyAsset(b,asset){
  if(building)throw Error('Wait until audio is ready.');
  if(asset.text){const data=JSON.parse(asset.text);if(!data.architecture||!data.weights)throw Error('Invalid NAM model.');}
  else{const offline=new OfflineAudioContext(2,128,48000),decoded=await offline.decodeAudioData(asset.bytes.slice(0));if(decoded.duration>20||![1,2,4].includes(decoded.numberOfChannels))throw Error('IR must be mono, stereo, or 4-channel and no longer than 20 seconds.');}
  rig.factoryPreset=null;$('preset').value='custom';b.asset=asset;b.enabled=b.type!=='cab';details=null;await persist();chain();editor();if(ctx)await rebuild();message('');
}
async function rebuild(){if(!ctx||building)return;building=true;const context=ctx;outputGain.gain.setValueAtTime(0,context.currentTime);inputGain.disconnect();try{if(graph)await graph.dispose();graph=null;graph=await buildMonitorGraph(context,rig,inputGain,outputGain,monitorMode,buildRigGraph);outputGain.gain.setTargetAtTime(db(rig.audio.output),context.currentTime,.03);message('');}catch(e){showError(e.message);await stopAudio();}finally{building=false;chain();editor();}}
async function stopAudio(){cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;if(graph)await graph.dispose();graph=null;const old=ctx;ctx=null;inputGain=null;outputGain=null;if(old&&old.state!=='closed')await old.close();$('audioEnabled').checked=false;$('level').style.width='0%';$('inputLevel').style.width='0%';$('inputPeak').textContent='−∞ dBFS';$('captureInfo').textContent='';for(const id of ['device','channel','sampleRate','latency'])$(id).disabled=false;$('audioInfo').textContent='128 samples · Device buffer managed by browser';}
async function startAudio(){
  if(building)return;building=true;$('audioEnabled').disabled=true;
  try{if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('Audio input requires HTTPS or localhost.');ctx=new AudioContext({sampleRate:Number(rig.audio.rate),latencyHint:rig.audio.latency});await ctx.resume();
    inputGain=ctx.createGain();outputGain=ctx.createGain();inputGain.gain.value=db(rig.audio.input);outputGain.gain.value=0;
    graph=await buildMonitorGraph(ctx,rig,inputGain,outputGain,monitorMode,buildRigGraph);
    stream=await navigator.mediaDevices.getUserMedia({audio:inputConstraints(rig.audio,ctx.sampleRate,navigator.mediaDevices.getSupportedConstraints()),video:false});
    const track=stream.getAudioTracks()[0],actual=track.getSettings();
    if(actual.channelCount&&Number(rig.audio.channel)>=actual.channelCount)throw Error('Selected input channel is unavailable. Choose Input 1.');
    $('captureInfo').textContent=captureReport(track,ctx);
    const source=ctx.createMediaStreamSource(stream);split=ctx.createChannelSplitter(2);source.connect(split);split.connect(inputGain,Number(rig.audio.channel));
    const inputMeter=ctx.createAnalyser();inputMeter.fftSize=256;split.connect(inputMeter,Number(rig.audio.channel));
    const analyser=ctx.createAnalyser();analyser.fftSize=256;outputGain.connect(analyser).connect(ctx.destination);outputGain.gain.setTargetAtTime(db(rig.audio.output),ctx.currentTime,.03);
    $('audioEnabled').checked=true;for(const id of ['device','channel','sampleRate','latency'])$(id).disabled=true;
    $('audioInfo').textContent=`${ctx.sampleRate.toLocaleString()} Hz · 128-frame render blocks · ${monitorMode==='dry'?'Dry monitor':'Effects'}`;
    const data=new Float32Array(256),inputData=new Float32Array(256);const meter=()=>{inputMeter.getFloatTimeDomainData(inputData);const inputPeak=Math.max(...inputData.map(Math.abs));$('inputLevel').style.width=Math.min(100,inputPeak*100)+'%';$('inputLevel').style.background=inputPeak>=.98?'#ee887d':'';$('inputPeak').textContent=inputPeak>0?`${(20*Math.log10(inputPeak)).toFixed(1)} dBFS${inputPeak>=.98?' · CLIP':''}`:'−∞ dBFS';analyser.getFloatTimeDomainData(data);const peak=Math.max(...data.map(Math.abs));$('level').style.width=Math.min(100,peak*100)+'%';frame=requestAnimationFrame(meter);};meter();stream.getAudioTracks()[0].onended=()=>{stopAudio();message('');};await devices();message('');
  }catch(e){await stopAudio();showError(e.message);}finally{building=false;$('audioEnabled').disabled=false;}
}
async function devices(){if(!navigator.mediaDevices)return;const list=await navigator.mediaDevices.enumerateDevices();$('device').replaceChildren(new Option('Default input',''),...list.filter(x=>x.kind==='audioinput').map((x,i)=>new Option(x.label||`Input ${i+1}`,x.deviceId)));$('device').value=rig.audio.device;}
function audioUI(){for(const [id,key]of [['input','input'],['output','output'],['device','device'],['channel','channel'],['sampleRate','rate'],['latency','latency']])$(id).value=rig.audio[key];for(const id of ['input','output'])$(id+'Value').textContent=rig.audio[id]+' dB';}
$('monitorMode').onchange=async()=>{if(building){$('monitorMode').value=monitorMode;return;}monitorMode=$('monitorMode').value;if(ctx)await rebuild();};
$('settingsOpen').onclick=()=>{$('settings').showModal();};$('settingsClose').onclick=()=>$('settings').close();$('audioEnabled').onchange=()=>{if(building)return;if($('audioEnabled').checked)startAudio();else stopAudio();};
for(const [id,key]of [['device','device'],['channel','channel'],['sampleRate','rate'],['latency','latency']])$(id).onchange=()=>{rig.audio[key]=$(id).value;persist();};
for(const id of ['input','output'])$(id).oninput=()=>{rig.audio[id]=Number($(id).value);$(id+'Value').textContent=rig.audio[id]+' dB';(id==='input'?inputGain:outputGain)?.gain.setTargetAtTime(db(rig.audio[id]),ctx?.currentTime||0,.02);$('preset').value='custom';rig.factoryPreset=null;persist();};
$('addOpen').onclick=()=>{insertion=null;lanes($('addLane'),current()?.lane||'A');$('addDialog').showModal();};$('addClose').onclick=()=>$('addDialog').close();for(const [type,name]of Object.entries(TYPES)){const button=el('button',name);button.onclick=()=>structure(()=>{const b=newBlock(type,$('addLane').value);if(!['comp','delay'].includes(type))b.enabled=false;addBlock(rig,b);if(insertion?.lane===b.lane&&insertion.beforeId)moveBlock(rig,b.id,b.lane,insertion.beforeId);insertion=null;selected=b.id;$('addDialog').close();});$('addTypes').append(button);}
$('serialMode').onclick=()=>structure(()=>{rig.mode='serial';message('');});
$('parallelMode').onclick=()=>structure(()=>{
  if(rig.mode==='parallel')return;
  if(!rig.blocks.some(b=>b.lane==='B')){const amps=rig.blocks.filter(b=>b.lane==='A'&&['amp','cab'].includes(b.type));if(rig.blocks.length+amps.length>MAX_BLOCKS)throw Error('Remove blocks to make room for parallel amps.');for(const b of amps){const clone=structuredClone(b);clone.id=crypto.randomUUID();clone.lane='B';addBlock(rig,clone);}}
  rig.mode='parallel';
});
$('savePreset').onclick=async()=>{await defaultCache(structuredClone(rig),'preset-v2');message('');};
$('recallPreset').onclick=async()=>{if(building)return;try{const saved=await defaultCache(undefined,'preset-v2');if(!saved)throw Error('No saved preset.');const audio=rig.audio;rig=validateRig(saved);rig.audio={...audio,input:saved.audio.input,output:saved.audio.output};selected=rig.blocks[0]?.id;$('preset').value=rig.factoryPreset||'custom';await persist();audioUI();chain();editor();if(inputGain)inputGain.gain.setTargetAtTime(db(rig.audio.input),ctx.currentTime,.02);if(ctx)await rebuild();message('');}catch(e){showError(e.message);}};
$('preset').replaceChildren(new Option('Custom','custom'),...FACTORY_PRESETS.map(p=>new Option(p.name,p.id)));
async function applyFactory(id){
 const recipe=FACTORY_PRESETS.find(p=>p.id===id);if(!recipe||building)return;
 const old=rig.factoryPreset||'custom';
 if(!client.connected()){sessionStorage.setItem('guitar.pendingPreset',id);await persist();await client.begin({id:recipe.id,type:'amp'},'catalog');return;}
 building=true;$('preset').disabled=true;$('audioEnabled').disabled=true;chain();editor();
 try{const next=await loadFactory(recipe,rig.audio,message);await defaultCache(structuredClone(rig),'before-factory-v1');rig=next;selected=rig.blocks.find(b=>b.type==='amp')?.id;details=null;await persist();audioUI();if(inputGain)inputGain.gain.setTargetAtTime(db(rig.audio.input),ctx.currentTime,.02);building=false;if(ctx)await rebuild();$('preset').value=recipe.id;}
 catch(e){$('preset').value=old;showError('Could not load preset: '+e.message);}
 finally{building=false;$('preset').disabled=false;$('audioEnabled').disabled=false;chain();editor();}
}
$('preset').onchange=()=>applyFactory($('preset').value);
$('restoreChain').onclick=async()=>{if(building)return;try{const saved=await defaultCache(undefined,'before-factory-v1');if(!saved)throw Error('No previous chain.');const audio=rig.audio;rig=validateRig(saved);rig.audio={...audio,input:saved.audio.input,output:saved.audio.output};selected=rig.blocks[0]?.id;await persist();audioUI();$('preset').value=rig.factoryPreset||'custom';if(inputGain)inputGain.gain.setTargetAtTime(db(rig.audio.input),ctx.currentTime,.02);if(ctx)await rebuild();chain();editor();message('');}catch(e){showError(e.message);}};
$('toneCancel').onclick=()=>$('toneIntro').close();$('toneContinue').onclick=async()=>{try{await persist();await client.begin(current());}catch(e){$('toneIntro').close();$('settings').showModal();showError(e.message);}};
window.addEventListener('pagehide',()=>{stream?.getTracks().forEach(t=>t.stop());ctx?.close();});
async function init(){
  try{rig=await defaultCache(undefined,'rig-v2');if(rig)validateRig(rig);else{
    rig={mode:'serial',blocks:[],audio:{input:0,output:-18,rate:'48000',latency:'interactive',device:'',channel:'0'}};
    for(const [type,lane,key]of [['comp','pre',null],['drive','pre','drive'],['amp','A','default'],['cab','A','cab'],['delay','post',null],['reverb','post','reverb']]){const b=newBlock(type,lane);if(key){b.asset=await defaultCache(undefined,key).catch(()=>null);b.enabled=!!b.asset&&type!=='cab';}addBlock(rig,b);}
    try{const last=JSON.parse(localStorage.getItem('guitar.levels'));if(last){rig.audio.input=Number(last.input)||0;rig.audio.output=Number.isFinite(Number(last.output))?Number(last.output):-18;}}catch{}
    await persist();
  }selected=rig.blocks.find(b=>b.type==='amp')?.id||rig.blocks[0]?.id;audioUI();chain();editor();await devices();
    $('preset').value=rig.factoryPreset||'custom';
    const cb=await client.callback();const pendingPreset=sessionStorage.getItem('guitar.pendingPreset');if(pendingPreset&&client.connected()){sessionStorage.removeItem('guitar.pendingPreset');await applyFactory(pendingPreset);return;}if(cb){const b=rig.blocks.find(b=>b.id===cb.blockId);if(!b)throw Error('The selected block no longer exists.');selected=b.id;if(cb.catalog){chain();editor();library.open(b);}else{details={blockId:b.id,...await client.tone(cb.toneId,b.type)};chain();editor();message('');}}
  }catch(e){showError(e.message);}
}
init();






