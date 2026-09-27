/* Shared rendering primitives and accessible image detail dialog. */
(() => {
  'use strict';
  const e = Sarah.utils.escape;
  const paths = {
    heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    arrow:'M5 12h14m-6-6 6 6-6 6',
    book:'M12 5v16M3 3c4 0 7 1 9 3 2-2 5-3 9-3v16c-4 0-7 1-9 3-2-2-5-3-9-3V3Z',
    photos:'M8 3h13v15H8zM4 7H2v15h14v-2M11 14l3-4 4 5M11 7h.01',
    people:'M8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 22v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8m1 4c4 0 5 3 5 7',
    spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
    home:'m2 11 10-9 10 9M5 9v13h14V9M9 22v-8h6v8',
    sun:'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
    chat:'M21 15a3 3 0 0 1-3 3H8l-6 4V6a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v9ZM7 8h9M7 12h6',
    compass:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-2 6-6 2 2-6 6-2Z',
    route:'M5 5a2 2 0 1 0 0 .01M19 19a2 2 0 1 0 0 .01M5 8v5a4 4 0 0 0 4 4h5M10 5h5a4 4 0 0 1 4 4v5',
    shuffle:'m16 3 5 4-5 4M3 7h3c5 0 7 10 12 10h3m-5-4 5 4-5 4M3 17h3c2 0 3-1 4-3m4-4c1-2 2-3 4-3h3',
    calendar:'M4 5h16v17H4zM8 2v6m8-6v6M4 11h16',
    play:'m8 4 13 8L8 20V4Z'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.heart}"/></svg>`;
  const photo = (id, cls='', eager=false) => {
    const item = SARAH_CONTENT.media.find(item => item.id === id);
    return item ? `<img class="${e(cls)}" src="${e(item.src)}" alt="${e(item.alt)}" loading="${eager?'eager':'lazy'}" decoding="async">` : '';
  };
  const photoCard = item => `<button class="photo-card" type="button" data-photo="${e(item.id)}">${`<img src="${e(item.thumb)}" alt="${e(item.alt)}" loading="lazy" width="500" height="500">`}<span>${e(item.title)}</span><small>${e(item.tag)} · ${e(item.dateLabel)}</small></button>`;
  const heading = (eyebrow,title,description='',center=false) => `<header class="page-heading ${center?'center':''}"><p class="eyebrow">${e(eyebrow)}</p><h1>${title}</h1>${description?`<p class="lead">${e(description)}</p>`:''}</header>`;
  const source = text => `<details class="source-panel"><summary>Behind this moment</summary><p>${e(text)}</p></details>`;
  let toastTimer;
  const toast = text => { const node = document.getElementById('toast'); node.textContent=text; node.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('show'),4500); };
  const download = (text, name, type='text/plain') => {
    const url = URL.createObjectURL(new Blob([text],{type})); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard.'); return true; }
    catch { toast('Copy is unavailable here. Select and copy the link from the address bar.'); return false; }
  };
  const showPhoto = id => {
    const item=SARAH_CONTENT.media.find(item=>item.id===id); if(!item)return;
    const dialog=document.getElementById('photo-dialog');
    document.getElementById('photo-dialog-body').innerHTML=`<img class="dialog-image" src="${e(item.src)}" alt="${e(item.alt)}"><div class="dialog-caption"><p class="eyebrow">Family photograph</p><h2>${e(item.title)}</h2><p>${e(item.credit)} · ${e(item.dateLabel)}</p><p class="muted">${e(item.note)}</p><div class="dialog-actions"><a class="text-link" href="#/memories/share?photo=${encodeURIComponent(item.id)}">Add the story behind this photo ${icon('arrow')}</a></div></div>`;
    dialog.showModal();
  };
  Sarah.ui={icon,photo,photoCard,heading,source,toast,download,copy,showPhoto};
})();
