const list=document.querySelector('#project-list');
const display=document.querySelector('#project-display');
const detailDialog=document.querySelector('#detail-dialog');
const profileDialog=document.querySelector('#profile-dialog');
const number=i=>String(i+1).padStart(2,'0');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=0;
let detailTrigger=null;
list.innerHTML=projects.map((p,i)=>`<button class="project-card" data-index="${i}" aria-pressed="false" aria-controls="project-display"><span class="card-image" aria-hidden="true"><img src="assets/${p.image}" alt="" loading="${i<3?'eager':'lazy'}"></span><span class="card-label"><b>${number(i)}</b> / ${escapeHTML(p.type)}</span><span class="card-title">${escapeHTML(p.shortTitle)}</span><span class="card-subtitle">${escapeHTML(p.subtitle)}</span><span class="card-check" aria-hidden="true">✦</span></button>`).join('');
function selectProject(index,{scroll=false}={}){
  selected=(index+projects.length)%projects.length;
  const p=projects[selected];
  list.querySelectorAll('.project-card').forEach((card,i)=>{card.classList.toggle('active',i===selected);card.setAttribute('aria-pressed',String(i===selected));});
  document.querySelector('#current-number').textContent=number(selected);
  const stageBackground=document.querySelector('#stage-background');
  stageBackground.dataset.project=p.id;
  stageBackground.style.backgroundImage=p.character===p.background?'none':`url("assets/${p.background}")`;
  display.innerHTML=`<div class="hero-art" aria-hidden="true"><span class="project-roman">${p.roman}</span><div class="art-orbit"></div><span class="art-spark">✧</span>${p.character?`<img class="hero-character ${p.characterClass||''}" src="assets/${p.character}" alt="">${p.id==='halloween'?`<img class="small-ghost" src="assets/portfolio-20261027/baby-ghost.webp" alt="">`:''}`:''}<span class="art-caption">${escapeHTML(p.caption)}</span></div><div class="project-info"><p class="project-type">PROJECT ${number(selected)} — ${escapeHTML(p.type)}</p><div class="project-source">${escapeHTML(p.source)}</div><h2 id="project-title" tabindex="-1">${escapeHTML(p.title).replace(/\n/g,'<br>')}</h2><div class="title-en">${escapeHTML(p.english)}</div><p class="project-hook">${escapeHTML(p.hook).replace(/\n/g,'<br>')}</p><p class="project-description">${escapeHTML(p.description)}</p><div class="info-row"><strong>기획 범위</strong><span>${escapeHTML(p.scope)}</span></div><div class="info-row"><strong>설계 흐름</strong><span>${escapeHTML(p.structure)}</span></div><div class="project-tags">${p.tags.map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div><div class="project-actions"><div class="resource-links" aria-label="프로젝트 관련 링크">${p.links.map(link=>link.url?`<a class="resource-link" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(link.label)} (새 탭)"><span>${escapeHTML(link.label)}</span><span aria-hidden="true">↗</span></a>`:`<button class="resource-link" disabled><span>${escapeHTML(link.label)}</span><span class="resource-pending">준비 중</span></button>`).join('')}</div><button class="detail-button" id="open-detail"><span>자세히 보기</span><span aria-hidden="true">↗</span></button></div><p class="preview-note">포트폴리오 이미지 ${p.pages.length}장</p></div>`;
  document.querySelector('#open-detail').addEventListener('click',openDetail);
  document.title=`${p.shortTitle} · 게임 기획자 김단아`;
  window.PortfolioLayout?.refresh();
  window.dispatchEvent(new CustomEvent('pf-project-change',{detail:{id:p.id}}));
  if(scroll)list.querySelector(`[data-index="${selected}"]`).scrollIntoView({block:'nearest',inline:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
list.addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b)selectProject(Number(b.dataset.index));});
list.addEventListener('keydown',e=>{
  const card=e.target.closest('[data-index]');if(!card)return;
  let next;
  if(e.key==='ArrowDown'||e.key==='ArrowRight')next=selected+1;
  if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=selected-1;
  if(e.key==='Home')next=0;
  if(e.key==='End')next=projects.length-1;
  if(next===undefined)return;
  e.preventDefault();selectProject(next,{scroll:true});list.querySelector(`[data-index="${selected}"]`).focus({preventScroll:true});
});
document.querySelector('#previous-project').addEventListener('click',()=>selectProject(selected-1,{scroll:true}));
document.querySelector('#next-project').addEventListener('click',()=>selectProject(selected+1,{scroll:true}));
function openDetail(e){
  const p=projects[selected];detailTrigger=e.currentTarget;
  document.querySelector('#dialog-title').textContent=p.shortTitle;
  document.querySelector('#gallery-summary').textContent=`포트폴리오 ${p.pages[0].number}–${p.pages.at(-1).number}페이지 · ${p.pages.length}장`;
  detailDialog.classList.remove('is-zoomed');
  const zoom=document.querySelector('#gallery-zoom');zoom.setAttribute('aria-pressed','false');zoom.textContent='확대 보기';
  document.querySelector('#detail-content').innerHTML=p.pages.map((page,i)=>`<figure class="gallery-page"><figcaption><span>${number(i)} / ${number(p.pages.length-1)}</span><span>${escapeHTML(page.title)}</span><span>P.${page.number}</span></figcaption><div class="gallery-page-viewport"><img src="${escapeHTML(page.image)}" alt="${escapeHTML(p.shortTitle)} — ${escapeHTML(page.title)}, 포트폴리오 ${page.number}페이지" width="1920" height="1080" loading="${i===0?'eager':'lazy'}" decoding="async"></div></figure>`).join('');
  detailDialog.showModal();detailDialog.scrollTop=0;document.querySelector('#close-detail').focus();
}
document.querySelector('#gallery-zoom').addEventListener('click',e=>{
  const zoomed=detailDialog.classList.toggle('is-zoomed');
  e.currentTarget.setAttribute('aria-pressed',String(zoomed));e.currentTarget.textContent=zoomed?'화면에 맞추기':'확대 보기';
});

