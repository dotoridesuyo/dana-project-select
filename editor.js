'use strict';
(()=>{
  const L=window.PortfolioLayout,$=s=>document.querySelector(s),clone=v=>JSON.parse(JSON.stringify(v));
  const frame=$('#editor-preview');let model=L.load(),saved=JSON.stringify(L.validate(model)),history=[clone(model)],historyIndex=0;
  let selectedId='intro-title',scene='projects',picking=true,playback=false,restorePicking=true,drag=null,frameDoc=null,frameWin=null,box=null;
  const mobile=()=>$('#viewport-select').value.startsWith('390,');
  const target=()=>L.targets.find(t=>t.id===selectedId);
  const element=()=>frameDoc?.querySelector(`[data-pf-edit="${selectedId}"]`);
  const projectId=()=>frameWin?.PortfolioLayout.currentProject()||'misttrain';
  const canonical=()=>JSON.stringify(L.validate(model));
  function message(text,error=false){$('#editor-status').textContent=text;$('#editor-status').classList.toggle('error',error);}
  function dirty(){const key=canonical(),changed=key!==saved,pending=key!==JSON.stringify(history[historyIndex]);$('#dirty-indicator').textContent=changed?'저장되지 않은 변경':'저장됨';$('#undo').disabled=historyIndex===0&&!pending;$('#redo').disabled=historyIndex===history.length-1||pending;return changed;}
  function commit(){const clean=L.validate(model);if(JSON.stringify(clean)!==JSON.stringify(history[historyIndex])){history=history.slice(0,historyIndex+1);history.push(clone(clean));if(history.length>60)history.shift();historyIndex=history.length-1;}dirty();}
  function apply(){if(!frameWin?.PortfolioLayout)return;frameWin.PortfolioLayout.apply(model);refreshInspector();dirty();}
  function bucket(create=false){if(target()?.project&&$('#scope-select').value==='project'){const id=projectId();if(create)model.projects[id]||={};return model.projects[id];}return model.nodes;}
  function writeProperty(key,value){const limits=L.properties[key];if(!limits||!Number.isFinite(value))return;value=Math.max(limits[0],Math.min(limits[1],value));const b=bucket(true);b[selectedId]||={};b[selectedId][key]=Math.round(value*100)/100;}
  function effective(){return frameWin?.PortfolioLayout.resolve(selectedId)||{};}
  function refreshInspector(){
    const t=target(),el=element(),enabled=!!el&&picking&&!mobile();
    $('#node-fields').disabled=!enabled;$('#reset-node').disabled=!enabled;$('#height-field').hidden=t?.kind!=='box';
    const regionOnly=['start-button','start-cluster','project-art','project-tags','intro-tags'].includes(selectedId);for(const id of ['font-slider','node-fontSize','node-lineHeight','node-letterSpacing'])$(`#${id}`).disabled=regionOnly;
    $('#scope-wrap').hidden=!t?.project;$('#element-select').value=selectedId;
    $('#selection-help').textContent=mobile()?'모바일은 미리보기입니다. PC 크기를 선택하면 편집할 수 있습니다.':!picking?'미리보기 중입니다. 편집으로 돌아오면 요소를 선택할 수 있습니다.':`${t?.label||'요소'} · ${t?.project&&$('#scope-select').value==='project'?'현재 작품만 수정':'공통 설정'}${regionOnly?' · 글자 크기는 글자를 직접 선택해 조절하세요.':''}`;
    if(el){const cs=frameWin.getComputedStyle(el),v=effective(),font=parseFloat(cs.fontSize)||16;const values={x:v.x||0,y:v.y||0,fontSize:v.fontSize??font,lineHeight:v.lineHeight??((parseFloat(cs.lineHeight)||font*1.6)/font),letterSpacing:v.letterSpacing??(parseFloat(cs.letterSpacing)||0),width:v.width||0,height:v.height||0};for(const [key,value] of Object.entries(values)){const input=$(`#node-${key}`);if(document.activeElement!==input)input.value=String(Math.round(value*100)/100);}if(document.activeElement!==$('#font-slider'))$('#font-slider').value=String(values.fontSize);}
    for(const f of L.globalFields){const input=$(`[data-global="${f.id}"]`);if(input&&document.activeElement!==input)input.value=model.globals[f.id];}
    $('#global-fields').disabled=!picking||mobile();document.body.classList.toggle('mobile-readonly',mobile());document.body.classList.toggle('previewing',!picking);$('#preview-toggle').textContent=picking?'미리보기':'편집으로';$('#preview-toggle').setAttribute('aria-pressed',String(!picking));
    $('#canvas-hint').textContent=mobile()?'모바일 배치는 기존 반응형 화면을 보여줍니다. PC 설정은 모바일에 적용되지 않습니다.':!picking?'미리보기 중입니다. 버튼과 프로젝트를 직접 눌러 동작을 확인할 수 있습니다.':'글자를 클릭해 선택하고 드래그하세요. 모서리 손잡이로 크기를 조절할 수 있습니다.';
    frameDoc?.documentElement.classList.toggle('pf-edit-surface',picking&&!mobile());updateBox();
  }
  function updateBox(){
    if(!box||!frameDoc)return;const el=element();
    if(!el||!picking||mobile()||frameWin.getComputedStyle(el).visibility==='hidden'||!el.getClientRects().length){box.style.display='none';return;}
    const host=frameDoc.querySelector('#title-screen[open]')||frameDoc.body;if(box.parentNode!==host)host.append(box);
    const r=el.getBoundingClientRect();box.style.display='block';Object.assign(box.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});box.querySelector('.pf-selection-name').textContent=target()?.label||selectedId;
  }
  function select(id,{scroll=false}={}){
    const t=L.targets.find(t=>t.id===id);if(!t)return;if(t.scene!==scene){scene=t.scene;$('#scene-select').value=scene;frameWin?.PortfolioPreview.showScene(scene);}
    selectedId=id;refreshInspector();if(scroll)element()?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});updateBox();
  }
  function beginDrag(e,mode='move'){
    if(!picking||mobile()||e.button!==0||!element())return;
    e.preventDefault();e.stopPropagation();const el=element(),v=effective(),r=el.getBoundingClientRect();drag={pointer:e.pointerId,mode,startX:e.clientX,startY:e.clientY,x:v.x||0,y:v.y||0,width:r.width,height:r.height,capture:e.currentTarget===frameDoc?el:e.currentTarget};
    try{drag.capture.setPointerCapture(e.pointerId);}catch{}
    frameDoc.documentElement.style.cursor=mode==='resize'?'nwse-resize':'grabbing';
  }
  function moveDrag(e){
    if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();let dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(e.shiftKey&&drag.mode==='move'){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;}
    const round=n=>$('#snap-grid').checked?Math.round(n/8)*8:Math.round(n);
    if(drag.mode==='move'){writeProperty('x',round(drag.x+dx));writeProperty('y',round(drag.y+dy));}else{writeProperty('width',Math.max(30,round(drag.width+dx)));if(target()?.kind==='box')writeProperty('height',Math.max(20,round(drag.height+dy)));}
    apply();message(`${target().label} ${drag.mode==='move'?'위치':'크기'} 조정 중`);
  }
  function endDrag(e){if(!drag||e.pointerId!==drag.pointer)return;try{drag.capture.releasePointerCapture(e.pointerId);}catch{}drag=null;frameDoc.documentElement.style.cursor='';commit();message('변경했습니다. 저장하거나 되돌릴 수 있습니다.');}
  function keydown(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,textarea,select')){e.preventDefault();e.shiftKey?redo():undo();return;}
    if(!picking||mobile()||!element()||e.target.closest('input,textarea,select,button,a'))return;
    const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!d)return;e.preventDefault();e.stopImmediatePropagation();const v=effective(),step=e.shiftKey?10:1;writeProperty('x',(v.x||0)+d[0]*step);writeProperty('y',(v.y||0)+d[1]*step);apply();commit();message('방향키로 위치를 조절했습니다.');
  }
  function attachFrame(){
    try{frameWin=frame.contentWindow;frameDoc=frame.contentDocument;if(!frameWin.PortfolioPreview||!frameWin.PortfolioLayout)throw Error('미리보기 파일을 불러오지 못했습니다.');
      const style=frameDoc.createElement('style');style.textContent=`.pf-edit-surface [data-pf-edit]{cursor:grab!important}.pf-edit-surface *, .pf-edit-surface *:before,.pf-edit-surface *:after{animation:none!important;transition:none!important}.pf-edit-surface [data-pf-edit]:hover{outline:1px dashed #e4c99b77;outline-offset:3px}#pf-selection{position:fixed;z-index:2147483646;border:1px solid #e5c99a;pointer-events:none;box-sizing:border-box;background:transparent}#pf-selection .pf-selection-name{position:absolute;left:-1px;top:-25px;height:24px;display:flex;align-items:center;padding:0 8px;background:#e4c99b;color:#282332;font:10px sans-serif;white-space:nowrap;pointer-events:auto;cursor:grab}#pf-selection .pf-resize{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;background:#f1d6a9;border:2px solid #292432;border-radius:2px;pointer-events:auto;cursor:nwse-resize}`;frameDoc.head.append(style);
      box=frameDoc.createElement('div');box.id='pf-selection';box.setAttribute('aria-hidden','true');box.innerHTML='<span class="pf-selection-name"></span><span class="pf-resize" title="너비와 크기 조절"></span>';frameDoc.body.append(box);
      box.querySelector('.pf-selection-name').addEventListener('pointerdown',e=>beginDrag(e,'move'));box.querySelector('.pf-resize').addEventListener('pointerdown',e=>beginDrag(e,'resize'));
      frameDoc.addEventListener('pointerdown',e=>{if(e.target.closest('#pf-selection')||!picking||mobile())return;const item=e.target.closest('[data-pf-edit]');if(!item)return;selectedId=item.dataset.pfEdit;refreshInspector();beginDrag(e);},true);
      frameDoc.addEventListener('pointermove',moveDrag,true);frameDoc.addEventListener('pointerup',endDrag,true);frameDoc.addEventListener('pointercancel',endDrag,true);
      frameDoc.addEventListener('click',e=>{if(picking&&!mobile()&&(e.target.closest('[data-pf-edit],a,#open-title,#open-profile,#skip-intro'))){e.preventDefault();e.stopImmediatePropagation();}},true);
      frameDoc.addEventListener('keydown',keydown,true);frameDoc.addEventListener('scroll',updateBox,true);frameWin.addEventListener('resize',updateBox);frameWin.addEventListener('pf-layout-applied',updateBox);
      frameWin.addEventListener('pf-project-change',()=>{$('#project-select').value=String(frameDoc.querySelector('.project-card.active')?.dataset.index||0);refreshInspector();});
      frameWin.addEventListener('pf-scene-change',e=>{if(e.detail.scene==='projects'&&playback){playback=false;picking=restorePicking;scene='projects';$('#scene-select').value=scene;selectedId='intro-title';refreshInspector();message('자동 전환 재생을 마쳤습니다.');}});
      frameWin.PortfolioLayout.apply(model);frameWin.PortfolioPreview.showScene(scene);$('#loading').hidden=true;resizePreview();refreshInspector();message('글자나 영역을 선택해 드래그하세요.');
    }catch(error){message(error.message,true);$('#loading').textContent='미리보기를 열지 못했습니다. 페이지를 새로고침해 주세요.';}
  }
  function resizePreview(){const [w,h]=$('#viewport-select').value.split(',').map(Number),requested=$('#zoom-select').value;const available=Math.max(260,$('#canvas-scroll').clientWidth-52);const scale=requested==='fit'?Math.min(1,available/w):Number(requested);Object.assign(frame.style,{width:`${w}px`,height:`${h}px`,transform:`scale(${scale})`});Object.assign($('#preview-positioner').style,{width:`${w*scale}px`,height:`${h*scale}px`});$('#zoom-label').textContent=`${w} × ${h} · ${Math.round(scale*100)}%`;refreshInspector();}
  function undo(){commit();if(historyIndex<=0)return;model=clone(history[--historyIndex]);apply();message('이전 상태로 되돌렸습니다.');}
  function redo(){if(historyIndex>=history.length-1)return;model=clone(history[++historyIndex]);apply();message('다시 실행했습니다.');}
  $('#element-select').innerHTML=['projects','start','greeting'].map(s=>`<optgroup label="${{projects:'소개·프로젝트',start:'시작 화면',greeting:'인사말'}[s]}">${L.targets.filter(t=>t.scene===s).map(t=>`<option value="${t.id}">${t.label}</option>`).join('')}</optgroup>`).join('');
  $('#global-fields').innerHTML=L.globalFields.map(f=>`<label class="global-field">${f.label}<div><input aria-label="${f.label}" data-global="${f.id}" type="number" min="${f.min}" max="${f.max}" value="${model.globals[f.id]}"><span>px</span></div></label>`).join('');
  $('#element-select').addEventListener('change',e=>select(e.target.value,{scroll:true}));$('#scope-select').addEventListener('change',refreshInspector);
  document.querySelectorAll('[data-property]').forEach(input=>{input.addEventListener('input',()=>{if(input.value.trim()==='')return;writeProperty(input.dataset.property,Number(input.value));apply();message('선택 요소를 조정했습니다.');});input.addEventListener('change',commit);input.addEventListener('blur',commit);});
  $('#font-slider').addEventListener('input',e=>{writeProperty('fontSize',Number(e.target.value));apply();message('글자 크기를 조절했습니다.');});$('#font-slider').addEventListener('change',commit);
  document.querySelectorAll('[data-global]').forEach(input=>{input.addEventListener('input',()=>{if(input.value.trim()==='')return;const f=L.globalFields.find(f=>f.id===input.dataset.global);model.globals[f.id]=Math.max(f.min,Math.min(f.max,Number(input.value)||f.value));apply();message('PC 전체 배치를 조절했습니다.');});input.addEventListener('change',commit);input.addEventListener('blur',commit);});
  $('#scene-select').addEventListener('change',e=>{scene=e.target.value;selectedId={projects:'intro-title',start:'start-button',greeting:'welcome-title'}[scene];frameWin?.PortfolioPreview.showScene(scene);refreshInspector();});
  $('#project-select').addEventListener('change',e=>frameWin?.PortfolioPreview.selectProject(Number(e.target.value)));
  $('#viewport-select').addEventListener('change',resizePreview);$('#zoom-select').addEventListener('change',resizePreview);new ResizeObserver(resizePreview).observe($('#canvas-scroll'));
  $('#preview-toggle').addEventListener('click',()=>{picking=!picking;refreshInspector();message(picking?'편집 모드로 돌아왔습니다.':'실제 동작을 확인하는 미리보기입니다.');});
  $('#play-intro').addEventListener('click',()=>{restorePicking=picking;picking=false;playback=true;frameWin?.PortfolioPreview.showScene('play');refreshInspector();message('시작 버튼 → 인사말 → 사이트 전환을 재생합니다.');});
  $('#undo').addEventListener('click',undo);$('#redo').addEventListener('click',redo);document.addEventListener('keydown',keydown);
  $('#reset-node').addEventListener('click',()=>{const b=bucket();if(b)delete b[selectedId];apply();commit();message('선택 요소를 기본값으로 되돌렸습니다.');});
  $('#reset-all').addEventListener('click',()=>{model=L.defaults();apply();commit();message('전체 기본값으로 되돌렸습니다. 되돌리기로 복구할 수 있습니다.');});
  $('#save-layout').addEventListener('click',()=>{try{commit();model=L.save(model);saved=canonical();dirty();message('이 브라우저에 저장했습니다. 사이트를 다시 열어도 유지됩니다.');}catch{message('브라우저 저장이 제한돼 있습니다. 설정 내보내기로 보관해 주세요.',true);}});
  $('#export-layout').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(L.validate(model),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='portfolio-layout.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('설정 파일을 내보냈습니다. 다른 브라우저에서 불러올 수 있습니다.');});
  $('#import-layout').addEventListener('click',()=>$('#import-file').click());$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('설정 파일이 너무 큽니다.');model=L.validate(JSON.parse(await file.text()));apply();commit();message('설정을 불러왔습니다. 유지하려면 이 브라우저에 저장하세요.');}catch(error){message(`불러오지 못했습니다: ${error.message}`,true);}finally{e.target.value='';}});
  frame.addEventListener('load',attachFrame);if(frame.contentDocument?.readyState==='complete')attachFrame();
  window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
  dirty();
})();
