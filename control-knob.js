export function controlKnob({label,value,min,max,step,unit,onChange,hint,ariaLabel}){
  const root=document.createElement('div');root.className='knob-control';
  const name=document.createElement('span');name.className='knob-name';name.textContent=label;
  const face=document.createElement('div');face.className='knob-face';face.tabIndex=0;face.setAttribute('role','slider');face.setAttribute('aria-label',ariaLabel);face.setAttribute('aria-valuemin',min);face.setAttribute('aria-valuemax',max);face.innerHTML='<div class="knob-cap"><i></i></div>';
  const field=document.createElement('input');field.type='number';field.className='knob-number';field.min=min;field.max=max;field.step=step;field.setAttribute('aria-label',ariaLabel+' value');
  const readout=document.createElement('div');readout.className='knob-readout';const suffix=document.createElement('span');suffix.textContent=unit;readout.append(field,suffix);
  function update(next,emit=true){const n=Number(next);if(!Number.isFinite(n))return;value=Math.max(min,Math.min(max,Number((Math.round((n-min)/step)*step+min).toFixed(4))));field.value=value;face.style.setProperty('--turn',(-135+270*(value-min)/(max-min))+'deg');face.style.setProperty('--amount',(270*(value-min)/(max-min))+'deg');face.setAttribute('aria-valuenow',value);face.setAttribute('aria-valuetext',value+' '+unit);if(emit)onChange(value);}
  face.onkeydown=e=>{const delta={ArrowUp:step,ArrowRight:step,ArrowDown:-step,ArrowLeft:-step,PageUp:step*10,PageDown:-step*10}[e.key];if(delta!==undefined){e.preventDefault();update(value+delta*(e.shiftKey?10:1));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();update(e.key==='Home'?min:max);}};
  let drag;
  face.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();face.focus();face.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,value};face.classList.add('dragging');};
  face.onpointermove=e=>{if(!drag)return;const movement=(drag.y-e.clientY)+(e.clientX-drag.x)*.35;update(drag.value+movement/170*(max-min)*(e.shiftKey?.2:1));};
  const release=()=>{drag=null;face.classList.remove('dragging');};face.onpointerup=release;face.onpointercancel=release;face.onlostpointercapture=release;
  face.ondblclick=()=>update((min+max)/2);field.onchange=()=>update(field.value);field.onkeydown=e=>{if(e.key==='Enter')field.blur();};
  const caption=document.createElement('span');caption.className='knob-hint';caption.textContent=hint||'';root.append(name,face,readout,caption);update(value,false);return root;
}
