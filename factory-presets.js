import {newBlock,validateRig} from './rig-core.js';
import {defaultCache} from './model-cache.js';
const reddit='https://www.reddit.com/r/NAM_NeuralAmpModeler/comments/';
const sources={clean:{title:'A2 클린 캡처 추천',url:reddit+'1vrr9nw/whats_your_favorite_a2_clean_captures/'},favorites:{title:'커뮤니티가 즐겨 쓰는 캡처',url:reddit+'1wowx0c/lets_all_post_our_favourite_captures/'},pedals:{title:'페달·캐비넷 조합 토론',url:reddit+'1licn7f/what_are_your_goto_pedals_cabs_and_irs/'}};
const b=(type,toneId,modelId,params={},lane=type==='drive'||type==='comp'?'pre':type==='reverb'||type==='delay'?'post':'A')=>({type,toneId,modelId,params,lane});
const room=mix=>b('reverb',99227,827079,{mix,level:-3});
const echo=(time,feedback,mix)=>b('delay',null,null,{time,feedback,mix});
const comp=()=>b('comp',null,null,{threshold:-25,ratio:2.5,attack:20,release:180,level:2});
const superAmp=(params={},lane='A')=>b('amp',88775,748130,params,lane);
const mayerSources=[{title:'John Mayer 팬 커뮤니티 · 페달 순서 토론',url:'https://www.tapatalk.com/groups/johnmayer/pedalboard-signal-chain-t14572.html'},{title:'John Mayer 2019 보드 · TS10와 Klon',url:'https://www.musicradar.com/news/john-mayers-2019-pedalboard-has-been-revealed'}];
const mayerComp=(level=1)=>b('comp',null,null,{threshold:-26,ratio:2,attack:25,release:180,level});
const twoRock=(params={})=>b('amp',99695,831759,params);
export const FACTORY_PRESETS=[
 {id:'deluxe-glass',name:'01 · Deluxe Glass',description:'입력을 낮춘 Deluxe와 짧은 룸. 맑은 아르페지오의 출발점.',basis:'Deluxe Reverb A2와 낮은 입력 레벨을 추천한 댓글을 참고했습니다.',sources:[sources.clean],blocks:[comp(),b('amp',65227,385845,{input:-12,bass:-1,treble:1}),room(10)]},
 {id:'hiwatt-touch',name:'02 · Hiwatt Touch',description:'컴프레서와 Hiwatt에 짧은 슬랩 에코를 더한 클린 지향 세팅.',basis:'Strat + 컴프레서 + EQ + Hiwatt 추천에서 출발했습니다. 원문의 코러스 대신 SG 딜레이를 사용합니다.',sources:[sources.clean],blocks:[comp(),b('amp',75462,662815,{input:-8,bass:-1,mid:1,treble:1}),echo(100,12,10),room(9)]},
 {id:'super-edge',name:'03 · Super Edge',description:'Super Reverb의 피킹 반응을 살리는 가벼운 브레이크업과 룸.',basis:'Amalgam 캡처 추천을 바탕으로 Super Reverb 무료 A2를 선정했습니다.',sources:[sources.favorites],blocks:[superAmp({input:-3,mid:1}),room(12)]},
 {id:'green-blues',name:'04 · Green Blues',description:'TS9의 낮은 드라이브 → Super Reverb. 블루스 리드용 짧은 에코.',basis:'NAM 앞 Tube Screamer 사용 의견과 Amalgam 추천을 조합한 SG 세팅입니다.',sources:[sources.pedals,sources.favorites],blocks:[b('drive',86314,733130,{level:-6}),superAmp({bass:-1,mid:1.5,treble:-.5}),echo(280,20,12),room(10)]},
 {id:'plexi-crunch',name:'05 · Plexi Crunch',description:'1969 JMP-50 + 원래 캡처의 G12H 캐비넷. 드라이한 클래식 록.',basis:'커뮤니티에서 직접 추천한 Amalgam JMP-50 65578 캡처를 사용합니다.',sources:[sources.favorites],blocks:[b('amp',65578,418470,{input:-3,bass:-1,mid:1,presence:-1}),room(7)]},
 {id:'800-solo',name:'06 · 800 Solo',description:'SD-1 부스트 → JCM800 계열 풀 리그 → 360 ms 에코.',basis:'모디파이드 Marshall과 부스트 페달 추천에서 출발했습니다. 캡처 자체에도 부스트가 있으므로 SD-1 출력을 낮췄습니다.',sources:[sources.pedals],blocks:[b('drive',87914,742716,{input:-3,level:-9}),b('amp',98643,823552,{input:-3,mid:1.5,treble:-1}),echo(360,25,17),room(11)]},
 {id:'jose-orange',name:'07 · Jose Orange',description:'2dor Friedman Jose 헤드 → Orange V30의 421/M160 블렌드.',basis:'2dor Jose와 Orange 캐비넷 조합에 대한 의견을 참고했습니다. 유료 York IR 대신 TONE3000 ToneFactor 무료 IR을 선택했습니다.',sources:[sources.favorites,sources.pedals],blocks:[b('amp',64672,575873,{bass:-1,mid:1,presence:-1}),b('cab',90730,762694),room(7)]},
 {id:'ivory-tight',name:'08 · Ivory Tight',description:'TS9 부스트 → EVH 5150 III Blue IV → Mesa OS V30. 리듬용.',basis:'APP EVH Ivory 추천, NAM 앞 TS와 Mesa/V30 캐비넷 선호를 함께 참고했습니다. 노이즈 게이트는 포함하지 않습니다.',sources:[sources.favorites,sources.pedals],blocks:[b('drive',86314,733129,{level:-6}),b('amp',88689,747683,{bass:-2,mid:1,treble:-1,presence:-1}),b('cab',84863,721117)]},
 {id:'satan-rhythm',name:'09 · Satan Rhythm',description:'Ola의 Randall Satan + KSR 2×12 풀 리그. 후단 EQ만 가볍게.',basis:'커뮤니티가 직접 링크한 Ola Randall Satan 87919 캡처를 사용합니다.',sources:[sources.favorites],blocks:[b('amp',87919,742808,{input:-3,bass:-1,mid:.5,treble:-1}),room(5)]},
 {id:'wide-afterglow',name:'10 · Wide Afterglow',mode:'parallel',description:'Super Reverb L / Hiwatt R → 480 ms 에코 → 스테레오 룸.',basis:'클린 캡처 추천을 바탕으로 SG에서 만든 병렬 조합입니다. 이 스테레오 라우팅·공간계 설정은 커뮤니티 원본 프리셋이 아닙니다.',sources:[sources.clean,sources.favorites],blocks:[comp(),superAmp({input:-6,level:-6}),b('amp',75462,662815,{input:-10,level:-6,treble:-1},'B'),echo(480,38,26),room(28)]},
 {id:'jm-velvet-clean',collection:'mayer',name:'11 · JM Velvet Clean',description:'은은한 컴프 → Silver Klon 저게인 부스트 → Two-Rock CRS 클린 → 짧은 딜레이 → 룸.',basis:'투락과 실버 클론의 조합을 참고한 SG 클린 세팅입니다. Sean Ashe의 저게인 Klon 캡처를 낮은 출력으로 사용합니다. 넥/넥+미들 픽업부터 시작하세요. 실제 곡 세팅 복제는 아닙니다.',sources:[...mayerSources,{title:'Silver Klon · 제작자 캡처 설명',url:'https://www.tone3000.com/tones/2599'},{title:'Two-Rock CRS · 클린 CH1',url:'https://www.tone3000.com/tones/99695'}],blocks:[mayerComp(),b('drive',2599,419209,{input:-3,level:-9}),twoRock({input:-3,bass:-1,mid:-.5,treble:1,presence:-.5}),echo(110,12,7),room(11)]},
 {id:'jm-gravity-lead',collection:'mayer',name:'12 · JM Gravity Lead',description:'컴프 → Klon Mayer 설정 → Two-Rock Traditional Clean Gravity 리드 → 딜레이 → 룸.',basis:'제작자가 Gravity에서 영감받아 만든 투락 풀 리그와 팬 사진을 참고한 Klon John Mayer 캡처를 조합했습니다. 리드 캡처에 과도하게 부스트하지 않도록 Klon 출력을 줄였습니다. 원곡의 정확한 장비/설정 재현은 아닙니다.',sources:[...mayerSources,{title:'Two-Rock Gravity · 제작자 설명',url:'https://www.tone3000.com/tones/78019'},{title:'Klon Silver · John Mayer 모델 설명',url:'https://www.tone3000.com/tones/5196'}],blocks:[mayerComp(),b('drive',5196,424700,{input:-3,level:-9}),b('amp',78019,679422,{input:-6,bass:-1,mid:1,treble:-.5,presence:-1}),echo(300,22,12),room(14)]},
 {id:'jm-slow-dance',collection:'mayer',name:'13 · JM Slow Dance',description:'컴프 → Blues Breaker 낮은 게인 → Two-Rock CRS → 넓은 딜레이 → 룸.',basis:'메이어 스타일 Bluesbreaker/투락 팔레트로 구성한 SG 세팅입니다. Blues Breaker G2 T4 캡처로 가장자리의 드라이브를 더했습니다. 곡 이름은 음색 방향을 나타내며 원곡 체인 복제는 아닙니다.',sources:[...mayerSources,{title:'Marshall Blues Breaker · 캡처',url:'https://www.tone3000.com/tones/80502'},{title:'Two-Rock CRS · 캡처',url:'https://www.tone3000.com/tones/99695'}],blocks:[mayerComp(),b('drive',80502,693833,{input:-2,level:-6}),twoRock({input:-2,bass:-1,mid:1,treble:-.5,presence:-1}),echo(360,26,18),room(18)]},
 {id:'jm-belief-drive',collection:'mayer',name:'14 · JM Belief Drive',description:'컴프 → TS10 스타일 → Silver Klon → Two-Rock CRS → 리드 딜레이 → 룸.',basis:'2019년 보드의 TS10 → Klon 순서를 참고한 SG 리드 세팅입니다. TS10 자리는 Collateral FX Continuum의 TS10 회로 캡처로 대체했습니다. 특정 공연이나 원곡 톤의 정확한 복제는 아닙니다.',sources:[...mayerSources,{title:'Continuum · TS10 스타일 회로 설명',url:'https://www.tone3000.com/tones/99122'},{title:'Silver Klon · 저게인 캡처',url:'https://www.tone3000.com/tones/2599'}],blocks:[mayerComp(0),b('drive',99122,832302,{input:0,level:-6}),b('drive',2599,419209,{input:-3,level:-9}),twoRock({input:-3,bass:-1.5,mid:1.5,treble:-1,presence:-1}),echo(380,24,17),room(12)]}

];
export function createPresetLoader(client){
 const pending=new Map();
 async function asset(spec){
  const key=`factory-asset-v1-${spec.toneId}-${spec.modelId}`;
  if(pending.has(key))return pending.get(key);
  const work=(async()=>{const cached=await defaultCache(undefined,key);if(cached)return cached;
   const {tone,models}=await client.tone(spec.toneId,spec.type),model=models.find(m=>String(m.id)===String(spec.modelId));
   if(!model)throw Error(`${tone.title}: The specified A2/IR model is unavailable.`);
   const nam=['amp','drive'].includes(spec.type);
   if(spec.type==='amp'&&!['amp','amp-cab'].includes(tone.gear)||spec.type==='drive'&&tone.gear!=='pedal'||spec.type==='cab'&&tone.gear!=='cab')throw Error('Preset model type has changed.');
   const data=await client.download(model,spec.type);
   if(nam){const parsed=JSON.parse(data);if(!parsed.weights||!parsed.architecture)throw Error('Invalid NAM model');}
   else{const offline=new OfflineAudioContext(2,128,48000),audio=await offline.decodeAudioData(data.slice(0));if(audio.duration>20||![1,2,4].includes(audio.numberOfChannels))throw Error('Unsupported IR');}
   const result={name:`${tone.title} / ${model.name}`,tone,...(nam?{text:data}:{bytes:data})};await defaultCache(result,key);return result;
  })();pending.set(key,work);try{return await work;}finally{pending.delete(key);}
 }
 return async function load(recipe,audio,onProgress=()=>{}){
  const blocks=[];for(const [i,spec]of recipe.blocks.entries()){onProgress(`${recipe.name} · ${i+1}/${recipe.blocks.length} Loading…`);const block=newBlock(spec.type,spec.lane);Object.assign(block.params,spec.params);block.enabled=true;if(spec.toneId)block.asset=await asset(spec);blocks.push(block);}
  for(const lane of ['A','B']){const amp=blocks.find(x=>x.lane===lane&&x.type==='amp');if(amp?.asset.tone.gear==='amp-cab'&&blocks.some(x=>x.lane===lane&&x.type==='cab'))throw Error('Duplicate cabinet processing');if(amp?.asset.tone.gear==='amp'&&!blocks.some(x=>x.lane===lane&&x.type==='cab'))throw Error('Amp head requires a cabinet.');}
  return validateRig({mode:recipe.mode||'serial',factoryPreset:recipe.id,blocks,audio:{...audio,input:0,output:-24}});
 };
}
