export function ampEq(ctx,source){
  const specs=[['bass','lowshelf',120],['mid','peaking',750],['treble','highshelf',3000],['presence','highshelf',6500]];
  const filters=specs.map(([key,type,frequency])=>{const node=ctx.createBiquadFilter();node.type=type;node.frequency.value=frequency;node.Q.value=.7;node.gain.value=0;return {key,node};});
  let tail=source;for(const {node}of filters){tail.connect(node);tail=node;}
  return {tail,nodes:filters.map(x=>x.node),update(state,initial=false){for(const {key,node}of filters){const value=Math.max(-12,Math.min(12,Number(state[key])||0));if(initial)node.gain.setValueAtTime(value,ctx.currentTime);else node.gain.setTargetAtTime(value,ctx.currentTime,.02);}}};
}
