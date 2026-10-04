const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const STORAGE_KEY="roman_atolyesi_v1";

const fontMap={
  georgia:'Georgia, serif',
  palatino:'"Palatino Linotype","Book Antiqua",Palatino,serif',
  times:'"Times New Roman",Times,serif',
  sans:'system-ui,-apple-system,"Segoe UI",sans-serif',
  mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'
};
const fontNames={georgia:"Georgia",palatino:"Palatino",times:"Times",sans:"Modern",mono:"Daktilo"};
const typingNames={off:"Kapalı",typewriter:"Daktilo",pencil:"Kalem",fountain:"Mürekkep"};
const flipNames={realistic:"Gerçekçi 3D",soft:"Yumuşak 3D",slide:"Kaydır"};

const fresh=()=>{
  const id="c_"+Date.now();
  return{
    bookTitle:"Adsız Roman",mode:"night",ambience:"library",paper:"antique",
    font:"georgia",fontSize:19,readerLayout:"single",flipStyle:"realistic",
    typingSound:"off",typingVolume:.18,activeId:id,
    chapters:[{id,title:"Bölüm 1",content:""}]
  };
};

let state;
try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
  state=saved&&saved.chapters?.length?saved:fresh();
}catch{state=fresh();}

/* Eski sürümlerden güvenli geçiş. Roman metni ve bölüm ID'leri korunur. */
state.mode=state.mode||"night";
state.ambience=state.ambience||(["rain","candle","library"].includes(state.theme)?state.theme:"library");
state.paper=state.paper||"antique";
state.font=state.font||"georgia";
state.fontSize=Number(state.fontSize)||19;
state.readerLayout=state.readerLayout||"single";
state.flipStyle=state.flipStyle||"realistic";
state.typingSound=state.typingSound||"off";
state.typingVolume=Number.isFinite(Number(state.typingVolume))?Number(state.typingVolume):.18;

const active=()=>state.chapters.find(x=>x.id===state.activeId)||state.chapters[0];
const words=t=>((t||"").trim()?(t||"").trim().split(/\s+/).length:0);
const esc=s=>(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

let saveTimer;
function saveSoon(){
  $("#saveState").textContent="Kaydediliyor…";
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveNow,260);
}
function saveNow(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  $("#saveState").textContent="Kaydedildi";
}
function totalWords(){return state.chapters.reduce((sum,c)=>sum+words(c.content),0);}

function applyAppearance(){
  document.body.dataset.mode=state.mode;
  document.body.dataset.ambience=state.ambience;
  document.body.dataset.paper=state.paper;
  document.documentElement.style.setProperty("--book-font",fontMap[state.font]||fontMap.georgia);
  document.documentElement.style.setProperty("--book-font-size",`${state.fontSize}px`);
  $("#modeBtn").textContent=state.mode==="night"?"☀":"☾";
  $("#modeBtn").setAttribute("aria-label",state.mode==="night"?"Gündüz moduna geç":"Gece moduna geç");
  $("#fontSize").value=state.fontSize;
  $("#fontSizeValue").textContent=`${state.fontSize} px`;
  $("#typingVolume").value=state.typingVolume;
  $("#typingSoundIndicator").textContent=`Yazma sesi: ${typingNames[state.typingSound]||"Kapalı"}`;
  $("#homeReaderMode").textContent=`${state.readerLayout==="single"?"Tek sayfa":"Çift sayfa"} · ${flipNames[state.flipStyle]||"Gerçekçi 3D"}`;
  $("#layoutBtn").textContent=state.readerLayout==="single"?"▣ Tek sayfa":"▥ Çift sayfa";

  $$('[data-mode-choice]').forEach(b=>b.classList.toggle("selected",b.dataset.modeChoice===state.mode));
  $$('[data-reader-layout]').forEach(b=>b.classList.toggle("selected",b.dataset.readerLayout===state.readerLayout));
  $$('[data-flip-style]').forEach(b=>b.classList.toggle("selected",b.dataset.flipStyle===state.flipStyle));
  $$('[data-paper]').forEach(b=>b.classList.toggle("selected",b.dataset.paper===state.paper));
  $$('[data-font]').forEach(b=>b.classList.toggle("selected",b.dataset.font===state.font));
  $$('[data-ambience]').forEach(b=>b.classList.toggle("selected",b.dataset.ambience===state.ambience));
  $$('[data-typing-sound]').forEach(b=>b.classList.toggle("selected",b.dataset.typingSound===state.typingSound));

  const book=$("#readerBook");
  book.classList.toggle("layout-single",state.readerLayout==="single");
  book.classList.toggle("layout-spread",state.readerLayout==="spread");
  book.classList.remove("flip-realistic","flip-soft","flip-slide");
  book.classList.add(`flip-${state.flipStyle}`);
}

