export function wireDrag(button,block,{getRig,isBusy,onDrop,viewport}){
  let drag,ghost,target,highlight;
  const cleanup=()=>{ghost?.remove();ghost=null;highlight?.classList.remove('drop-target');highlight=null;button.classList.remove('node-dragging');document.body.classList.remove('chain-dragging');};
  button.onpointerdown=e=>{if(e.button!==0||isBusy())return;button.dataset.dragged='false';drag={x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);};
  button.onpointermove=e=>{
    if(!drag)return;if(!ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
    if(!ghost){button.dataset.dragged='true';ghost=button.cloneNode(true);ghost.removeAttribute('data-block');ghost.className+=' drag-ghost';ghost.style.position='fixed';document.body.append(ghost);button.classList.add('node-dragging');document.body.classList.add('chain-dragging');}
    ghost.style.left=(e.clientX-27)+'px';ghost.style.top=(e.clientY-27)+'px';highlight?.classList.remove('drop-target');target=null;highlight=null;
    const over=document.elementFromPoint(e.clientX,e.clientY)?.closest('.chain-insert,.signal-node');
    if(over?.classList.contains('chain-insert')){target={lane:over.dataset.lane,beforeId:over.dataset.before||null};highlight=over;}
    else if(over?.dataset.block&&over.dataset.block!==block.id){const other=getRig().blocks.find(b=>b.id===over.dataset.block),rect=over.getBoundingClientRect(),same=getRig().blocks.filter(b=>b.lane===other.lane&&b.id!==block.id),idx=same.indexOf(other);target={lane:other.lane,beforeId:e.clientX<rect.left+rect.width/2?other.id:same[idx+1]?.id||null};highlight=over;}
    highlight?.classList.add('drop-target');
    const bounds=viewport.getBoundingClientRect();if(e.clientX>bounds.right-30)viewport.scrollLeft+=8;else if(e.clientX<bounds.left+30)viewport.scrollLeft-=8;
  };
  button.onpointerup=()=>{const moved=!!ghost,drop=target;drag=null;target=null;cleanup();if(moved&&drop)onDrop(block,drop);};
  button.onpointercancel=()=>{drag=null;target=null;cleanup();};
}

