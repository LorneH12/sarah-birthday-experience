/* Floating photo gallery. Motion is opt-in; every photograph can receive context. */
(() => {
  'use strict';
  const e=Sarah.utils.escape;
  const allowed=['all','shuffle','undated',...SARAH_CONTENT.experience.capsules.map(c=>c.decade)];
  function collection(mode){
    if(!allowed.includes(mode))return null;
    const family=SARAH_CONTENT.media.filter(m=>mode==='all'||mode==='shuffle'||m.decade===mode);
    if(mode==='shuffle')return Sarah.utils.shuffle(family);
    return [...family,...(['all','shuffle','undated'].includes(mode)?[]:SARAH_CONTENT.history.filter(m=>m.decade===mode))];
  }
  const page=(mode='all')=>{
    const list=collection(mode);if(list===null)return Sarah.pages.notFound();
    const title=mode==='all'?'A walk through our memories.':mode==='shuffle'?'A little shuffle. A lot of love.':mode==='undated'?'Help place a moment in time.':`Inside the ${mode}.`;
    return `<section class="chamber" aria-label="Immersive photo gallery"><header class="chamber-header"><a class="chamber-back" href="#/home?section=photo-journeys">← Leave the gallery</a><div><p class="eyebrow">THE FAMILY TIME CHAMBER</p><h1>${title}</h1></div><button id="chamber-fullscreen" class="button outline small" type="button">Full screen ⛶</button></header>${list.length?`<div id="chamber-stage" class="chamber-stage" tabindex="0" aria-label="Photo corridor. Use left and right arrow keys, swipe, or the buttons to move."><div class="chamber-architecture" aria-hidden="true"><i></i><i></i><i></i><div class="chamber-floor"></div><span>EVERY PICTURE<br>HAS A STORY.</span></div><div id="chamber-frames"></div></div><div class="chamber-caption" aria-live="polite"><p id="chamber-counter"></p><h2 id="chamber-title"></h2><p id="chamber-meta"></p><a id="chamber-contribute" class="text-link" href="#/memories/share">Recognize someone? Add a name or memory ↗</a></div><div class="chamber-controls"><button id="chamber-prev" class="icon-button" aria-label="Previous photographs">←</button><button id="chamber-play" class="button" aria-pressed="false">Start the walk ${Sarah.ui.icon('play')}</button><button id="chamber-next" class="icon-button" aria-label="Next photographs">→</button><label class="motion-choice"><input id="chamber-motion" type="checkbox" checked> Gallery motion</label><a class="text-link" href="#/explore">Simple gallery</a></div><p class="chamber-tip">Tap any photograph to look closer. Pause and add the details only you know.<br>Use the arrows or swipe across the gallery. The automatic walk changes photos every 8 seconds.</p>`:`<div class="chamber-empty">${Sarah.ui.icon('photos')}<h2>This room is waiting<br>for your photographs.</h2><p>No family photos have a confirmed ${e(mode)} date yet. Help us identify a year in the undated collection, or send a photograph from this decade.</p><div class="button-row"><a class="button" href="#/chamber/undated">Explore undated photos</a><a class="button outline" href="#/memories/share?decade=${e(mode)}">Add to this decade</a></div></div>`}</section>`;
  };
  function mount(mode='all'){
    const list=collection(mode);if(!list?.length)return()=>{};
    const root=document.querySelector('.chamber'),stage=document.getElementById('chamber-stage'),frames=document.getElementById('chamber-frames'),motion=document.getElementById('chamber-motion'),play=document.getElementById('chamber-play');
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');motion.checked=!preference.matches;
    let index=0,timer=null,startX=0,disposed=false;
    const title=document.getElementById('chamber-title'),meta=document.getElementById('chamber-meta'),counter=document.getElementById('chamber-counter'),contribute=document.getElementById('chamber-contribute');
    const stop=()=>{clearInterval(timer);timer=null;play.textContent='Start the walk ▷';play.setAttribute('aria-pressed','false');};
    const render=()=>{
      const visible=[0,1,2,3].filter(offset=>offset<list.length);
      frames.innerHTML=visible.map((offset)=>{const m=list[(index+offset)%list.length],historical=m.type==='history';return `<button class="floating-frame frame-${offset}" ${historical?`data-history="${e(m.id)}"`:`data-photo="${e(m.id)}"`} aria-label="Open ${e(m.title)}"><img src="${e(m.src)}" alt="${e(m.alt)}" ${offset<2?'':'loading="lazy"'}><span class="frame-label"><small>${historical?'HISTORICAL CONTEXT':e(m.dateLabel)}</small><strong>${e(m.title)}</strong><span>${historical?'Read source & context':'Look closer · Add a memory'} ↗</span></span></button>`;}).join('');
      const current=list[index];counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')} · ${mode==='all'?'THE FULL COLLECTION':mode==='shuffle'?'SARAH SHUFFLE':mode.toUpperCase()}`;
      title.textContent=current.title;meta.textContent=current.type==='history'?'Historical context · '+current.source:current.dateLabel+' · '+current.credit;
      contribute.href=current.type==='history'?current.url:'#/memories/share?photo='+encodeURIComponent(current.id);
      contribute.textContent=current.type==='history'?'Read the original historical source ↗':'Recognize someone? Add a name or memory ↗';
      contribute.target=current.type==='history'?'_blank':'_self';contribute.rel='noopener noreferrer';
      root.classList.toggle('still-gallery',!motion.checked);
      if(motion.checked&&!preference.matches)frames.animate([{opacity:.15,transform:'perspective(1200px) translateZ(-160px)'},{opacity:1,transform:'perspective(1200px) translateZ(0)'}],{duration:1100,easing:'cubic-bezier(.2,.6,.3,1)'});
    };
    const advance=delta=>{index=(index+delta+list.length)%list.length;render();};
    document.getElementById('chamber-next').addEventListener('click',()=>{stop();advance(1);});
    document.getElementById('chamber-prev').addEventListener('click',()=>{stop();advance(-1);});
    play.addEventListener('click',()=>{if(timer){stop();return;}play.textContent='Pause the walk Ⅱ';play.setAttribute('aria-pressed','true');timer=setInterval(()=>{if(!document.hidden&&!document.getElementById('photo-dialog').open)advance(1);},8000);});
    stage.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();stop();advance(event.key==='ArrowRight'?1:-1);}});
    stage.addEventListener('pointerdown',event=>{startX=event.clientX;});stage.addEventListener('pointerup',event=>{const delta=event.clientX-startX;if(Math.abs(delta)>70){stop();advance(delta<0?1:-1);}});
    frames.addEventListener('click',event=>{stop();const button=event.target.closest('[data-history]');if(!button)return;const m=list.find(m=>m.id===button.dataset.history);const dialog=document.getElementById('photo-dialog');document.getElementById('photo-dialog-body').innerHTML=`<img class="dialog-image" src="${e(m.src)}" alt="${e(m.alt)}"><div class="dialog-caption"><p class="eyebrow">Historical context · ${e(m.dateLabel)}</p><h2>${e(m.title)}</h2><p>${e(m.text)}</p><a class="text-link" href="${e(m.url)}" target="_blank" rel="noopener noreferrer">${e(m.source)} ↗</a></div>`;dialog.showModal();});
    motion.addEventListener('change',render);
    const onPreference=()=>{motion.checked=!preference.matches;stop();render();};preference.addEventListener('change',onPreference);
    const fs=document.getElementById('chamber-fullscreen');fs.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else root.classList.toggle('expanded-gallery');}catch{root.classList.toggle('expanded-gallery');}if(!disposed)fs.textContent=document.fullscreenElement||root.classList.contains('expanded-gallery')?'Exit full screen ⛶':'Full screen ⛶';});
    const onFullscreen=()=>{fs.textContent=document.fullscreenElement?'Exit full screen ⛶':'Full screen ⛶';};document.addEventListener('fullscreenchange',onFullscreen);
    render();
    return()=>{disposed=true;stop();preference.removeEventListener('change',onPreference);document.removeEventListener('fullscreenchange',onFullscreen);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});};
  }
  Sarah.chamber={page,mount,collection};
})();