function updateStats(){
  const t=$("#editor").value||"";
  $("#stats").textContent=`${words(t)} kelime · ${t.length} karakter`;
}
function updateHome(){
  const c=active();
  $("#coverTitle").textContent=state.bookTitle||"Adsız Roman";
  $("#homeSummary").textContent=`${state.chapters.length} bölüm · ${totalWords()} kelime`;
  $("#totalWords").textContent=`${totalWords()} kelime`;
  $("#chapterCount").textContent=`${state.chapters.length} bölüm`;
  $("#lastChapterTitle").textContent=c.title||"Adsız bölüm";
  $("#lastChapterWords").textContent=`${words(c.content)} kelime`;
  $("#homeReaderMode").textContent=`${state.readerLayout==="single"?"Tek sayfa":"Çift sayfa"} · ${flipNames[state.flipStyle]||"Gerçekçi 3D"}`;
}

function renderList(){
  const host=$("#chapterList");host.innerHTML="";
  state.chapters.forEach((c,i)=>{
    const row=document.createElement("div");
    row.className="chapter-row"+(c.id===state.activeId?" active":"");
    row.innerHTML=`
      <div class="chapter-info"><strong>${esc(c.title||`Bölüm ${i+1}`)}</strong><small>${words(c.content||"")} kelime</small></div>
      <button type="button" class="rename" aria-label="Bölüm adını düzenle">✎</button>
      <button type="button" class="delete" aria-label="Bölümü sil">⋮</button>`;
    row.querySelector(".chapter-info").onclick=()=>{state.activeId=c.id;saveNow();render();closeDrawer();openView("editor");};
    row.querySelector(".rename").onclick=e=>{
      e.stopPropagation();
      const name=prompt("Yeni bölüm adı:",c.title||`Bölüm ${i+1}`);
      if(name===null)return;
      const title=name.trim();
      if(!title){showToast("Bölüm adı boş olamaz.");return;}
      c.title=title;
      if(state.activeId===c.id)$("#chapterTitle").value=title;
      saveNow();renderList();updateHome();showToast("Bölüm adı değiştirildi.");
    };
    row.querySelector(".delete").onclick=e=>{
      e.stopPropagation();
      if(state.chapters.length===1){showToast("En az bir bölüm kalmalı.");return;}
      if(confirm(`"${c.title}" silinsin mi?`)){
        state.chapters=state.chapters.filter(x=>x.id!==c.id);
        if(state.activeId===c.id)state.activeId=state.chapters[0].id;
        saveNow();render();
      }
    };
    host.appendChild(row);
  });
}

function render(){
  applyAppearance();
  $("#bookTitle").value=state.bookTitle||"Adsız Roman";
  const c=active();state.activeId=c.id;
  $("#chapterTitle").value=c.title||"";
  $("#editor").value=c.content||"";
  renderList();updateStats();updateHome();
}
function showToast(s){
  const x=$("#toast");x.textContent=s;x.classList.add("show");
  clearTimeout(showToast.t);showToast.t=setTimeout(()=>x.classList.remove("show"),1700);
}
function openDrawer(){$("#drawer").classList.add("open");$("#scrim").classList.add("show");}
function closeDrawer(){$("#drawer").classList.remove("open");$("#scrim").classList.remove("show");}
function openSheet(id){$(id).classList.add("show");}
function closeSheets(){$$(".sheet").forEach(x=>x.classList.remove("show"));}

function openView(name){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $$(".bottom-nav [data-view-target]").forEach(b=>b.classList.remove("active"));
  const view=name==="home"?"#homeView":name==="editor"?"#editorView":"#readerView";
  $(view).classList.add("active");
  const tab=$(`.bottom-nav [data-view-target="${name}"]`);if(tab)tab.classList.add("active");
  if(name==="reader"){buildReaderPages();renderReader();}
  if(name==="home")updateHome();
  window.scrollTo({top:0,behavior:"smooth"});
}

