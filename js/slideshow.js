/* Slideshow controller. One timer, one listener scope, explicit teardown. */
(() => {
  'use strict';
  const e=Sarah.utils.escape;
  const modes={decades:{title:'Through the Decades',description:'Follow Sarah’s story alongside the times and places around her. Historical images are labeled separately from family photographs.'},shuffle:{title:'Sarah Shuffle',description:'Forget the timeline for a little while. Enjoy real family photographs with a playful mix of transitions.'},party:{title:'Party Playback',description:'A simple, looping family-photo playlist for Sarah’s birthday party screen. Choose full screen, press play, and enjoy.'}};
  const page = (mode,decade='all') => {
    if(mode&&!modes[mode])return Sarah.pages.notFound();
    if(!mode)return `<div class="wrap page-bottom">${Sarah.ui.heading('Real photos. Real moments. Real life.','Let the memories <em>play.</em>','Travel through the decades, shuffle the family album, or share a laugh with Sarah as familiar faces fill the birthday party screen.',true)}<div class="mode-cards">${Object.entries(modes).map(([id,m])=>`<article class="mode-card ${id==='shuffle'?'featured':''}">${Sarah.ui.icon(id==='decades'?'calendar':id==='shuffle'?'shuffle':'play')}<h2>${e(m.title)}</h2><p>${e(m.description)}</p><a class="button ${id==='shuffle'?'light':'outline'}" href="#/slideshow/${id}">${id==='decades'?'Choose a decade':id==='shuffle'?'Start shuffling':'Open party player'} ${Sarah.ui.icon('arrow')}</a></article>`).join('')}</div><p class="notice">The first collection contains ${SARAH_CONTENT.media.length} original family photographs. Capture dates are still being confirmed; undated photos are kept together so no one has to guess.</p></div>`;
    const decades=['all','1930s','1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s','undated'];
    return `<div class="wrap page-bottom"><a class="back-link" href="#/slideshow">← Slideshow modes</a>${Sarah.ui.heading('The family album',e(modes[mode].title),modes[mode].description)}${mode==='decades'?`<nav class="decade-controls" aria-label="Choose a decade">${decades.map(d=>`<a href="#/slideshow/decades/${d}" class="${d===decade?'active':''}" ${d===decade?'aria-current="page"':''}>${d==='all'?'All decades':d==='undated'?'Undated photos':d}</a>`).join('')}</nav>`:''}<section class="player" id="slideshow-player" aria-label="${e(modes[mode].title)} player"><div class="player-header"><strong>${e(modes[mode].title)}</strong><span id="slide-kind"></span><button type="button" data-player-exit>Exit player</button></div><div class="player-stage" id="player-stage" aria-live="off"></div><div class="slide-caption" id="slide-caption"></div><div class="player-controls"><button type="button" data-player="prev" aria-label="Previous slide">←</button><button type="button" class="play-control" data-player="play">Play</button><button type="button" data-player="next" aria-label="Next slide">→</button><span class="slide-counter" id="slide-counter"></span><span class="spacer"></span><label>Speed<select id="slide-speed" aria-label="Slide duration"><option value="4000">4 seconds</option><option value="7000" selected>7 seconds</option><option value="10000">10 seconds</option><option value="15000">15 seconds</option></select></label><label>Motion<select id="slide-motion" aria-label="Photo motion"><option value="reveal">Sarah reveal</option><option value="zoom">Gentle zoom</option><option value="still">Still photos</option></select></label><button type="button" data-player="focus" aria-pressed="false">Adjust focus</button><button type="button" data-player="captions" aria-pressed="true">Captions</button>${mode==='shuffle'?'<button type="button" data-player="reshuffle">Reshuffle</button>':''}<button type="button" data-player="fullscreen">Full screen</button></div></section><p class="slide-hint">Use ← → to browse, Space to play or pause, and Escape to leave full screen. Swipe left or right on a photo. Sound stays off.</p><p class="focus-status" id="focus-status" role="status"></p><fieldset class="focus-controls" id="focus-controls" hidden><legend>Choose the person to highlight</legend><p>Tap their position in the photo, or use these sliders. Your choice is saved only on this device.</p><label>Across<input type="range" id="focus-x" aria-label="Horizontal focus" min="0" max="100" value="50"></label><label>Down<input type="range" id="focus-y" aria-label="Vertical focus" min="0" max="100" value="50"></label><button type="button" id="focus-reset" class="button outline small">Reset focus</button></fieldset>${mode==='decades'?'<p class="copy-note">Historical context describes the wider world; it does not imply that Sarah witnessed an event or appears in an archival image. Family photos without confirmed dates remain in Undated photos.</p>':''}</div>`;
  };
  const mount = (mode,decade='all') => {
    const player=document.getElementById('slideshow-player');if(!player)return()=>{};
    const scope=new AbortController();const options={signal:scope.signal};
    const stage=document.getElementById('player-stage'),caption=document.getElementById('slide-caption'),counter=document.getElementById('slide-counter'),kind=document.getElementById('slide-kind');
    const playButton=player.querySelector('[data-player="play"]');
    let list=Sarah.utils.buildPlaylist(SARAH_CONTENT,mode,decade), index=0,playing=false,timer=null,duration=7000,showCaptions=true,touchX=null,pausedByVisibility=false,motion="reveal",adjusting=false,animations=[];
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const focusControls=document.getElementById("focus-controls"),focusStatus=document.getElementById("focus-status");
    let localFocus={};try{localFocus=JSON.parse(localStorage.getItem("sarah-photo-focus")||"{}");}catch{}
    const validFocus=f=>f&&Number.isFinite(f.x)&&Number.isFinite(f.y)&&f.x>=0&&f.x<=1&&f.y>=0&&f.y<=1;
    const currentFocus=item=>validFocus(localFocus[item.id])?localFocus[item.id]:item.focus?.confirmed&&validFocus(item.focus)?item.focus:null;
    const cancelMotion=()=>{animations.forEach(a=>a.cancel());animations=[];stage.querySelector(".focus-overlay")?.remove();};
    const pause = () => {playing=false;clearTimeout(timer);timer=null;playButton.textContent='Play';animations.forEach(a=>a.pause());};
    const schedule = () => {clearTimeout(timer);if(playing&&list.length>1)timer=setTimeout(()=>{index=(index+1)%list.length;render();schedule();},duration);};
    const render = () => {
      cancelMotion();
      const item=list[index];
      if(!item){stage.innerHTML='<div class="empty-state"><h3>A chapter still being gathered.</h3><p>No dated photographs or context items have been added for this decade yet.</p><a class="button light" href="#/slideshow/decades/undated">Explore undated family photos</a></div>';caption.hidden=true;kind.textContent='';counter.textContent='0 / 0';player.querySelectorAll('[data-player]').forEach(b=>b.disabled=true);return;}
      const transition=(motion==='still'||reduced.matches)?'':mode==='shuffle'?['slide-fade','slide-drift','slide-turn','slide-zoom'][index%4]:'slide-fade';
      if(item.type==='chapter')stage.innerHTML=`<div class="slide-content ${transition}"><div class="slide-text"><p class="eyebrow">${e(item.year)} · ${e(item.place)}</p><h2>${e(item.title)}</h2><p>${e(item.text[0])}</p></div></div>`;
      else stage.innerHTML=`<div class="slide-content ${transition}"><img class="slide-image" src="${e(item.src)}" alt="${e(item.alt)}"></div>`;
      const img=stage.querySelector('img');
      const focus=currentFocus(item);
      focusStatus.textContent=reduced.matches?'Motion is off to match your device preference.':motion==='reveal'&&!focus&&item.type!=='chapter'?'Gentle zoom is used until a focus is chosen for this photo.':motion==='reveal'&&focus?'The selected person appears first, then the full photograph fades in.':'';
      player.querySelector('[data-player=focus]').disabled=!img||item.type==='history';
      focusControls.hidden=!adjusting||!img||item.type==='history';
      if(focusControls.hidden)stage.classList.remove('choosing-focus');else stage.classList.add('choosing-focus');
      document.getElementById('focus-x').value=(focus?.x??.5)*100;document.getElementById('focus-y').value=(focus?.y??.5)*100;
      if(img){if(img.complete&&img.naturalWidth)animatePhoto(img,item);else img.addEventListener('load',()=>{if(img.isConnected)animatePhoto(img,item);},{once:true});}
      if(img)img.addEventListener('error',()=>{pause();stage.innerHTML='<div class="empty-state"><h3>This photo could not load.</h3><p>Use Next to continue, or try again when your connection improves.</p></div>';},{once:true});
      kind.textContent=item.type==='history'?'HISTORICAL CONTEXT':item.type==='chapter'?'SARAH’S JOURNEY':'FAMILY PHOTOGRAPH';
      caption.innerHTML=`<strong>${e(item.title)}</strong><small>${e(item.dateLabel||item.year)} · ${item.type==='history'?`${e(item.credit)} · <a href="${e(item.url)}" target="_blank" rel="noopener noreferrer">View source ↗</a>`:e(item.source||item.credit)}</small>`;
      caption.hidden=!showCaptions;counter.textContent=`${index+1} / ${list.length}`;
      playButton.disabled=list.length<2;
      const next=list[(index+1)%list.length];if(next?.src){const preload=new Image();preload.src=next.src;}
    };
    const animatePhoto=(img,item)=>{
      if(!playing||reduced.matches||motion==='still'||item.type==='history'||!img.naturalWidth)return;
      const rect=stage.getBoundingClientRect(),fit=Math.min(rect.width/img.naturalWidth,rect.height/img.naturalHeight),w=img.naturalWidth*fit,h=img.naturalHeight*fit;
      const focus=currentFocus(item),point=focus||{x:.5,y:.5};
      const x=(rect.width-w)/2+w*point.x,y=(rect.height-h)/2+h*point.y;
      if(motion==='reveal'&&focus){
        const overlay=img.cloneNode();overlay.className='slide-image focus-overlay';overlay.alt='';overlay.setAttribute('aria-hidden','true');
        overlay.style.maskImage=`radial-gradient(ellipse ${Math.max(65,w*.18)}px ${Math.max(85,h*.24)}px at ${x}px ${y}px, black 65%, transparent 100%)`;
        img.parentElement.append(overlay);
        animations.push(img.animate([{opacity:0},{opacity:0,offset:.16},{opacity:1,offset:.58},{opacity:1}],{duration,fill:'both'}));
        animations.push(overlay.animate([{opacity:1},{opacity:1,offset:.35},{opacity:0,offset:.65},{opacity:0}],{duration,fill:'both'}));
      }else{
        img.style.transformOrigin=`${x}px ${y}px`;
        animations.push(img.animate([{transform:'scale(1)'},{transform:'scale(1.07)'}],{duration,fill:'both',easing:'linear'}));
      }
    };
    const saveFocus=(x,y)=>{
      const item=list[index];if(!item?.src||item.type==='history')return;
      localFocus[item.id]={x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))};
      try{localStorage.setItem('sarah-photo-focus',JSON.stringify(localFocus));}catch{}
      render();schedule();focusStatus.textContent='Focus saved on this device. Press Play to see the reveal.';
    };
    stage.addEventListener('click',event=>{
      if(!adjusting)return;const img=stage.querySelector('img');if(!img?.naturalWidth)return;
      const rect=stage.getBoundingClientRect(),fit=Math.min(rect.width/img.naturalWidth,rect.height/img.naturalHeight),w=img.naturalWidth*fit,h=img.naturalHeight*fit;
      saveFocus((event.clientX-rect.left-(rect.width-w)/2)/w,(event.clientY-rect.top-(rect.height-h)/2)/h);
    },options);
    for(const axis of ['x','y'])document.getElementById('focus-'+axis).addEventListener('change',()=>saveFocus(Number(document.getElementById('focus-x').value)/100,Number(document.getElementById('focus-y').value)/100),options);
    document.getElementById('focus-reset').addEventListener('click',()=>{delete localFocus[list[index].id];try{localStorage.setItem('sarah-photo-focus',JSON.stringify(localFocus));}catch{}render();schedule();},options);
    player.querySelector('#slide-motion').addEventListener('change',event=>{motion=event.target.value;render();schedule();},options);
    reduced.addEventListener('change',()=>{render();schedule();},options);
    const advance = delta => {if(!list.length)return;index=(index+delta+list.length)%list.length;render();schedule();};
    const toggle = () => {if(playing)pause();else if(list.length>1){playing=true;playButton.textContent='Pause';if(animations.length)animations.forEach(a=>a.play());else render();schedule();}};
    const leaveFullScreen = async () => {if(document.fullscreenElement===player){try{await document.exitFullscreen();}catch{}}player.classList.remove('pseudo-fullscreen');};
    const fullScreen = async () => {
      if(document.fullscreenElement===player||player.classList.contains('pseudo-fullscreen'))return leaveFullScreen();
      if(player.requestFullscreen){try{await player.requestFullscreen();return;}catch{}}
      player.classList.add('pseudo-fullscreen');Sarah.ui.toast('Expanded view. Use Exit or Escape to leave.');
    };
    player.addEventListener('click',event=>{
      const button=event.target.closest('[data-player]');if(!button)return;
      switch(button.dataset.player){case'focus':adjusting=!adjusting;button.setAttribute('aria-pressed',String(adjusting));render();schedule();break;case'prev':advance(-1);break;case'next':advance(1);break;case'play':toggle();break;case'captions':showCaptions=!showCaptions;caption.hidden=!showCaptions;button.setAttribute('aria-pressed',String(showCaptions));break;case'fullscreen':fullScreen();break;case'reshuffle':list=Sarah.utils.shuffle(list);index=0;render();schedule();break;}
    },options);
    player.querySelector('[data-player-exit]').addEventListener('click',async()=>{pause();if(document.fullscreenElement===player||player.classList.contains('pseudo-fullscreen'))await leaveFullScreen();else location.hash='/slideshow';},options);
    player.querySelector('#slide-speed').addEventListener('change',event=>{duration=Number(event.target.value);render();schedule();},options);
    document.addEventListener('keydown',event=>{
      if(event.altKey||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
      if(event.key==='Escape'){leaveFullScreen();return;}
      if(event.target.tagName==='BUTTON'&&event.code==='Space')return;
      if(event.key==='ArrowLeft'){event.preventDefault();advance(-1);}else if(event.key==='ArrowRight'){event.preventDefault();advance(1);}else if(event.code==='Space'){event.preventDefault();toggle();}
    },options);
    stage.addEventListener('touchstart',event=>{touchX=event.changedTouches[0].clientX;},{...options,passive:true});
    stage.addEventListener('touchend',event=>{if(touchX===null)return;const delta=event.changedTouches[0].clientX-touchX;if(Math.abs(delta)>55)advance(delta<0?1:-1);touchX=null;},{...options,passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){pausedByVisibility=playing;pause();}else if(pausedByVisibility){pausedByVisibility=false;toggle();}},options);
    render();
    return()=>{pause();cancelMotion();scope.abort();leaveFullScreen();};
  };
  Sarah.slideshow={page,mount};
})();
