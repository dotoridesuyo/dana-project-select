/* PC 레이아웃 설정. 숫자만 허용하며 브라우저별로 저장합니다. */
(()=>{
  const STORAGE_KEY='dana-portfolio-layout-v1';
  const projectIds=['rain','leaf','heukryeon','food','halloween','misttrain'];
  const globalFields=[
    ['gutter','PC 좌우 여백',80,20,240],['maxWidth','내용 최대 폭',1280,960,1800],
    ['introPadding','소개 위아래 여백',32,12,120],['sectionGap','소개와 작품 간격',30,8,120],
    ['sidebarWidth','프로젝트 목록 너비',240,180,360],['columnGap','목록과 상세 간격',28,12,100],
    ['stagePadding','상세 안쪽 여백',28,12,80],['cardHeight','프로젝트 카드 높이',116,80,180],
    ['cardGap','카드 사이 간격',12,4,40],['cardTitleSize','카드 제목 글자',17,12,30],['cardNoteSize','카드 설명 글자',10,8,20]
  ].map(([id,label,value,min,max])=>({id,label,value,min,max}));
  const targets=[
    ['brand-name','헤더 이름','.brand strong','projects','text'],['brand-role','헤더 직무','.brand small','projects','text'],
    ['header-caption','헤더 한 줄 소개','.header-caption','projects','text'],
    ['intro-title','소개 제목','#designer-intro-title','projects','text'],['intro-lead','소개 강조 문장','.intro-lead','projects','text'],
    ['intro-description','소개 본문','.intro-copy>p:not(.intro-lead)','projects','text'],['intro-tags','소개 분야','.intro-specialties','projects','box'],
    ['intro-character-title','캐릭터 매력 설계 제목','#intro-character-title','projects','text'],['intro-character-copy','캐릭터 매력 설계 설명','#intro-character-copy','projects','text'],
    ['intro-visual-title','대화·관계 설계 제목','#intro-visual-title','projects','text'],['intro-visual-copy','대화·관계 설계 설명','#intro-visual-copy','projects','text'],
    ['intro-production-title','표현 판단과 소통 제목','#intro-production-title','projects','text'],['intro-production-copy','표현 판단과 소통 설명','#intro-production-copy','projects','text'],
    ['archive-title','프로젝트 목록 제목','#archive-heading','projects','text'],
    ['project-art','대표 이미지 영역','.hero-art','projects','box',true],['art-caption','이미지 아래 문구','.art-caption','projects','text',true],
    ['project-kicker','프로젝트 번호·분야','.project-type','projects','text',true],['project-source','프로젝트 분류','.project-source','projects','text',true],
    ['project-title','프로젝트 제목','#project-title','projects','text',true],['project-english','프로젝트 영문명','.title-en','projects','text',true],
    ['project-hook','프로젝트 강조 문장','.project-hook','projects','text',true],['project-description','프로젝트 설명','.project-description','projects','text',true],
    ['scope-row','기획 범위','.info-row','projects','box',true,0],['structure-row','설계 흐름','.info-row','projects','box',true,1],
    ['project-tags','프로젝트 태그','.project-tags','projects','box',true],['detail-button','자세히 보기 버튼','.detail-button','projects','box',true],
    ['project-note','상세 안내 문구','.preview-note','projects','text',true],
    ['resource-links','추가 링크 버튼 묶음','.resource-links','projects','box',true],
    ['start-cluster','시작 영역 전체','.auto-title-center','start','box'],['start-button','시작 버튼','#start-game','start','box'],
    ['start-label','PORTFOLIO START 글자','#start-game>strong','start','text'],['start-note','시작 안내 문구','#auto-start-note','start','text'],
    ['welcome-role','인사말 직무','.welcome-scene .title-eyebrow','greeting','text'],['welcome-title','인사말 제목','#welcome-title','greeting','text'],
    ['welcome-description','인사말 설명','#welcome-description','greeting','text']
  ].map(([id,label,selector,scene,kind,project=false,index=0])=>({id,label,selector,scene,kind,project,index}));
  const properties={x:[-800,800],y:[-800,800],fontSize:[8,180],lineHeight:[.6,4],letterSpacing:[-5,30],width:[0,1800],height:[0,1200]};
  const defaults=()=>({schema:'dana-portfolio-layout',version:1,globals:Object.fromEntries(globalFields.map(f=>[f.id,f.value])),nodes:{},projects:{}});
  const clone=v=>JSON.parse(JSON.stringify(v));
  function validate(raw){
    if(!raw||raw.schema!=='dana-portfolio-layout'||raw.version!==1)throw Error('이 포트폴리오의 설정 파일이 아닙니다.');
    const result=defaults();
    function number(value,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('설정 숫자가 허용 범위를 벗어났습니다.');return value;}
    for(const f of globalFields)if(Object.hasOwn(raw.globals||{},f.id))result.globals[f.id]=number(raw.globals[f.id],f.min,f.max);
    function nodes(source){const out={};for(const target of targets){const value=source?.[target.id];if(!value)continue;if(typeof value!=='object'||Array.isArray(value))throw Error('요소 설정 형식이 올바르지 않습니다.');const entry={};for(const [key,[min,max]] of Object.entries(properties))if(Object.hasOwn(value,key))entry[key]=number(value[key],min,max);if(Object.keys(entry).length)out[target.id]=entry;}return out;}
    result.nodes=nodes(raw.nodes);
    for(const id of projectIds)if(raw.projects?.[id])result.projects[id]=nodes(raw.projects[id]);
    return result;
  }
  function load(){try{const text=localStorage.getItem(STORAGE_KEY);return text?validate(JSON.parse(text)):defaults();}catch{return defaults();}}
  let current=load();let sheet;
  function currentProject(){const i=Number(document.querySelector('.project-card.active')?.dataset.index||0);return projectIds[i]||projectIds[0];}
  function resolve(id){const target=targets.find(t=>t.id===id);return {...current.nodes[id],...(target?.project?current.projects[currentProject()]?.[id]:{})};}
  function refresh(){
    for(const target of targets){const el=document.querySelectorAll(target.selector)[target.index];if(el)el.dataset.pfEdit=target.id;}
    const g=current.globals;
    let css=`@media(min-width:781px){.shell{width:calc(100% - ${g.gutter*2}px);max-width:${g.maxWidth}px;padding-left:0;padding-right:0}.designer-intro{padding-top:${g.introPadding}px;padding-bottom:${g.introPadding}px}.selection-screen{grid-template-columns:${g.sidebarWidth}px minmax(0,1fr);gap:${g.columnGap}px;padding-top:${g.sectionGap}px}.project-display{padding-left:${g.stagePadding}px;padding-right:${g.stagePadding}px}.project-card{height:${g.cardHeight}px;margin-bottom:${g.cardGap}px}.card-title{font-size:${g.cardTitleSize}px}.card-subtitle{font-size:${g.cardNoteSize}px}`;
    for(const t of targets){const value=resolve(t.id);let rules='';if(value.x!==undefined||value.y!==undefined)rules+=`translate:${value.x||0}px ${value.y||0}px!important;`;if(value.fontSize!==undefined)rules+=`font-size:${value.fontSize}px!important;`;if(value.lineHeight!==undefined)rules+=`line-height:${value.lineHeight}!important;`;if(value.letterSpacing!==undefined)rules+=`letter-spacing:${value.letterSpacing}px!important;`;if(value.width>0)rules+=`width:${value.width}px!important;max-width:none!important;`;if(value.height>0&&t.kind==='box')rules+=`height:${value.height}px!important;min-height:0!important;`;if(rules)css+=`[data-pf-edit="${t.id}"]{${rules}}`;}
    css+='}';
    css+=`@media(min-width:781px) and (max-width:1100px){.shell{width:calc(100% - ${Math.min(g.gutter,24)*2}px)}.selection-screen{grid-template-columns:${Math.min(g.sidebarWidth,220)}px minmax(0,1fr);gap:${Math.min(g.columnGap,20)}px}.project-display{padding-left:${Math.min(g.stagePadding,20)}px;padding-right:${Math.min(g.stagePadding,20)}px}}`;
    if(!sheet){sheet=document.createElement('style');sheet.id='portfolio-custom-layout';document.head.append(sheet);}sheet.textContent=css;
    window.dispatchEvent(new CustomEvent('pf-layout-applied'));
  }
  function apply(raw){current=validate(raw);refresh();return clone(current);}
  function save(raw){const clean=validate(raw);localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));return clean;}
  window.PortfolioLayout={defaults,validate,load,apply,save,refresh,resolve,targets,globalFields,properties,currentProject,storageKey:STORAGE_KEY,get:()=>clone(current)};
  refresh();
})();