$("#bookTitle").oninput=e=>{state.bookTitle=e.target.value;$("#coverTitle").textContent=state.bookTitle||"Adsız Roman";saveSoon();};
$("#chapterTitle").oninput=e=>{active().title=e.target.value;saveSoon();renderList();updateHome();};
$("#editor").oninput=e=>{active().content=e.target.value;saveSoon();updateStats();renderList();updateHome();};
$("#homeBtn").onclick=()=>openView("home");
$("#chaptersBtn").onclick=openDrawer;$("#closeDrawer").onclick=closeDrawer;$("#scrim").onclick=closeDrawer;
$("#newChapter").onclick=()=>{
  const id="c_"+Date.now();state.chapters.push({id,title:`Bölüm ${state.chapters.length+1}`,content:""});
  state.activeId=id;saveNow();render();closeDrawer();openView("editor");setTimeout(()=>$("#editor").focus(),120);
};
$("#focusBtn").onclick=()=>{document.body.classList.toggle("focus");showToast(document.body.classList.contains("focus")?"Odak modu açık.":"Odak modu kapalı.");};
$("#modeBtn").onclick=()=>{state.mode=state.mode==="night"?"day":"night";saveNow();applyAppearance();};
$$("[data-view-target]").forEach(b=>b.onclick=()=>openView(b.dataset.viewTarget));
$("#continueBtn").onclick=()=>openView("editor");$("#readBookBtn").onclick=()=>openView("reader");

$("#appearanceBtn").onclick=()=>openSheet("#appearanceSheet");
$("#homeAppearanceBtn").onclick=()=>openSheet("#appearanceSheet");
$("#readerAppearanceBtn").onclick=()=>openSheet("#appearanceSheet");
$("#soundBtn").onclick=()=>openSheet("#soundSheet");
$$(".close-sheet").forEach(b=>b.onclick=closeSheets);
$$(".sheet").forEach(s=>s.onclick=e=>{if(e.target===s)closeSheets();});

$$("[data-mode-choice]").forEach(b=>b.onclick=()=>{state.mode=b.dataset.modeChoice;saveNow();applyAppearance();});
$$("[data-reader-layout]").forEach(b=>b.onclick=()=>{state.readerLayout=b.dataset.readerLayout;saveNow();applyAppearance();buildReaderPages();renderReader();});
$$("[data-flip-style]").forEach(b=>b.onclick=()=>{state.flipStyle=b.dataset.flipStyle;saveNow();applyAppearance();});
$$("[data-paper]").forEach(b=>b.onclick=()=>{state.paper=b.dataset.paper;saveNow();applyAppearance();});
$$("[data-font]").forEach(b=>b.onclick=()=>{state.font=b.dataset.font;saveNow();applyAppearance();if($("#readerView").classList.contains("active")){buildReaderPages();renderReader();}});
$$("[data-ambience]").forEach(b=>b.onclick=()=>{state.ambience=b.dataset.ambience;saveNow();applyAppearance();});
$("#fontSize").oninput=e=>{state.fontSize=Number(e.target.value);$("#fontSizeValue").textContent=`${state.fontSize} px`;document.documentElement.style.setProperty("--book-font-size",`${state.fontSize}px`);};
$("#fontSize").onchange=()=>{saveNow();if($("#readerView").classList.contains("active")){buildReaderPages();renderReader();}};
$("#layoutBtn").onclick=()=>{state.readerLayout=state.readerLayout==="single"?"spread":"single";saveNow();applyAppearance();buildReaderPages();renderReader();};

/* ---------- Sayfalama ---------- */
let readerPages=[];
let readerIndex=0;
let resizeTimer;

