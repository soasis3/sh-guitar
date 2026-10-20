export function inputConstraints(audio,rate,supported={}){
 const result={deviceId:audio.device?{exact:audio.device}:undefined,channelCount:{ideal:2},echoCancellation:false,noiseSuppression:false,autoGainControl:false};
 if(supported.sampleRate)result.sampleRate={ideal:rate};
 if(supported.latency)result.latency={ideal:0};
 return result;
}
const milliseconds=value=>Number.isFinite(value)&&value>0?`${(value*1000).toFixed(1)} ms`:'not reported';
export function captureReport(track,context){
 const s=track.getSettings(),flag=value=>typeof value==='boolean'?(value?'on':'off'):'not reported';
 return [
  `Input: ${track.label||'Name not reported'}`,
  `Capture: ${s.sampleRate?`${s.sampleRate.toLocaleString()} Hz`:'rate not reported'} · ${s.channelCount??'?'} channels`,
  `Processing: echo ${flag(s.echoCancellation)} · noise ${flag(s.noiseSuppression)} · auto gain ${flag(s.autoGainControl)}`,
  `Engine: ${context.sampleRate.toLocaleString()} Hz`,
  `Reported: capture ${milliseconds(s.latency)} · base ${milliseconds(context.baseLatency)} · output ${milliseconds(context.outputLatency)}`,
  'These values are not measured round-trip latency.'
 ].join('\n');
}
export async function buildMonitorGraph(context,rig,source,destination,mode,build){
 if(mode!=='dry')return build(context,rig,source,destination);
 const tap=context.createGain();source.connect(tap).connect(destination);
 return {controls:new Map(),dispose:async()=>tap.disconnect()};
}
