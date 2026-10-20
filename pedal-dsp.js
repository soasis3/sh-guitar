const amp=db=>10**(db/20);
function parameter(param,value,ctx,initial){if(initial)param.setValueAtTime(value,ctx.currentTime);else param.setTargetAtTime(value,ctx.currentTime,.02);}
export function compressorGraph(ctx,source,destination,state){
  const dry=ctx.createGain(),wet=ctx.createGain(),comp=ctx.createDynamicsCompressor(),makeup=ctx.createGain();
  source.connect(dry).connect(destination);source.connect(comp).connect(makeup).connect(wet).connect(destination);
  function update(s,initial=false){for(const p of ['threshold','ratio','attack','release'])parameter(comp[p],s[p]*(p==='attack'||p==='release'?.001:1),ctx,initial);parameter(comp.knee,12,ctx,initial);parameter(makeup.gain,amp(s.level),ctx,initial);parameter(dry.gain,s.enabled?0:1,ctx,initial);parameter(wet.gain,s.enabled?1:0,ctx,initial);}
  update(state,true);return {update,reduction:()=>comp.reduction};
}
export function delayGraph(ctx,source,destination,state){
  const dry=ctx.createGain(),wet=ctx.createGain(),send=ctx.createGain(),delay=ctx.createDelay(2),feedback=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=4500;
  source.connect(dry).connect(destination);source.connect(send).connect(delay).connect(filter);filter.connect(wet).connect(destination);filter.connect(feedback).connect(delay);
  function update(s,initial=false){parameter(delay.delayTime,s.time/1000,ctx,initial);parameter(feedback.gain,s.enabled?s.feedback/100:0,ctx,initial);parameter(send.gain,s.enabled?1:0,ctx,initial);parameter(dry.gain,s.enabled?1-s.mix/100:1,ctx,initial);parameter(wet.gain,s.enabled?s.mix/100:0,ctx,initial);}
  update(state,true);return {update};
}