function charsPerPage(){
  const w=window.innerWidth;
  const font=state.fontSize;
  if(state.readerLayout==="spread"){
    const pageWidth=Math.min(w*.48,490);
    const pageHeight=Math.min(window.innerHeight*.72,760);
    const charsPerLine=Math.max(22,pageWidth/(font*.56));
    const lines=Math.max(14,pageHeight/(font*1.78)-5);
    return Math.max(380,Math.floor(charsPerLine*lines*.88));
  }
  const pageWidth=Math.min(w*.92,650);
  const pageHeight=Math.min(window.innerHeight*.72,760);
  const charsPerLine=Math.max(28,pageWidth/(font*.56));
  const lines=Math.max(16,pageHeight/(font*1.78)-5);
  return Math.max(520,Math.floor(charsPerLine*lines*.9));
}
function splitIntoPages(text,limit){
  const clean=(text||"").trim();if(!clean)return[""];
  const tokens=clean.split(/(\s+)/),pages=[];let page="";
  for(const token of tokens){
    if(page.length+token.length>limit&&page.trim()){
      const lastBreak=Math.max(page.lastIndexOf("\n\n"),page.lastIndexOf(". "));
      if(lastBreak>limit*.58){
        const head=page.slice(0,lastBreak+1).trim();
        const tail=page.slice(lastBreak+1).trimStart();
        pages.push(head);page=tail+token;
      }else{pages.push(page.trim());page=token.trimStart();}
    }else page+=token;
  }
  if(page.trim()||!pages.length)pages.push(page.trim());
  return pages;
}
function buildReaderPages(){
  const currentChapter=readerPages[readerIndex]?.chapterId;
  readerPages=[];const limit=charsPerPage();
  state.chapters.forEach((c,chapterIndex)=>{
    const parts=splitIntoPages(c.content,limit);
    parts.forEach((part,partIndex)=>readerPages.push({
      chapterId:c.id,chapterIndex,chapterTitle:c.title||`Bölüm ${chapterIndex+1}`,
      text:part||"Bu bölüm henüz boş.",partIndex,partCount:parts.length
    }));
  });
  if(!readerPages.length)readerPages=[{chapterId:"",chapterTitle:"Bölüm 1",text:"Henüz metin yok.",partIndex:0,partCount:1}];
  if(currentChapter){
    const ix=readerPages.findIndex(p=>p.chapterId===currentChapter);
    if(ix>=0)readerIndex=ix;
  }
  readerIndex=clamp(readerIndex,0,readerPages.length-1);
}
function spreadLeftIndex(){
  if(readerIndex<=0)return-1;
  return readerIndex%2===0?readerIndex-1:readerIndex;
}
function pageHtml(page,index){
  if(!page)return`<div class="page-inner blank-page"><div class="page-running-head"><span></span><span></span></div><div class="page-content"></div><div class="paper-page-number"></div></div>`;
  const title=page.partIndex===0?`<h2>${esc(page.chapterTitle)}</h2>`:"";
  return`<div class="page-inner"><div class="page-running-head"><span>${esc(state.bookTitle||"Adsız Roman")}</span><span>${esc(page.chapterTitle)}</span></div><div class="page-content">${title}<div class="page-body">${esc(page.text)}</div></div><div class="paper-page-number">${index+1}</div></div>`;
}
function setPage(el,index){
  if(index<0||index>=readerPages.length){el.innerHTML=pageHtml(null,-1);el.classList.add("blank-page");return;}
  el.innerHTML=pageHtml(readerPages[index],index);el.classList.remove("blank-page");
}
function currentVisibleChapter(){
  if(state.readerLayout==="single")return readerPages[readerIndex]?.chapterTitle||"Bölüm";
  const l=spreadLeftIndex(),r=l+1;return(readerPages[r]||readerPages[l])?.chapterTitle||"Bölüm";
}
function renderReader(){
  resetFlip(true);
  applyAppearance();
  const left=$("#leftPage"),right=$("#rightPage");
  if(state.readerLayout==="single"){
    setPage(right,readerIndex);left.innerHTML="";
    $("#pageIndicator").textContent=`${readerIndex+1} / ${readerPages.length}`;
    $("#prevPage").disabled=readerIndex<=0;$("#nextPage").disabled=readerIndex>=readerPages.length-1;
  }else{
    const l=spreadLeftIndex(),r=l+1;setPage(left,l);setPage(right,r);
    const first=l>=0?l+1:r+1;const last=r<readerPages.length?r+1:l+1;
    $("#pageIndicator").textContent=first===last?`${first} / ${readerPages.length}`:`${first}–${last} / ${readerPages.length}`;
    $("#prevPage").disabled=l<0;$("#nextPage").disabled=r>=readerPages.length-1;
  }
  $("#readerChapter").textContent=currentVisibleChapter();
}

