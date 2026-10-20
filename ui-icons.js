const paths={
 settings:'<path d="m9 3 .6-1h4.8l.6 1 .5 2 1.8 1 2-.5 1.6 2.8-1.5 1.5v2.4l1.5 1.5-1.6 2.8-2-.5-1.8 1-.5 2-.6 1H9l-.6-1-.5-2-1.8-1-2 .5-1.6-2.8L4 12.2V9.8L2.5 8.3l1.6-2.8 2 .5 1.8-1Z"/><circle cx="12" cy="11" r="3"/>',
 duplicate:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V4H4v11h4"/>',
 delete:'<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
 browse:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 serial:'<path d="M2 12h4m4 0h4m4 0h4"/><rect x="6" y="9" width="4" height="6" rx="1"/><rect x="14" y="9" width="4" height="6" rx="1"/>',
 parallel:'<path d="M2 12h3V6h14v12H5v-6m14 0h3"/><rect x="10" y="3" width="4" height="6" rx="1"/><rect x="10" y="15" width="4" height="6" rx="1"/>',
 earlier:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 later:'<path d="M4 12h16m-6-6 6 6-6 6"/>'
};
export function iconButton(button,kind,label){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.innerHTML=paths[kind];button.replaceChildren(svg);button.classList.add('action-icon');button.setAttribute('aria-label',label);button.title=label;return button;
}
