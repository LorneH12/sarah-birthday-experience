/* Hash router, global navigation, focus and lifecycle management. */
(() => {
  'use strict';
  const main=document.getElementById('main'),nav=document.getElementById('main-nav'),menu=document.querySelector('.menu-toggle'),dialog=document.getElementById('photo-dialog');
  const titles={home:'Sarah’s 90th Birthday Weekend',journey:'The Journey','sarah-and-jonas':'Sarah & Jonas',family:'Our Family',slideshow:'Slideshow','sarah-at-90':'Sarah at 90',events:'Birthday Weekend Events',memories:'Stories & Birthday Wishes',explore:'Explore the Archive',about:'About',privacy:'Privacy',credits:'Sources & Credits'};
  let cleanup=()=>{};let firstRender=true;
  const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');};
  const render = () => {
    cleanup();cleanup=()=>{};if(dialog.open)dialog.close();
    const [path,query='']=(location.hash||'#/home').split('?');
    const [section='home',id,sub]=Sarah.utils.routeParts(path);const params=new URLSearchParams(query);
    let html;
    switch(section){
      case'home':html=Sarah.pages.home();break;
      case'journey':html=Sarah.pages.journey(id);break;
      case'sarah-and-jonas':html=Sarah.pages.love(id);break;
      case'family':html=Sarah.pages.family(id);break;
      case'slideshow':html=Sarah.slideshow.page(id,sub||'all');break;
      case'sarah-at-90':html=Sarah.pages.sarah90();break;
      case'events':html=Sarah.events.page(id);break;
      case'memories':html=id==='share'?Sarah.contributions.page(params):Sarah.pages.memories(id);break;
      case'explore':html=Sarah.pages.explore(id||'photos');break;
      case'about':case'privacy':case'credits':html=Sarah.pages.info(section);break;
      default:html=Sarah.pages.notFound();
    }
    main.innerHTML=`<div class="page-enter">${html}</div>`;
    document.title=(titles[section]||'Page not found')+' · Mother Sarah Eldridge';
    nav.querySelectorAll('a').forEach(a=>{if(a.hash==='#/'+section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    closeMenu();window.scrollTo({top:0,behavior:'instant'});
    if(!firstRender)main.focus({preventScroll:true});firstRender=false;
    if(section==='slideshow'&&id)cleanup=Sarah.slideshow.mount(id,sub||'all');
    if(section==='events')Sarah.events.bind(main);
    if(section==='explore')Sarah.pages.bindExplore();
    if(section==='memories'&&id==='share')cleanup=Sarah.contributions.bind();
  };
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  document.addEventListener('click',event=>{
    const photoButton=event.target.closest('[data-photo]');if(photoButton){Sarah.ui.showPhoto(photoButton.dataset.photo);return;}
    const link=event.target.closest('a[href^="#/"]');if(link){closeMenu();if(dialog.open)dialog.close();if(link.hash===location.hash){window.scrollTo({top:0,behavior:'smooth'});}}
    if(!event.target.closest('.site-header'))closeMenu();
  });
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
  window.addEventListener('hashchange',render);window.addEventListener('pagehide',()=>cleanup());
  render();
})();