/* ---------- Gerçek sürüklenebilir sayfa motoru ---------- */
const flipState={active:false,prepared:false,pointerId:null,startX:0,lastX:0,dir:0,progress:0,raf:0,targetProgress:0,commitIndex:0};
function canTurn(dir){
  if(state.readerLayout==="single")return dir>0?readerIndex<readerPages.length-1:readerIndex>0;
  const l=spreadLeftIndex(),r=l+1;
  return dir>0?r<readerPages.length-1:l>=0;
}
function prepareFlip(dir){
  const book=$("#readerBook"),flip=$("#flipPage"),front=$("#flipFront"),back=$("#flipBack");
  flip.className=`flip-page visible ${dir>0?"dir-next":"dir-prev"}`;
  if(state.readerLayout==="single"){
    const target=readerIndex+dir;
    setPage($("#rightPage"),target);
    front.innerHTML=pageHtml(readerPages[readerIndex],readerIndex);
    back.innerHTML=pageHtml(readerPages[target],target);
    flipState.commitIndex=target;
  }else{
    const l=spreadLeftIndex(),r=l+1;
    if(dir>0){
      const targetLeft=l+2,targetRight=l+3;
      setPage($("#leftPage"),l);setPage($("#rightPage"),targetRight);
      front.innerHTML=pageHtml(readerPages[r],r);
      back.innerHTML=pageHtml(readerPages[targetLeft],targetLeft);
      flipState.commitIndex=targetLeft;
    }else{
      const targetLeft=l-2,targetRight=l-1;
      setPage($("#leftPage"),targetLeft);setPage($("#rightPage"),r);
      front.innerHTML=pageHtml(readerPages[l],l);
      back.innerHTML=pageHtml(readerPages[targetRight],targetRight);
      flipState.commitIndex=Math.max(0,targetLeft<0?0:targetLeft);
    }
  }
  book.classList.add("dragging");
  flipState.prepared=true;
}
function transformFor(progress,dir){
  const p=clamp(progress,0,1);
  if(state.flipStyle==="slide"){
    const x=(dir>0?-1:1)*p*105;
    return`translate3d(${x}%,0,0)`;
  }
  const eased=state.flipStyle==="soft"?Math.pow(p,.9):Math.pow(p,.78);
  const angle=(dir>0?-180:180)*eased;
  const arc=Math.sin(Math.PI*p);
  const z=(state.flipStyle==="soft"?9:24)*arc;
  const skew=(state.flipStyle==="soft"?.35:1.25)*arc*(dir>0?-1:1);
  const tilt=state.flipStyle==="soft"?0:1.4*arc*(dir>0?-1:1);
  const scale=1-(state.flipStyle==="soft"?.006:.014)*arc;
  return`translateZ(${z}px) rotateY(${angle}deg) rotateZ(${tilt}deg) skewY(${skew}deg) scale(${scale})`;
}
function paintFlip(){
  flipState.raf=0;
  const p=flipState.targetProgress;
  flipState.progress=p;
  document.documentElement.style.setProperty("--flip-progress",p.toFixed(3));
  document.documentElement.style.setProperty("--flip-light",Math.sin(Math.PI*p).toFixed(3));
  $("#flipPage").style.transform=transformFor(p,flipState.dir);
}
function queueFlipPaint(p){
  flipState.targetProgress=clamp(p,0,1);
  if(!flipState.raf)flipState.raf=requestAnimationFrame(paintFlip);
}
function resetFlip(restore=false){
  const book=$("#readerBook"),flip=$("#flipPage");
  book.classList.remove("dragging","settling");
  flip.className="flip-page";flip.style.transform="";
  document.documentElement.style.setProperty("--flip-progress",0);
  document.documentElement.style.setProperty("--flip-light",0);
  flipState.active=false;flipState.prepared=false;flipState.dir=0;flipState.progress=0;flipState.targetProgress=0;
  if(restore&&readerPages.length)renderStaticOnly();
}
function renderStaticOnly(){
  const left=$("#leftPage"),right=$("#rightPage");
  if(state.readerLayout==="single"){setPage(right,readerIndex);left.innerHTML="";}
  else{const l=spreadLeftIndex();setPage(left,l);setPage(right,l+1);}
}
function finishFlip(commit){
  if(!flipState.prepared){resetFlip(false);return;}
  const book=$("#readerBook");
  book.classList.remove("dragging");book.classList.add("settling");
  queueFlipPaint(commit?1:0);
  const duration=state.flipStyle==="slide"?190:state.flipStyle==="soft"?210:260;
  setTimeout(()=>{
    if(commit)readerIndex=flipState.commitIndex;
    resetFlip(false);renderReader();
  },duration+24);
}
function beginPointer(e){
  if(flipState.active)return;
  const rect=$("#readerBook").getBoundingClientRect();
  const localX=e.clientX-rect.left;
  let dir=0;
  if(state.readerLayout==="spread")dir=localX>=rect.width/2?1:-1;
  flipState.active=true;flipState.pointerId=e.pointerId;flipState.startX=e.clientX;flipState.lastX=e.clientX;flipState.dir=dir;
  $("#readerBook").setPointerCapture?.(e.pointerId);
}
function movePointer(e){
  if(!flipState.active||e.pointerId!==flipState.pointerId)return;
  const dx=e.clientX-flipState.startX;
  if(!flipState.dir&&Math.abs(dx)>5)flipState.dir=dx<0?1:-1;
  if(!flipState.dir)return;
  if(!canTurn(flipState.dir)){queueFlipPaint(0);return;}
  const correct=flipState.dir>0?-dx:dx;
  if(correct<=0){queueFlipPaint(0);return;}
  if(!flipState.prepared)prepareFlip(flipState.dir);
  const width=$("#readerBook").getBoundingClientRect().width*(state.readerLayout==="spread"?.5:.86);
  queueFlipPaint(correct/Math.max(180,width));
  flipState.lastX=e.clientX;
  if(e.cancelable)e.preventDefault();
}
function endPointer(e){
  if(!flipState.active||e.pointerId!==flipState.pointerId)return;
  const dx=e.clientX-flipState.startX;
  const directionOk=flipState.dir>0?dx<0:dx>0;
  const quick=Math.abs(dx)>62;
  const commit=flipState.prepared&&directionOk&&(flipState.progress>.30||quick);
  finishFlip(commit);
}
const readerBook=$("#readerBook");
readerBook.addEventListener("pointerdown",beginPointer);
readerBook.addEventListener("pointermove",movePointer,{passive:false});
readerBook.addEventListener("pointerup",endPointer);
readerBook.addEventListener("pointercancel",()=>finishFlip(false));
readerBook.addEventListener("contextmenu",e=>e.preventDefault());