document.querySelector('#close-detail').addEventListener('click',()=>detailDialog.close());
detailDialog.addEventListener('close',()=>detailTrigger?.focus({preventScroll:true}));
document.querySelector('#open-profile').addEventListener('click',()=>{profileDialog.showModal();document.querySelector('#close-profile').focus();});
document.querySelector('#close-profile').addEventListener('click',()=>profileDialog.close());
profileDialog.addEventListener('close',()=>document.querySelector('#open-profile').focus({preventScroll:true}));
for(const dialog of [detailDialog,profileDialog])dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
selectProject(0);

// R110: GAME START → 눌림 효과 → 인사말 → 사이트 자동 진입.
const titleScreen=document.querySelector('#title-screen');
const startScene=document.querySelector('#start-scene');
const welcomeScene=document.querySelector('#welcome-scene');
const startGame=document.querySelector('#start-game');
const introTimers=new Set();
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function clearIntroTimers(){for(const timer of introTimers)clearTimeout(timer);introTimers.clear();}
function scheduleIntro(callback,delay){const timer=setTimeout(()=>{introTimers.delete(timer);callback();},delay);introTimers.add(timer);}
function openTitle({auto=true}={}){
  clearIntroTimers();
  if(titleScreen.open)titleScreen.close();
  titleScreen.dataset.phase='ready';
  startScene.inert=false;startScene.setAttribute('aria-hidden','false');
  welcomeScene.inert=true;welcomeScene.setAttribute('aria-hidden','true');
  document.body.classList.add('at-title');
  document.body.classList.remove('portfolio-entered');
  document.title='김단아 · 게임 기획자 포트폴리오';
  titleScreen.showModal();
  startGame.focus({preventScroll:true});
  if(auto)scheduleIntro(playStart,reducedMotion.matches?650:950);
}
function playStart(){
  if(!titleScreen.open||titleScreen.dataset.phase!=='ready')return;
  clearIntroTimers();
  titleScreen.dataset.phase='pressing';
  scheduleIntro(()=>{
    titleScreen.dataset.phase='greeting';
    startScene.inert=true;startScene.setAttribute('aria-hidden','true');
    welcomeScene.inert=false;welcomeScene.setAttribute('aria-hidden','false');
    document.querySelector('#welcome-title').focus({preventScroll:true});
    scheduleIntro(()=>{
      titleScreen.dataset.phase='leaving';
      scheduleIntro(enterPortfolio,reducedMotion.matches?0:420);
    },reducedMotion.matches?1200:1750);
  },reducedMotion.matches?100:330);
}
function enterPortfolio(){
  clearIntroTimers();
  titleScreen.dataset.phase='complete';
  titleScreen.close();
  document.body.classList.remove('at-title');
  document.body.classList.add('portfolio-entered');
  window.scrollTo({top:0,behavior:'instant'});
  document.querySelector('#designer-intro-title').focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('pf-scene-change',{detail:{scene:'projects'}}));
}
startGame.addEventListener('click',playStart);
document.querySelector('#skip-intro').addEventListener('click',enterPortfolio);
document.querySelector('#open-title').addEventListener('click',openTitle);
titleScreen.addEventListener('cancel',e=>{e.preventDefault();enterPortfolio();});
const editorPreview=new URLSearchParams(location.search).has('layoutPreview');
window.PortfolioPreview={
  selectProject:index=>selectProject(index),
  showScene(scene){
    if(scene==='projects'){enterPortfolio();return;}
    openTitle({auto:scene==='play'});
    if(scene==='greeting'){
      titleScreen.dataset.phase='greeting';
      startScene.inert=true;startScene.setAttribute('aria-hidden','true');
      welcomeScene.inert=false;welcomeScene.setAttribute('aria-hidden','false');
    }
    window.dispatchEvent(new CustomEvent('pf-scene-change',{detail:{scene}}));
  }
};
if(editorPreview)enterPortfolio();else openTitle();

