const names={amp:'Amp',drive:'Drive',cab:'Cabinet',reverb:'Reverb'};
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
export function compatibleTone(tone,type){const gears={amp:['amp','amp-cab','full-rig'],drive:['pedal'],cab:['cab'],reverb:['space']};if(!gears[type]?.includes(tone.gear))return false;const nam=['amp','drive'].includes(type);return tone.format===(nam?'nam':'ir')&&(!nam||Number(tone.a2_models_count)>0);}
export function createToneLibrary({client,onLoad,onAuth,onCatalog}){
  const dialog=node('dialog',undefined,'tone-library');dialog.setAttribute('aria-label','TONE3000 library');
  dialog.innerHTML='<div class="library-heading"><div><span class="library-brand">TONE3000</span><span id="libraryKind"></span></div><div class="library-heading-right"><span id="libraryUser"></span><button id="libraryClose" class="icon-button" aria-label="Close library">×</button></div></div><div class="library-toolbar"><div class="library-tabs"><button data-library-tab="trending">Trending</button><button data-library-tab="search">Search</button><button data-library-tab="favorited">Favorites</button><button data-library-tab="downloaded">Downloads</button><button data-library-tab="created">My tones</button></div><button id="libraryCatalog" class="quiet">Full catalog ↗</button></div><form id="librarySearch"><input id="libraryQuery" type="search" placeholder="Search by name" aria-label="Search tones"><button class="quiet">Search</button></form><p id="libraryStatus" role="status"></p><div class="library-body"><div><div id="libraryRows"></div><div class="library-paging"><button id="libraryPrev">←</button><span id="libraryPage"></span><button id="libraryNext">→</button></div></div><div id="libraryDetail" hidden></div></div>';
  document.body.append(dialog);const $=id=>dialog.querySelector('#'+id);let block,tab='trending',page=1,total=1,generation=0,loading=false;
  const status=text=>$('libraryStatus').textContent=text;
  $('libraryClose').onclick=()=>dialog.close();$('libraryCatalog').onclick=async()=>{try{await onCatalog(block);}catch(e){status(e.message);}};
  function image(url,alt,cls){const img=node('img',undefined,cls);img.alt=alt;const fallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="10" fill="#2b1d37"/><rect x="22" y="15" width="36" height="50" rx="8" fill="none" stroke="#b995d5" stroke-width="2"/><circle cx="40" cy="31" r="6" fill="none" stroke="#e8adbc" stroke-width="2"/><path d="M30 49h20" stroke="#b995d5" stroke-width="2"/></svg>');img.src=url?.startsWith('https://')?url:fallback;img.onerror=()=>{img.onerror=null;img.src=fallback;};return img;}
  function login(){const wrap=node('div',undefined,'library-empty');wrap.append(node('p','Sign in to browse tones.'));const button=node('button','Sign in to TONE3000','primary');button.onclick=async()=>{try{await onAuth(block);}catch(e){status(e.message);}};wrap.append(button);$('libraryRows').replaceChildren(wrap);status('Sign in required.');}
  async function user(){try{const u=await client.user();$('libraryUser').replaceChildren(image(u.avatar_url,'','user-avatar'),node('span','@'+u.username));}catch{$('libraryUser').textContent='';}}
  async function choose(tone){
    const ticket=++generation;$('libraryDetail').hidden=false;$('libraryDetail').replaceChildren(node('p','Loading capture models…','note'));
    try{const result=await client.tone(tone.id,block.type);if(ticket!==generation)return;const detail=$('libraryDetail');detail.replaceChildren(image(tone.images?.[0],tone.title,'library-art'),node('h3',tone.title),node('p',`${tone.gear} · ${tone.format.toUpperCase()} · @${tone.user?.username||'creator'}`,'credit'),node('p',tone.description||'','note library-description'));
      const link=node('a','View on TONE3000 ↗');link.href=`https://www.tone3000.com/tones/${tone.id}`;link.target='_blank';link.rel='noopener';detail.append(link);
      const variants=node('select');variants.setAttribute('aria-label','Library capture model');variants.replaceChildren(...result.models.map((m,i)=>new Option(m.name,String(i))));const label=node('label','Capture model');label.append(variants);detail.append(label);
      const load=node('button','Use this model','primary');load.onclick=async()=>{if(loading)return;loading=true;load.disabled=true;try{status('Downloading model…');const m=result.models[Number(variants.value)],data=await client.download(m,block.type),name=`${result.tone.title} / ${m.name}`;await onLoad(block,['amp','drive'].includes(block.type)?{name,text:data,tone:result.tone}:{name,bytes:data,tone:result.tone});dialog.close();}catch(e){status(e.message);load.disabled=false;}finally{loading=false;}};detail.append(load);
      for(const row of dialog.querySelectorAll('.tone-row'))row.classList.toggle('selected',row.dataset.tone===String(tone.id));status('Select a capture model to load.');
    }catch(e){if(ticket===generation){$('libraryDetail').replaceChildren(node('p',e.message,'note'));status(e.message);}}
  }
  async function refresh(){
    const ticket=++generation;const type=block.type;$('libraryDetail').hidden=true;$('libraryRows').replaceChildren();status('Loading tones…');
    for(const button of dialog.querySelectorAll('[data-library-tab]'))button.setAttribute('aria-pressed',String(button.dataset.libraryTab===tab));
    if(!client.connected()){login();return;}
    try{const result=await client.list(type,{tab,query:$('libraryQuery').value.trim(),page});if(ticket!==generation)return;
      const tones=[...new Map(result.data.filter(t=>compatibleTone(t,type)).map(t=>[t.id,t])).values()];total=result.total_pages||1;
      for(const tone of tones){const row=node('button',undefined,'tone-row');row.dataset.tone=tone.id;row.append(image(tone.images?.[0],tone.title,'tone-thumb'));const copy=node('span',undefined,'tone-row-copy');copy.append(node('strong',tone.title),node('span',`${tone.gear} · ${tone.format.toUpperCase()} · @${tone.user?.username||'creator'}`));row.append(copy,node('span','›','tone-row-arrow'));row.onclick=()=>choose(tone);$('libraryRows').append(row);}
      if(!tones.length)$('libraryRows').append(node('p','No matching tones on this page. Try searching or the next page.','library-empty'));
      $('libraryPage').textContent=`${page} / ${total}`;$('libraryPrev').disabled=page<=1;$('libraryNext').disabled=page>=total;status(`${names[type]} · ${tones.length} tones`);
    }catch(e){if(ticket!==generation)return;status(e.message);if(/sign.in|401/i.test(e.message))login();}
  }
  for(const b of dialog.querySelectorAll('[data-library-tab]'))b.onclick=()=>{tab=b.dataset.libraryTab;page=1;$('libraryQuery').value='';refresh();};
  $('librarySearch').onsubmit=e=>{e.preventDefault();if(tab==='trending')tab='search';page=1;refresh();};
  $('libraryPrev').onclick=()=>{if(page>1){page--;refresh();}};$('libraryNext').onclick=()=>{if(page<total){page++;refresh();}};
  dialog.addEventListener('close',()=>{generation++;});
  return {open(selected){block=selected;tab='trending';page=1;$('libraryQuery').value='';$('libraryKind').textContent=names[block.type];dialog.showModal();user();refresh();}};
}