function turnByButton(dir){
  if(!canTurn(dir))return;
  flipState.dir=dir;flipState.active=true;prepareFlip(dir);queueFlipPaint(.001);
  requestAnimationFrame(()=>{const book=$("#readerBook");book.classList.remove("dragging");book.classList.add("settling");queueFlipPaint(1);});
  const duration=state.flipStyle==="slide"?190:state.flipStyle==="soft"?210:260;
  setTimeout(()=>{readerIndex=flipState.commitIndex;resetFlip(false);renderReader();},duration+36);
}
$("#prevPage").onclick=()=>turnByButton(-1);$("#nextPage").onclick=()=>turnByButton(1);
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($("#readerView").classList.contains("active")){buildReaderPages();renderReader();}},220);});

/* ---------- Yazma sesleri: dış dosya yok, WebAudio ile sentezlenir ---------- */
let audioCtx=null,ambientMaster=null,ambientNodes=[],typingNoise=null,lastTypeSound=0;
function ensureAudio(){
  if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
  if(!typingNoise){
    typingNoise=audioCtx.createBuffer(1,audioCtx.sampleRate,audioCtx.sampleRate);
    const d=typingNoise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }
  return audioCtx;
}
function transientNoise(filterType,freq,duration,gainValue){
  const c=ensureAudio();const src=c.createBufferSource();src.buffer=typingNoise;
  const filter=c.createBiquadFilter();filter.type=filterType;filter.frequency.value=freq;
  const gain=c.createGain();gain.gain.setValueAtTime(gainValue,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
  src.connect(filter);filter.connect(gain);gain.connect(c.destination);src.start(c.currentTime,Math.random()*.7,duration);src.stop(c.currentTime+duration+.01);
}
function tone(freq,duration,gainValue,type="triangle"){
  const c=ensureAudio(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;
  g.gain.setValueAtTime(gainValue,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
  o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration+.01);
}
function playTypingSound(kind,inputType="insertText"){
  if(kind==="off")return;
  const now=performance.now();if(now-lastTypeSound<22)return;lastTypeSound=now;
  const v=clamp(state.typingVolume,0,.55);
  if(v<=.001)return;
  if(kind==="typewriter"){
    transientNoise("bandpass",2100,.028,v*.22);tone(inputType.includes("delete")?520:760,.018,v*.10,"square");
  }else if(kind==="pencil"){
    transientNoise("highpass",1450,.042,v*.12);tone(2100,.016,v*.025,"triangle");
  }else if(kind==="fountain"){
    transientNoise("bandpass",980,.055,v*.085);tone(180,.035,v*.018,"sine");
  }
}
$$("[data-typing-sound]").forEach(b=>b.onclick=()=>{
  state.typingSound=b.dataset.typingSound;saveNow();applyAppearance();
  if(state.typingSound!=="off"){ensureAudio();playTypingSound(state.typingSound);}
});
$("#typingVolume").oninput=e=>{state.typingVolume=Number(e.target.value);saveSoon();};
$("#editor").addEventListener("pointerdown",()=>{if(state.typingSound!=="off")ensureAudio();},{passive:true});
$("#editor").addEventListener("beforeinput",e=>{
  if(state.typingSound!=="off"&&(e.inputType.startsWith("insert")||e.inputType.startsWith("delete")))playTypingSound(state.typingSound,e.inputType);
});

/* ---------- Ambiyans sesi ---------- */
function stopAmbient(){for(const n of ambientNodes){try{n.stop?.()}catch{}try{n.disconnect?.()}catch{}}ambientNodes=[];if(ambientMaster){try{ambientMaster.disconnect()}catch{}ambientMaster=null;}}
function noiseBuffer(type="white"){
  const c=ensureAudio(),seconds=3,len=c.sampleRate*seconds,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;if(type==="brown"){last=(last+.02*w)/1.02;d[i]=last*3.2;}else d[i]=w;}return b;
}
async function playAmbient(kind){
  if(kind==="off"){stopAmbient();showToast("Ambiyans kapatıldı.");return;}
  const c=ensureAudio();await c.resume();stopAmbient();ambientMaster=c.createGain();ambientMaster.gain.value=parseFloat($("#volume").value);ambientMaster.connect(c.destination);
  const src=c.createBufferSource();src.buffer=noiseBuffer(kind==="brown"||kind==="fire"?"brown":"white");src.loop=true;
  const f=c.createBiquadFilter();
  if(kind==="rain"){f.type="lowpass";f.frequency.value=2500;}
  else if(kind==="fire"){f.type="bandpass";f.frequency.value=520;f.Q.value=.8;}
  else{f.type="lowpass";f.frequency.value=420;}
  src.connect(f);f.connect(ambientMaster);src.start();ambientNodes.push(src,f);showToast("Ambiyans başladı.");
}
$$("[data-sound]").forEach(b=>b.onclick=()=>playAmbient(b.dataset.sound));
$("#volume").oninput=e=>{if(ambientMaster)ambientMaster.gain.value=parseFloat(e.target.value);};

/* ---------- Dışa aktar ---------- */
function exportText(){
  saveNow();const chunks=[state.bookTitle,"\n"];
  for(const c of state.chapters)chunks.push(`\n${c.title}\n${"=".repeat(Math.max(6,(c.title||"").length))}\n\n${c.content}\n`);
  const blob=new Blob([chunks.join("\n")],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(state.bookTitle||"roman").replace(/[^\p{L}\p{N}_-]+/gu,"_")+".txt";a.click();URL.revokeObjectURL(a.href);
}
$("#drawerExport").onclick=exportText;

document.addEventListener("visibilitychange",()=>{if(document.hidden)saveNow();});
window.addEventListener("beforeunload",saveNow);

/* ---------- PWA ---------- */
let deferredInstallPrompt=null;const installBtn=$("#installBtn");
function isStandalone(){return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}
if(isStandalone())installBtn.hidden=true;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;if(!isStandalone())installBtn.hidden=false;});
installBtn.addEventListener("click",async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installBtn.hidden=true;if(choice.outcome==="accepted")showToast("Roman Atölyesi kuruluyor…");}else showToast("Chrome menüsünden “Uygulamayı yükle” seç.");});
window.addEventListener("appinstalled",()=>{installBtn.hidden=true;showToast("Roman Atölyesi kuruldu.");});

render();buildReaderPages();openView("home");

if("serviceWorker" in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(refreshing)return;refreshing=true;location.reload();});
  window.addEventListener("load",async()=>{try{const reg=await navigator.serviceWorker.register("sw.js",{updateViaCache:"none"});await reg.update();}catch{}});
}
