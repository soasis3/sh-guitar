import {NamEngine} from 'neural-amp-modeler-wasm/engine';
import {compressorGraph,delayGraph} from './pedal-dsp.js';
import {ampEq} from './amp-eq.js';
export const MAX_BLOCKS=12;
export const TYPES={comp:'Compressor',drive:'Drive',amp:'Amp',cab:'Cabinet',delay:'Delay',reverb:'Reverb'};
export const PARAMS={comp:[['threshold','THRESHOLD',-60,0,1,'dB'],['ratio','RATIO',1,12,.5,':1'],['attack','ATTACK',1,100,1,'ms'],['release','RELEASE',20,1000,10,'ms'],['level','LEVEL',-12,18,1,'dB']],drive:[['input','INPUT',-24,24,1,'dB'],['level','LEVEL',-24,6,1,'dB']],amp:[['input','INPUT',-24,24,1,'dB'],['bass','BASS EQ',-12,12,.5,'dB'],['mid','MID EQ',-12,12,.5,'dB'],['treble','TREBLE EQ',-12,12,.5,'dB'],['presence','PRESENCE EQ',-12,12,.5,'dB'],['level','LEVEL',-24,12,1,'dB']],cab:[['level','LEVEL',-24,6,1,'dB']],delay:[['time','TIME',40,1500,10,'ms'],['feedback','FEEDBACK',0,85,1,'%'],['mix','MIX',0,70,1,'%']],reverb:[['mix','MIX',0,100,1,'%'],['level','LEVEL',-24,6,1,'dB']]};
const defaults={comp:{threshold:-24,ratio:3,attack:10,release:150,level:3},drive:{input:0,level:-6},amp:{input:0,bass:0,mid:0,treble:0,presence:0,level:0},cab:{level:0},delay:{time:320,feedback:28,mix:20},reverb:{mix:20,level:0}};
export function newBlock(type,lane='A'){if(!TYPES[type])throw Error('Unknown effect');return {id:crypto.randomUUID(),type,lane,enabled:['comp','delay'].includes(type)?false:true,params:{...defaults[type]},asset:null};}
export function addBlock(rig,block){if(rig.blocks.length>=MAX_BLOCKS)throw Error('Maximum 12 effects.');rig.blocks.push(block);}
export function moveBlock(rig,id,lane,beforeId=null){
  if(!['pre','A','B','post'].includes(lane))throw Error('Invalid signal path.');
  const block=rig.blocks.find(b=>b.id===id);if(!block||id===beforeId)return;
  const target=beforeId?rig.blocks.find(b=>b.id===beforeId):null;if(beforeId&&(!target||target.lane!==lane))throw Error('Invalid drop position.');
  rig.blocks=rig.blocks.filter(b=>b.id!==id);block.lane=lane;const index=beforeId?rig.blocks.findIndex(b=>b.id===beforeId):rig.blocks.length;rig.blocks.splice(index,0,block);
}
export function orderedLanes(rig){return rig.mode==='parallel'?['pre','A','B','post']:['pre','A','post'];}
export function validateRig(rig){if(!rig || !Array.isArray(rig.blocks) || rig.blocks.length>12)throw Error('Invalid signal chain.');const ids=new Set();for(const b of rig.blocks){if(!TYPES[b.type]||ids.has(b.id)||!['pre','A','B','post'].includes(b.lane))throw Error('Invalid effect block.');b.params={...defaults[b.type],...b.params};ids.add(b.id);}return rig;}
export async function buildRigGraph(ctx,rig,source,destination){
  validateRig(rig);const disposables=[],nodes=[],controls=new Map();let engine;
  const gain=()=>{const n=ctx.createGain();nodes.push(n);return n;};
  const set=(p,v,initial)=>initial?p.setValueAtTime(v,ctx.currentTime):p.setTargetAtTime(v,ctx.currentTime,.02);
  const db=v=>10**(v/20);
  async function lane(name,input){let upstream=input;
    for(const b of rig.blocks.filter(b=>b.lane===name)){
      const out=gain();const state={...b.params,enabled:b.enabled};
      if(b.type==='comp'){controls.set(b.id,compressorGraph(ctx,upstream,out,state));}
      else if(b.type==='delay'){controls.set(b.id,delayGraph(ctx,upstream,out,state));}
      else if(['amp','drive'].includes(b.type)){
        const dry=gain(),wet=gain(),pre=gain(),level=gain();upstream.connect(dry).connect(out);let eq;
        if(b.asset?.text){engine??=await NamEngine.attach(ctx);const nam=await engine.createNode();disposables.push(nam);const info=await nam.loadModel(b.asset.text);if(info.expectedSampleRate>0&&info.expectedSampleRate!==ctx.sampleRate)throw Error(`${TYPES[b.type]} requires ${info.expectedSampleRate} Hz. Match the sample rate in Settings.`);upstream.connect(pre).connect(nam);if(b.type==='amp'){eq=ampEq(ctx,nam);nodes.push(...eq.nodes);eq.tail.connect(level);}else nam.connect(level);level.connect(wet).connect(out);}
        function update(s,initial=false){eq?.update(s,initial);const on=s.enabled&&!!b.asset;set(dry.gain,on?0:1,initial);set(wet.gain,on?1:0,initial);set(pre.gain,db(s.input),initial);set(level.gain,db(s.level),initial);}update(state,true);controls.set(b.id,{update});
      }else{
        const dry=gain(),wet=gain(),conv=ctx.createConvolver();nodes.push(conv);upstream.connect(dry).connect(out);
        if(b.asset?.bytes){conv.buffer=await ctx.decodeAudioData(b.asset.bytes.slice(0));if(conv.buffer.duration>20||![1,2,4].includes(conv.buffer.numberOfChannels))throw Error('IR must have 1, 2, or 4 channels and be no longer than 20 seconds.');upstream.connect(conv).connect(wet).connect(out);}
        function update(s,initial=false){const on=s.enabled&&!!b.asset;const mix=b.type==='cab'?1:s.mix/100;set(dry.gain,on?1-mix:1,initial);set(wet.gain,on?mix*db(s.level):0,initial);}update(state,true);controls.set(b.id,{update});
      }upstream=out;
    }return upstream;
  }
  async function dispose(){for(const n of nodes)n.disconnect();await Promise.allSettled(disposables.map(n=>n.dispose()));}
  try{
    const pre=await lane('pre',source);
    if(rig.mode==='parallel'){
      const a=await lane('A',pre),b=await lane('B',pre),left=gain(),right=gain(),merge=ctx.createChannelMerger(2);nodes.push(merge);
      for(const n of [left,right]){n.channelCount=1;n.channelCountMode='explicit';n.channelInterpretation='speakers';}
      a.connect(left).connect(merge,0,0);b.connect(right).connect(merge,0,1);(await lane('post',merge)).connect(destination);
    }else{(await lane('post',await lane('A',pre))).connect(destination);}
    return {controls,dispose};
  }catch(e){await dispose();throw e;}
}


