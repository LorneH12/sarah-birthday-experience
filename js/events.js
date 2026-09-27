/* Event views, calendar exports, and link sharing. All times are Phoenix time. */
(() => {
  'use strict';
  const e=Sarah.utils.escape;
  const card = item => `<article class="event-card ${item.id==='birthday'?'featured':''}"><div class="date-square" aria-label="October ${Number(item.date.slice(-2))}"><small>OCT</small><strong>${Number(item.date.slice(-2))}</strong></div><div><p class="eyebrow">${e(item.day)} · ${e(item.time)}</p><h3>${e(item.title)}</h3><p class="event-meta"><strong>${e(item.venue)}</strong>${e(item.attire)}</p><a class="text-link" href="#/events/${e(item.id)}">View event ${Sarah.ui.icon('arrow')}</a></div></article>`;
  const page = id => {
    const event=SARAH_CONTENT.events.find(item=>item.id===id);
    if(id&&!event)return Sarah.pages.notFound();
    if(!event)return `<div class="wrap page-bottom">${Sarah.ui.heading('October 2–4, 2026 · Tucson, Arizona','A weekend<br>to <em>remember.</em>','Family, history, celebration, and fellowship. Here is where we’ll be, what to wear, and how to be part of it.')}<div class="notice">All times are Tucson local time (America/Phoenix). Please use your family invitation for RSVP details and the private home address.</div><div class="utility-1 section-head"><div class="subnav" aria-label="Filter events"><button aria-pressed="true" data-day="all">All weekend</button><button aria-pressed="false" data-day="Friday">Friday · Oct 2</button><button aria-pressed="false" data-day="Saturday">Saturday · Oct 3</button><button aria-pressed="false" data-day="Sunday">Sunday · Oct 4</button></div><button class="button outline small" data-calendar="all">${Sarah.ui.icon('calendar')} Save weekend</button></div><div id="event-list" class="event-grid">${SARAH_CONTENT.events.map(card).join('')}</div><div class="section"><h2>Make a memory. Share a memory.</h2><p class="utility-2 lead">Send your weekend photos and useful event information to the family. Include the event name so everything finds its place.</p><a class="utility-1 button" href="#/memories/share">Share with the family ${Sarah.ui.icon('arrow')}</a></div><p class="copy-note">Schedule verified against the Eldridge family’s birthday weekend email · September 27, 2026.</p></div>`;
    const map = event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}` : null;
    return `<div class="wrap page-bottom"><a class="back-link" href="#/events">← All weekend events</a>${Sarah.ui.heading(event.day+' · October '+Number(event.date.slice(-2))+', 2026',e(event.title),event.description)}<div class="event-detail"><div><p class="eyebrow">${e(event.subtitle)}</p><h2>${e(event.time)}</h2><p class="utility-3 muted">Tucson local time · America/Phoenix</p><div class="button-row"><button class="button" data-calendar="${e(event.id)}">${Sarah.ui.icon('calendar')} Add to calendar</button><button class="button outline" data-share-event="${e(event.id)}">Share event ↗</button></div><div class="divider"></div><h3>A place for your photographs</h3><p class="utility-4 muted">Photos from this event will be gathered here after family review. Send yours with a name, a date, and a little context.</p><a class="utility-2 text-link" href="#/memories/share?event=${e(event.id)}">Share event photos ${Sarah.ui.icon('arrow')}</a><p class="utility-1 copy-note">Have an update or a question? Use the same form to send it to the family.</p></div><aside class="event-info"><dl><dt>Where</dt><dd>${e(event.venue)}<p>${e(event.address||event.locationNote)}</p>${map?`<a class="text-link" target="_blank" rel="noopener noreferrer" href="${e(map)}">Get directions ↗</a>`:''}</dd><dt>What to wear</dt><dd>${e(event.attire)}<p>${e(event.attireNote)}</p></dd><dt>Last checked</dt><dd>${e(event.updated)}</dd><dt>Event information</dt><dd>From the Eldridge family’s official weekend communication.</dd></dl></aside></div></div>`;
  };
  const bind = main => {
    main.querySelectorAll('[data-day]').forEach(button=>button.addEventListener('click',()=>{
      main.querySelectorAll('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      const matches=SARAH_CONTENT.events.filter(item=>button.dataset.day==='all'||item.day===button.dataset.day);
      main.querySelector('#event-list').innerHTML=matches.map(card).join('');
    }));
    main.querySelectorAll('[data-calendar]').forEach(button=>button.addEventListener('click',()=>{
      const matches=SARAH_CONTENT.events.filter(item=>button.dataset.calendar==='all'||item.id===button.dataset.calendar);
      Sarah.ui.download(Sarah.utils.calendar(matches),'sarah-'+button.dataset.calendar+'.ics','text/calendar;charset=utf-8');
      Sarah.ui.toast('Calendar file prepared. Open it in your calendar app.');
    }));
    main.querySelectorAll('[data-share-event]').forEach(button=>button.addEventListener('click',async()=>{
      const item=SARAH_CONTENT.events.find(item=>item.id===button.dataset.shareEvent);const url=location.href;
      if(navigator.share&&location.protocol!=='file:'){
        try{await navigator.share({title:item.subtitle,text:item.title+' · '+Sarah.utils.dateLabel(item.date)+' · '+item.time+' (Phoenix time)',url});return;}catch(err){if(err.name==='AbortError')return;}
      }
      await Sarah.ui.copy(url);
    }));
  };
  Sarah.events={page,bind,card};
})();
