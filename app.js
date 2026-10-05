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
const typingNames={
  off:"Kapalı",typewriter:"Yumuşak daktilo",felt:"Keçe tuş",pencil:"Kurşun kalem",
  fountain:"Dolma kalem",quill:"Tüy kalem",brush:"Fırça",bubble:"Bubble",droplet:"Damla",
  softtap:"Soft tap",glass:"Cam tık",chalk:"Yumuşak tebeşir"
};
const pageSoundNames={off:"Kapalı","paper-soft":"Yumuşak kağıt","paper-crisp":"Yeni kağıt",parchment:"Parşömen",cloth:"Kumaş sayfa"};
const ambientNames={off:"Kapalı","rain-soft":"Hafif yağmur","rain-heavy":"Yoğun yağmur",fire:"Şömine",library:"Kütüphane",cafe:"Kafe",forest:"Orman",night:"Gece",ocean:"Okyanus",train:"Gece treni",wind:"Rüzgar",vinyl:"Plak",clock:"Saat",brown:"Brown noise",pink:"Pink noise",snow:"Kar fırtınası"};
const paperNames={ivory:"Fildişi",parchment:"Parşömen",newsprint:"Gazete",antique:"Eski kitap",nightink:"Gece mürekkebi",clean:"Temiz",wrinkle:"Kırışık kağıt",snow:"Kar",velvet:"Kadife",kilim:"Kilim",linen:"Keten",kraft:"Kraft",marble:"Mermer",leather:"Deri",rice:"Pirinç kağıdı"};
const flipNames={realistic:"Gerçekçi 3D",soft:"Yumuşak 3D",slide:"Kaydır"};

const fresh=()=>{
  const id="c_"+Date.now();
  return{
    bookTitle:"Adsız Roman",mode:"night",ambience:"library",paper:"antique",
    font:"georgia",fontSize:19,pageScale:100,readerLayout:"single",flipStyle:"realistic",
    typingSound:"off",typingVolume:.12,pageSound:"paper-soft",pageSoundVolume:.14,
    ambientSound:"off",ambientVolume:.12,coverFit:"cover",coverText:true,soundProfileVersion:5,activeId:id,
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
state.pageScale=Math.max(70,Math.min(130,Number(state.pageScale)||100));
state.typingSound=state.typingSound||"off";
state.typingVolume=Number.isFinite(Number(state.typingVolume))?Number(state.typingVolume):.12;
state.pageSound=state.pageSound||"paper-soft";
state.pageSoundVolume=Number.isFinite(Number(state.pageSoundVolume))?Number(state.pageSoundVolume):.14;
state.ambientSound=state.ambientSound||"off";
state.ambientVolume=Number.isFinite(Number(state.ambientVolume))?Number(state.ambientVolume):.12;
state.coverFit=state.coverFit||"cover";
state.coverText=state.coverText!==false;
if(!state.soundProfileVersion||state.soundProfileVersion<5){
  state.typingVolume=Math.min(state.typingVolume||.12,.12);
  state.ambientVolume=Math.min(state.ambientVolume||.12,.12);
  state.pageSoundVolume=Math.min(state.pageSoundVolume||.14,.14);
  state.soundProfileVersion=5;
}

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
function estimatedBookPages(){
  const density=Math.pow(100/state.pageScale,1.85);
  return Math.max(state.chapters.length,Math.ceil((totalWords()/285)*density)||1);
}
function updateBookThickness(pageCount=estimatedBookPages()){
  const px=clamp(4+pageCount*.055,4,30);
  document.documentElement.style.setProperty("--book-thickness",`${px.toFixed(1)}px`);
  document.documentElement.style.setProperty("--book-thickness-neg",`${(-px).toFixed(1)}px`);
}

function updateReaderSummary(){
  const layout=$("#homeLayoutBadge"),flip=$("#homeFlipBadge"),scale=$("#homeScaleBadge");
  if(layout)layout.textContent=state.readerLayout==="single"?"Tek sayfa":"Çift sayfa";
  if(flip)flip.textContent=state.flipStyle==="realistic"?"Gerçekçi":state.flipStyle==="soft"?"Yumuşak":"Kaydır";
  if(scale)scale.textContent=`%${state.pageScale}`;
}

function applyAppearance(){
  document.body.dataset.mode=state.mode;
  document.body.dataset.ambience=state.ambience;
  document.body.dataset.paper=state.paper;
  const scale=state.pageScale/100;
  const readerFont=state.fontSize*scale;
  document.documentElement.style.setProperty("--book-font",fontMap[state.font]||fontMap.georgia);
  document.documentElement.style.setProperty("--book-font-size",`${state.fontSize}px`);
  document.documentElement.style.setProperty("--reader-font-size",`${readerFont.toFixed(2)}px`);
  document.documentElement.style.setProperty("--reader-font-size-spread",`${(readerFont*.82).toFixed(2)}px`);
  document.documentElement.style.setProperty("--page-pad-x-spread",`${clamp(15*scale,10,18).toFixed(1)}px`);
  document.documentElement.style.setProperty("--page-pad-y-spread",`${clamp(21*scale,14,25).toFixed(1)}px`);
  document.documentElement.style.setProperty("--reader-heading-size",`${clamp(18*scale+5,17,31).toFixed(1)}px`);
  document.documentElement.style.setProperty("--page-pad-x",`${clamp(28*scale,18,34).toFixed(1)}px`);
  document.documentElement.style.setProperty("--page-pad-y",`${clamp(25*scale,17,31).toFixed(1)}px`);
  document.documentElement.style.setProperty("--cover-fit",state.coverFit);
  $("#modeBtn").textContent=state.mode==="night"?"☀":"☾";
  $("#modeBtn").setAttribute("aria-label",state.mode==="night"?"Gündüz moduna geç":"Gece moduna geç");
  $("#fontSize").value=state.fontSize;
  $("#fontSizeValue").textContent=`${state.fontSize} px`;
  $("#pageScale").value=state.pageScale;
  $("#pageScaleValue").textContent=`%${state.pageScale}`;
  $("#typingVolume").value=state.typingVolume;
  $("#pageSoundVolume").value=state.pageSoundVolume;
  $("#volume").value=state.ambientVolume;
  $("#typingSoundIndicator").textContent=`Yazma sesi: ${typingNames[state.typingSound]||"Kapalı"}`;
  $("#typingSoundLabel").textContent=typingNames[state.typingSound]||"Kapalı";
  $("#pageSoundLabel").textContent=pageSoundNames[state.pageSound]||"Yumuşak kağıt";
  $("#ambientSoundLabel").textContent=ambientNames[state.ambientSound]||"Kapalı";
  $("#paperLabel").textContent=paperNames[state.paper]||"Eski kitap";
  updateReaderSummary();
  $("#layoutBtn").textContent=state.readerLayout==="single"?"▣ Tek sayfa":"▥ Çift sayfa";

  $$('[data-mode-choice]').forEach(b=>b.classList.toggle("selected",b.dataset.modeChoice===state.mode));
  $$('[data-reader-layout]').forEach(b=>b.classList.toggle("selected",b.dataset.readerLayout===state.readerLayout));
  $$('[data-flip-style]').forEach(b=>b.classList.toggle("selected",b.dataset.flipStyle===state.flipStyle));
  $$('[data-paper]').forEach(b=>b.classList.toggle("selected",b.dataset.paper===state.paper));
  $$('[data-font]').forEach(b=>b.classList.toggle("selected",b.dataset.font===state.font));
  $$('[data-ambience]').forEach(b=>b.classList.toggle("selected",b.dataset.ambience===state.ambience));
  $$('[data-typing-sound]').forEach(b=>b.classList.toggle("selected",b.dataset.typingSound===state.typingSound));
  $$('[data-page-sound]').forEach(b=>b.classList.toggle("selected",b.dataset.pageSound===state.pageSound));
  $$('[data-sound]').forEach(b=>b.classList.toggle("selected",b.dataset.sound===state.ambientSound));
  $$('[data-cover-fit]').forEach(b=>b.classList.toggle("selected",b.dataset.coverFit===state.coverFit));
  $$('[data-cover-text]').forEach(b=>b.classList.toggle("selected",(b.dataset.coverText==="on")===state.coverText));

  const book=$("#readerBook");
  book.classList.toggle("layout-single",state.readerLayout==="single");
  book.classList.toggle("layout-spread",state.readerLayout==="spread");
  book.classList.remove("flip-realistic","flip-soft","flip-slide");
  book.classList.add(`flip-${state.flipStyle}`);
  $("#bookCover").classList.toggle("cover-text-off",!state.coverText);
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
  updateReaderSummary();
  updateBookThickness();
}

let newChapterAnimationId=null;
function renderList(){
  const host=$("#chapterList");host.innerHTML="";
  state.chapters.forEach((c,i)=>{
    const row=document.createElement("div");
    row.dataset.chapterId=c.id;
    row.className="chapter-row"+(c.id===state.activeId?" active":"")+(c.id===newChapterAnimationId?" is-new":"");
    row.innerHTML=`
      <div class="chapter-info"><strong>${esc(c.title||`Bölüm ${i+1}`)}</strong><small>${words(c.content||"")} kelime</small></div>
      <button type="button" class="rename" aria-label="Bölüm adını düzenle">✎</button>
      <button type="button" class="delete" aria-label="Bölümü sil">⋮</button>`;
    row.querySelector(".chapter-info").onclick=()=>{state.activeId=c.id;saveNow();render();closeDrawer();openView("editor");};
    row.querySelector(".rename").onclick=e=>{
      e.stopPropagation();
      if(row.classList.contains("editing"))return;
      const info=row.querySelector(".chapter-info"),strong=info.querySelector("strong");
      const original=c.title||`Bölüm ${i+1}`;
      const input=document.createElement("input");
      input.className="chapter-inline-input";input.value=original;input.setAttribute("aria-label","Yeni bölüm adı");
      strong.replaceWith(input);row.classList.add("editing");
      requestAnimationFrame(()=>{input.focus();input.select();});
      let finished=false;
      const finish=(save)=>{
        if(finished)return;finished=true;
        const title=input.value.trim();
        if(save&&title){
          c.title=title;
          if(state.activeId===c.id)$("#chapterTitle").value=title;
          saveNow();updateHome();
          row.classList.add("rename-saved");
          setTimeout(()=>row.classList.remove("rename-saved"),420);
        }
        renderList();
      };
      input.addEventListener("keydown",ev=>{
        if(ev.key==="Enter"){ev.preventDefault();finish(true);}
        if(ev.key==="Escape"){ev.preventDefault();finish(false);}
      });
      input.addEventListener("blur",()=>finish(true),{once:true});
    };
    row.querySelector(".delete").onclick=e=>{
      e.stopPropagation();
      if(state.chapters.length===1){showToast("En az bir bölüm kalmalı.");return;}
      if(confirm(`"${c.title}" silinsin mi?`)){
        row.classList.add("is-removing");
        setTimeout(()=>{
          state.chapters=state.chapters.filter(x=>x.id!==c.id);
          if(state.activeId===c.id)state.activeId=state.chapters[0].id;
          saveNow();render();
        },180);
      }
    };
    host.appendChild(row);
  });
  if(newChapterAnimationId){
    const row=host.querySelector(`[data-chapter-id="${CSS.escape(newChapterAnimationId)}"]`);
    if(row)requestAnimationFrame(()=>row.scrollIntoView({block:"nearest",behavior:"smooth"}));
  }
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
function openDrawer(){renderList();$("#drawer").classList.add("open");$("#scrim").classList.add("show");}
function closeDrawer(){$("#drawer").classList.remove("open");$("#scrim").classList.remove("show");}
function openSheet(id){$(id).classList.add("show");}
function closeSheets(){$$(".sheet").forEach(x=>x.classList.remove("show"));}

function openView(name){
  const selector=name==="home"?"#homeView":name==="editor"?"#editorView":"#readerView";
  const next=$(selector),current=document.querySelector(".view.active");
  if(current===next){if(name==="reader"){buildReaderPages();renderReader();}return;}
  $$(".view").forEach(v=>v.classList.remove("active"));
  $$(".bottom-nav [data-view-target]").forEach(b=>b.classList.remove("active"));
  next.classList.add("active");
  next.classList.remove("view-reveal");void next.offsetWidth;next.classList.add("view-reveal");
  const tab=$(`.bottom-nav [data-view-target="${name}"]`);if(tab)tab.classList.add("active");
  if(name==="reader"){buildReaderPages();renderReader();}
  if(name==="home")updateHome();
  window.scrollTo(0,0);
}

$("#bookTitle").oninput=e=>{state.bookTitle=e.target.value;$("#coverTitle").textContent=state.bookTitle||"Adsız Roman";saveSoon();};
let editorMetricsTimer=0;
function scheduleEditorMetrics(){
  clearTimeout(editorMetricsTimer);
  editorMetricsTimer=setTimeout(()=>updateStats(),90);
}
$("#chapterTitle").oninput=e=>{active().title=e.target.value;saveSoon();};
$("#editor").oninput=e=>{active().content=e.target.value;saveSoon();scheduleEditorMetrics();};
$("#homeBtn").onclick=()=>openView("home");
$("#chaptersBtn").onclick=openDrawer;$("#closeDrawer").onclick=closeDrawer;$("#scrim").onclick=closeDrawer;
$("#newChapter").onclick=()=>{
  const id="c_"+Date.now();
  state.chapters.push({id,title:`Bölüm ${state.chapters.length+1}`,content:""});
  state.activeId=id;newChapterAnimationId=id;saveNow();render();
  setTimeout(()=>{
    newChapterAnimationId=null;
    closeDrawer();openView("editor");
    requestAnimationFrame(()=>$("#chapterTitle").focus());
  },420);
};
$("#focusBtn").onclick=()=>{document.body.classList.toggle("focus");showToast(document.body.classList.contains("focus")?"Odak modu açık.":"Odak modu kapalı.");};
$("#modeBtn").onclick=()=>{state.mode=state.mode==="night"?"day":"night";saveNow();applyAppearance();};
$$("[data-view-target]").forEach(b=>b.onclick=()=>openView(b.dataset.viewTarget));
$("#continueBtn").onclick=()=>openView("editor");$("#readBookBtn").onclick=()=>openView("reader");$("#coverBtn").onclick=()=>openSheet("#coverSheet");

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
let repaginateTimer=0;
function scheduleRepaginate(delay=90){
  clearTimeout(repaginateTimer);
  repaginateTimer=setTimeout(()=>{
    buildReaderPages();
    if($("#readerView").classList.contains("active"))renderReader();
  },delay);
}
$("#pageScale").oninput=e=>{
  state.pageScale=clamp(Number(e.target.value)||100,70,130);
  $("#pageScaleValue").textContent=`%${state.pageScale}`;
  applyAppearance();updateBookThickness();updateReaderSummary();
  scheduleRepaginate(75);
};
$("#pageScale").onchange=()=>{saveNow();scheduleRepaginate(0);updateHome();};
$$('[data-cover-fit]').forEach(b=>b.onclick=()=>{state.coverFit=b.dataset.coverFit;saveNow();applyAppearance();applyCoverVisual();});
$$('[data-cover-text]').forEach(b=>b.onclick=()=>{state.coverText=b.dataset.coverText==="on";saveNow();applyAppearance();});
$("#layoutBtn").onclick=()=>{state.readerLayout=state.readerLayout==="single"?"spread":"single";saveNow();applyAppearance();buildReaderPages();renderReader();};

/* ---------- Sayfalama ---------- */
let readerPages=[];
let readerIndex=0;
let resizeTimer;

function charsPerPage(){
  const w=window.innerWidth;
  const scale=clamp(state.pageScale/100,.70,1.30);
  const densityFactor=Math.pow(1/scale,2.05);
  if(state.readerLayout==="spread"){
    const pageWidth=Math.min(w*.48,490);
    const pageHeight=Math.min(window.innerHeight*.72,760);
    const mobileFactor=w<600?.82:1;
    const baseFont=state.fontSize*mobileFactor;
    const charsPerLine=Math.max(24,pageWidth/(baseFont*.54));
    const lines=Math.max(15,pageHeight/(baseFont*1.68)-4);
    return Math.max(300,Math.floor(charsPerLine*lines*.92*densityFactor));
  }
  const pageWidth=Math.min(w*.92,650);
  const pageHeight=Math.min(window.innerHeight*.72,760);
  const baseFont=state.fontSize;
  const charsPerLine=Math.max(30,pageWidth/(baseFont*.54));
  const lines=Math.max(17,pageHeight/(baseFont*1.70)-4);
  return Math.max(420,Math.floor(charsPerLine*lines*.94*densityFactor));
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
  updateBookThickness(readerPages.length);
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
  resetFlip(false);
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

/* ---------- v5 gerçek zamanlı, çapraz sürüklenebilir sayfa motoru ---------- */
const flipState={
  active:false,prepared:false,pointerId:null,startX:0,startY:0,lastX:0,lastY:0,lastTime:0,
  velocityX:0,velocityY:0,dir:0,progress:0,targetProgress:0,raf:0,commitIndex:0,
  grabY:.5,dragY:0,releaseSpeed:0,rectW:0,rectH:0,rectLeft:0,rectTop:0
};
function canTurn(dir){
  if(state.readerLayout==="single")return dir>0?readerIndex<readerPages.length-1:readerIndex>0;
  const l=spreadLeftIndex(),r=l+1;
  return dir>0?r<readerPages.length-1:l>=0;
}
function updateFlipOrigin(){
  if(!flipState.prepared)return;
  const flip=$("#flipPage");
  const x=flipState.dir>0?0:100;
  flip.style.transformOrigin=`${x}% ${(flipState.grabY*100).toFixed(1)}%`;
  $("#readerBook").style.setProperty("--grab-y",`${(flipState.grabY*100).toFixed(1)}%`);
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
  updateFlipOrigin();
}
function transformFor(progress,dir){
  const p=clamp(progress,0,1);
  const dyNorm=clamp(flipState.dragY/Math.max(220,flipState.rectH*.65),-1,1);
  const corner=(flipState.grabY-.5)*2;
  if(state.flipStyle==="slide"){
    const x=(dir>0?-1:1)*p*104;
    const y=flipState.dragY*.08;
    return`translate3d(${x}%,${y}px,0)`;
  }
  const eased=state.flipStyle==="soft"?Math.pow(p,.94):Math.pow(p,.78);
  const angle=(dir>0?-178:178)*eased;
  const arc=Math.sin(Math.PI*p);
  const z=(state.flipStyle==="soft"?10:28)*arc;
  const tx=(dir>0?-1:1)*arc*(state.flipStyle==="soft"?1.5:3.8);
  const ty=flipState.dragY*(.10+.10*arc);
  const rx=clamp(dyNorm*(state.flipStyle==="soft"?6:13)-corner*arc*3.6,-17,17);
  const rz=clamp(dyNorm*(state.flipStyle==="soft"?4:9)+corner*arc*(dir>0?-5:5),-14,14);
  const skew=(state.flipStyle==="soft"?.25:1.18)*arc*(dir>0?-1:1);
  const scale=1-(state.flipStyle==="soft"?.004:.012)*arc;
  return`translate3d(${tx}px,${ty}px,${z}px) rotateX(${rx}deg) rotateY(${angle}deg) rotateZ(${rz}deg) skewY(${skew}deg) scale(${scale})`;
}
function paintFlip(){
  flipState.raf=0;
  const p=flipState.targetProgress;
  flipState.progress=p;
  const book=$("#readerBook");
  book.style.setProperty("--flip-progress",p.toFixed(3));
  const light=Math.sin(Math.PI*p);
  book.style.setProperty("--flip-light",light.toFixed(3));
  book.style.setProperty("--flip-opacity",(light*.52).toFixed(3));
  book.style.setProperty("--flip-overlay",(light*.24).toFixed(3));
  const shadeX=flipState.dir>0?100-p*78:p*78;
  book.style.setProperty("--shade-x",`${shadeX.toFixed(1)}%`);
  book.style.setProperty("--flip-dy",flipState.dragY.toFixed(1));
  $("#flipPage").style.transform=transformFor(p,flipState.dir);
}
function queueFlipPaint(p){
  flipState.targetProgress=clamp(p,0,1);
  if(!flipState.raf)flipState.raf=requestAnimationFrame(paintFlip);
}
function resetFlip(restore=false){
  const book=$("#readerBook"),flip=$("#flipPage");
  book.classList.remove("dragging","settling");
  flip.className="flip-page";flip.style.transform="";flip.style.transformOrigin="";
  book.style.setProperty("--flip-progress",0);
  book.style.setProperty("--flip-light",0);
  book.style.setProperty("--flip-opacity",0);
  book.style.setProperty("--flip-overlay",0);
  book.style.setProperty("--grab-y","50%");
  book.style.setProperty("--shade-x","50%");
  flipState.active=false;flipState.prepared=false;flipState.dir=0;flipState.progress=0;flipState.targetProgress=0;flipState.dragY=0;flipState.releaseSpeed=0;
  if(restore&&readerPages.length)renderStaticOnly();
}
function renderStaticOnly(){
  const left=$("#leftPage"),right=$("#rightPage");
  if(state.readerLayout==="single"){setPage(right,readerIndex);left.innerHTML="";}
  else{const l=spreadLeftIndex();setPage(left,l);setPage(right,l+1);}
}
function settleDuration(commit){
  const remain=commit?1-flipState.progress:flipState.progress;
  const velocity=Math.min(2.4,Math.abs(flipState.releaseSpeed));
  const base=state.flipStyle==="slide"?105:state.flipStyle==="soft"?135:160;
  return Math.round(clamp(base+remain*75-velocity*24,85,215));
}
function finishFlip(commit){
  if(!flipState.prepared){resetFlip(false);return;}
  const book=$("#readerBook");
  const duration=settleDuration(commit);
  book.style.setProperty("--settle-ms",`${duration}ms`);
  book.classList.remove("dragging");book.classList.add("settling");
  if(commit)playPageTurnSound(state.pageSound,Math.abs(flipState.releaseSpeed),flipState.grabY);
  queueFlipPaint(commit?1:0);
  setTimeout(()=>{
    if(commit)readerIndex=flipState.commitIndex;
    resetFlip(false);renderReader();
  },duration+14);
}
function beginPointer(e){
  if(flipState.active)return;
  if(state.pageSound!=="off")ensureAudio();
  const book=$("#readerBook"),rect=book.getBoundingClientRect();
  flipState.rectW=rect.width;flipState.rectH=rect.height;flipState.rectLeft=rect.left;flipState.rectTop=rect.top;
  const localX=e.clientX-rect.left;
  let dir=0;
  if(state.readerLayout==="spread")dir=localX>=rect.width/2?1:-1;
  const grabY=clamp((e.clientY-rect.top)/rect.height,.04,.96);
  flipState.active=true;flipState.pointerId=e.pointerId;flipState.startX=e.clientX;flipState.startY=e.clientY;
  flipState.lastX=e.clientX;flipState.lastY=e.clientY;flipState.lastTime=performance.now();flipState.velocityX=0;flipState.velocityY=0;
  flipState.dir=dir;flipState.grabY=grabY;flipState.dragY=0;
  book.setPointerCapture?.(e.pointerId);
}
function movePointer(e){
  if(!flipState.active||e.pointerId!==flipState.pointerId)return;
  const now=performance.now(),dt=Math.max(8,now-flipState.lastTime);
  flipState.velocityX=(e.clientX-flipState.lastX)/dt;
  flipState.velocityY=(e.clientY-flipState.lastY)/dt;
  flipState.lastX=e.clientX;flipState.lastY=e.clientY;flipState.lastTime=now;
  const dx=e.clientX-flipState.startX,dy=e.clientY-flipState.startY;
  flipState.dragY=dy;
  if(!flipState.dir&&Math.abs(dx)>3.5)flipState.dir=dx<0?1:-1;
  if(!flipState.dir)return;
  if(!canTurn(flipState.dir)){queueFlipPaint(0);return;}
  const correct=flipState.dir>0?-dx:dx;
  if(correct<=0){queueFlipPaint(0);return;}
  if(!flipState.prepared)prepareFlip(flipState.dir);
  const width=flipState.rectW*(state.readerLayout==="spread"?.48:.86);
  const diagonalAssist=Math.abs(dy)*.11;
  queueFlipPaint((correct+diagonalAssist)/Math.max(170,width));
  if(e.cancelable)e.preventDefault();
}
function endPointer(e){
  if(!flipState.active||e.pointerId!==flipState.pointerId)return;
  const dx=e.clientX-flipState.startX;
  const directionOk=flipState.dir>0?dx<0:dx>0;
  const velocityDir=flipState.dir>0?-flipState.velocityX:flipState.velocityX;
  flipState.releaseSpeed=velocityDir;
  const fast=velocityDir>.48;
  const enoughDistance=Math.abs(dx)>42;
  const commit=flipState.prepared&&directionOk&&(flipState.progress>.22||fast||enoughDistance&&flipState.progress>.12);
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
  if(state.pageSound!=="off")ensureAudio();
  flipState.dir=dir;flipState.active=true;flipState.grabY=.5;flipState.dragY=0;flipState.releaseSpeed=.8;
  prepareFlip(dir);queueFlipPaint(.001);
  requestAnimationFrame(()=>finishFlip(true));
}
$("#prevPage").onclick=()=>turnByButton(-1);$("#nextPage").onclick=()=>turnByButton(1);
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($("#readerView").classList.contains("active")){buildReaderPages();renderReader();}},180);});

/* ---------- v5 temiz, düşük yoruculuklu ses motoru ---------- */
let audioCtx=null,sfxBus=null,sfxLimiter=null,ambientMaster=null,ambientLimiter=null;
let ambientNodes=[],ambientTimers=[],noiseBuffers={},lastTypeSound=0;
function ensureAudio(){
  if(!audioCtx){
    audioCtx=new(window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
    sfxBus=audioCtx.createGain();sfxBus.gain.value=.92;
    sfxLimiter=audioCtx.createDynamicsCompressor();
    sfxLimiter.threshold.value=-20;sfxLimiter.knee.value=18;sfxLimiter.ratio.value=3;sfxLimiter.attack.value=.004;sfxLimiter.release.value=.09;
    sfxBus.connect(sfxLimiter);sfxLimiter.connect(audioCtx.destination);
  }
  if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
  return audioCtx;
}
function getNoiseBuffer(type="white"){
  const c=ensureAudio();
  if(noiseBuffers[type])return noiseBuffers[type];
  const seconds=3,len=c.sampleRate*seconds,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);
  let brown=0,p0=0,p1=0,p2=0,p3=0,p4=0,p5=0,p6=0;
  for(let i=0;i<len;i++){
    const white=Math.random()*2-1;
    if(type==="brown"){
      brown=(brown+.022*white)/1.022;d[i]=brown*3.1;
    }else if(type==="pink"){
      p0=.99886*p0+white*.0555179;p1=.99332*p1+white*.0750759;p2=.969*p2+white*.153852;
      p3=.8665*p3+white*.3104856;p4=.55*p4+white*.5329522;p5=-.7616*p5-white*.016898;
      const pink=p0+p1+p2+p3+p4+p5+p6+white*.5362;p6=white*.115926;d[i]=pink*.11;
    }else d[i]=white*.7;
  }
  noiseBuffers[type]=b;return b;
}
function smoothEnvelope(gain,peak,start,duration,attack=.004){
  gain.gain.cancelScheduledValues(start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.linearRampToValueAtTime(Math.max(.0002,peak),start+attack);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
}
function noiseBurst({type="pink",filter="bandpass",freq=900,q=.65,duration=.05,gain=.03,delay=0,dest=null}={}){
  const c=ensureAudio(),now=c.currentTime+delay,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  src.buffer=getNoiseBuffer(type);f.type=filter;f.frequency.value=freq;f.Q.value=q;
  smoothEnvelope(g,gain,now,duration,Math.min(.006,duration*.18));
  src.connect(f);f.connect(g);g.connect(dest||sfxBus);
  src.start(now,Math.random()*2.2,duration+.02);src.stop(now+duration+.03);
}
function softTone({freq=440,endFreq=null,duration=.05,gain=.02,type="sine",delay=0,dest=null}={}){
  const c=ensureAudio(),now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,now);
  if(endFreq&&endFreq>0)o.frequency.exponentialRampToValueAtTime(endFreq,now+duration);
  smoothEnvelope(g,gain,now,duration,Math.min(.006,duration*.2));
  o.connect(g);g.connect(dest||sfxBus);o.start(now);o.stop(now+duration+.02);
}
function playTypingSound(kind,inputType="insertText"){
  if(kind==="off")return;
  const now=performance.now();if(now-lastTypeSound<26)return;lastTypeSound=now;
  const v=clamp(state.typingVolume,0,.35);if(v<=.001)return;
  const del=inputType.includes("delete");
  const jitter=()=>.94+Math.random()*.12;
  if(kind==="typewriter"){
    noiseBurst({type:"pink",filter:"bandpass",freq:780*jitter(),q:.55,duration:.036,gain:v*.16});
    softTone({freq:(del?170:220)*jitter(),endFreq:(del?145:185),duration:.028,gain:v*.045,type:"triangle"});
  }else if(kind==="felt"){
    softTone({freq:155*jitter(),endFreq:125,duration:.045,gain:v*.055,type:"sine"});
    noiseBurst({type:"brown",filter:"lowpass",freq:480,duration:.04,gain:v*.055});
  }else if(kind==="pencil"){
    noiseBurst({type:"pink",filter:"bandpass",freq:980*jitter(),q:.38,duration:.052,gain:v*.115});
  }else if(kind==="fountain"){
    noiseBurst({type:"pink",filter:"bandpass",freq:620*jitter(),q:.42,duration:.058,gain:v*.09});
    softTone({freq:135,endFreq:118,duration:.036,gain:v*.018,type:"sine"});
  }else if(kind==="quill"){
    noiseBurst({type:"pink",filter:"lowpass",freq:1450*jitter(),q:.2,duration:.048,gain:v*.085});
  }else if(kind==="brush"){
    noiseBurst({type:"brown",filter:"bandpass",freq:520*jitter(),q:.32,duration:.065,gain:v*.085});
  }else if(kind==="bubble"){
    softTone({freq:300*jitter(),endFreq:510*jitter(),duration:.058,gain:v*.085,type:"sine"});
  }else if(kind==="droplet"){
    softTone({freq:690*jitter(),endFreq:340,duration:.085,gain:v*.07,type:"sine"});
    softTone({freq:330,endFreq:220,duration:.06,gain:v*.018,type:"sine",delay:.012});
  }else if(kind==="softtap"){
    softTone({freq:205*jitter(),endFreq:165,duration:.028,gain:v*.055,type:"sine"});
  }else if(kind==="glass"){
    softTone({freq:1040*jitter(),endFreq:820,duration:.042,gain:v*.038,type:"sine"});
  }else if(kind==="chalk"){
    noiseBurst({type:"pink",filter:"bandpass",freq:520*jitter(),q:.3,duration:.055,gain:v*.075});
  }
}
function playPageTurnSound(kind=state.pageSound,speed=.6,grabY=.5){
  if(kind==="off")return;
  const v=clamp(state.pageSoundVolume,0,.35);if(v<=.001)return;
  const speedGain=clamp(.72+speed*.18,.72,1.08);
  const corner=1-Math.abs(grabY-.5)*.16;
  if(kind==="paper-soft"){
    noiseBurst({type:"pink",filter:"bandpass",freq:720,q:.38,duration:.14,gain:v*.16*speedGain*corner});
    noiseBurst({type:"brown",filter:"lowpass",freq:430,q:.2,duration:.11,gain:v*.08,delay:.035});
  }else if(kind==="paper-crisp"){
    noiseBurst({type:"pink",filter:"bandpass",freq:1180,q:.45,duration:.11,gain:v*.15*speedGain});
    noiseBurst({type:"white",filter:"lowpass",freq:2400,q:.2,duration:.065,gain:v*.045,delay:.028});
  }else if(kind==="parchment"){
    noiseBurst({type:"brown",filter:"bandpass",freq:560,q:.7,duration:.16,gain:v*.14*speedGain});
    noiseBurst({type:"pink",filter:"lowpass",freq:1050,q:.25,duration:.10,gain:v*.06,delay:.05});
  }else if(kind==="cloth"){
    noiseBurst({type:"brown",filter:"lowpass",freq:380,q:.2,duration:.17,gain:v*.12*speedGain});
  }
}
$$('[data-typing-sound]').forEach(b=>b.onclick=()=>{
  state.typingSound=b.dataset.typingSound;saveNow();applyAppearance();
  if(state.typingSound!=="off"){ensureAudio();playTypingSound(state.typingSound);}
});
$$('[data-page-sound]').forEach(b=>b.onclick=()=>{
  state.pageSound=b.dataset.pageSound;saveNow();applyAppearance();
  if(state.pageSound!=="off"){ensureAudio();playPageTurnSound(state.pageSound,.55,.5);}
});
$("#typingVolume").oninput=e=>{state.typingVolume=Number(e.target.value);saveSoon();};
$("#pageSoundVolume").oninput=e=>{state.pageSoundVolume=Number(e.target.value);saveSoon();};
$("#editor").addEventListener("pointerdown",()=>{if(state.typingSound!=="off")ensureAudio();},{passive:true});
$("#editor").addEventListener("beforeinput",e=>{
  if(state.typingSound!=="off"&&(e.inputType.startsWith("insert")||e.inputType.startsWith("delete")))playTypingSound(state.typingSound,e.inputType);
});

/* ---------- Düşük CPU'lu geniş ambiyans motoru ---------- */
function stopAmbient(){
  for(const t of ambientTimers)clearInterval(t);ambientTimers=[];
  for(const n of ambientNodes){try{n.stop?.()}catch{}try{n.disconnect?.()}catch{}}ambientNodes=[];
  if(ambientMaster){try{ambientMaster.disconnect()}catch{}ambientMaster=null;}
  if(ambientLimiter){try{ambientLimiter.disconnect()}catch{}ambientLimiter=null;}
}
function ambientLoop(type="pink",filterType="lowpass",freq=900,gainValue=.18,q=.25,highpass=0){
  const c=ensureAudio(),src=c.createBufferSource();src.buffer=getNoiseBuffer(type);src.loop=true;
  const f=c.createBiquadFilter();f.type=filterType;f.frequency.value=freq;f.Q.value=q;
  const g=c.createGain();g.gain.value=gainValue;
  src.connect(f);
  let tail=f;
  if(highpass>0){const hp=c.createBiquadFilter();hp.type="highpass";hp.frequency.value=highpass;tail.connect(hp);tail=hp;ambientNodes.push(hp);}
  tail.connect(g);g.connect(ambientMaster);src.start();ambientNodes.push(src,f,g);return g;
}
function addLfo(gainNode,rate=.15,depth=.4){
  const c=ensureAudio(),o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=rate;
  g.gain.value=Math.max(.001,gainNode.gain.value*depth);o.connect(g);g.connect(gainNode.gain);o.start();ambientNodes.push(o,g);
}
function ambientTone(freq,gainValue,type="sine"){
  const c=ensureAudio(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gainValue;o.connect(g);g.connect(ambientMaster);o.start();ambientNodes.push(o,g);return{o,g};
}
function ambientTick(){
  if(!ambientMaster)return;
  softTone({freq:430,endFreq:360,duration:.026,gain:.018,type:"sine",dest:ambientMaster});
}
async function playAmbient(kind){
  state.ambientSound=kind;saveNow();applyAppearance();
  if(kind==="off"){stopAmbient();showToast("Ambiyans kapatıldı.");return;}
  const c=ensureAudio();await c.resume();stopAmbient();
  ambientMaster=c.createGain();ambientMaster.gain.value=clamp(state.ambientVolume,0,.45);
  ambientLimiter=c.createDynamicsCompressor();ambientLimiter.threshold.value=-16;ambientLimiter.knee.value=20;ambientLimiter.ratio.value=2.5;ambientLimiter.attack.value=.01;ambientLimiter.release.value=.18;
  ambientMaster.connect(ambientLimiter);ambientLimiter.connect(c.destination);
  if(kind==="rain-soft"){
    const g=ambientLoop("pink","lowpass",2700,.26,.25,180);addLfo(g,.18,.12);
  }else if(kind==="rain-heavy"){
    ambientLoop("white","lowpass",4300,.22,.2,170);const g=ambientLoop("brown","lowpass",680,.20,.2);addLfo(g,.12,.32);
  }else if(kind==="fire"){
    const g=ambientLoop("brown","bandpass",560,.18,.6);addLfo(g,1.2,.22);ambientLoop("pink","lowpass",1200,.055,.2,260);
  }else if(kind==="library"){
    ambientLoop("brown","lowpass",260,.14,.2);ambientLoop("pink","bandpass",720,.045,.35);
  }else if(kind==="cafe"){
    ambientLoop("pink","bandpass",720,.12,.5,160);ambientLoop("brown","lowpass",250,.09,.2);
  }else if(kind==="forest"){
    const g=ambientLoop("pink","lowpass",980,.11,.25,120);addLfo(g,.08,.42);ambientLoop("brown","lowpass",240,.05,.2);
  }else if(kind==="night"){
    ambientLoop("brown","lowpass",210,.10,.2);const g=ambientLoop("pink","bandpass",1250,.035,.5);addLfo(g,.22,.5);
  }else if(kind==="ocean"){
    const g=ambientLoop("brown","lowpass",720,.24,.18,40);addLfo(g,.095,.62);ambientLoop("pink","lowpass",1800,.045,.2,300);
  }else if(kind==="train"){
    const g=ambientLoop("brown","lowpass",300,.20,.2);addLfo(g,2.0,.20);const t=ambientTone(54,.025,"sine");
    const l=c.createOscillator(),lg=c.createGain();l.frequency.value=2.05;lg.gain.value=6;l.connect(lg);lg.connect(t.o.frequency);l.start();ambientNodes.push(l,lg);
  }else if(kind==="wind"){
    const g=ambientLoop("pink","lowpass",1250,.17,.2,90);addLfo(g,.11,.55);
  }else if(kind==="vinyl"){
    ambientLoop("pink","lowpass",3300,.055,.2,900);ambientLoop("brown","lowpass",180,.045,.2);
  }else if(kind==="clock"){
    ambientLoop("brown","lowpass",180,.045,.2);ambientTick();ambientTimers.push(setInterval(ambientTick,1000));
  }else if(kind==="brown"){
    ambientLoop("brown","lowpass",650,.25,.2);
  }else if(kind==="pink"){
    ambientLoop("pink","lowpass",2600,.20,.2,80);
  }else if(kind==="snow"){
    const g=ambientLoop("pink","lowpass",760,.14,.2,70);addLfo(g,.07,.58);ambientLoop("white","lowpass",1500,.035,.2,400);
  }
  showToast(`${ambientNames[kind]||"Ambiyans"} başladı.`);
}
$$('[data-sound]').forEach(b=>b.onclick=()=>playAmbient(b.dataset.sound));
$("#volume").oninput=e=>{state.ambientVolume=Number(e.target.value);if(ambientMaster)ambientMaster.gain.value=state.ambientVolume;saveSoon();};

/* ---------- Kapak görseli: IndexedDB'de yerel ve çevrimdışı ---------- */
const COVER_DB="roman_atolyesi_assets_v1",COVER_STORE="assets";
let coverObjectUrl=null,coverBlobCache=null;
function openCoverDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(COVER_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(COVER_STORE))req.result.createObjectStore(COVER_STORE);};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function coverDbGet(){
  try{const db=await openCoverDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(COVER_STORE,"readonly"),r=tx.objectStore(COVER_STORE).get("cover");r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}catch{return null;}
}
async function coverDbPut(blob){
  const db=await openCoverDb();return new Promise((resolve,reject)=>{const tx=db.transaction(COVER_STORE,"readwrite");tx.objectStore(COVER_STORE).put(blob,"cover");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
async function coverDbDelete(){
  try{const db=await openCoverDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(COVER_STORE,"readwrite");tx.objectStore(COVER_STORE).delete("cover");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch{}
}
function applyCoverVisual(){
  const cover=$("#bookCover"),layer=$("#coverImageLayer"),preview=$("#coverPreview");
  document.documentElement.style.setProperty("--cover-fit",state.coverFit||"cover");
  cover.classList.toggle("cover-text-off",!state.coverText);
  if(coverBlobCache){
    if(coverObjectUrl)URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl=URL.createObjectURL(coverBlobCache);
    layer.style.backgroundImage=`url("${coverObjectUrl}")`;layer.style.backgroundSize=state.coverFit;
    preview.style.backgroundImage=`url("${coverObjectUrl}")`;preview.style.backgroundSize=state.coverFit;
    cover.classList.add("has-cover");preview.classList.add("has-image");
  }else{
    layer.style.backgroundImage="";preview.style.backgroundImage="";cover.classList.remove("has-cover");preview.classList.remove("has-image");
  }
}
async function compressCover(file){
  const bitmap=await createImageBitmap(file);
  const maxW=1000,maxH=1500,scale=Math.min(1,maxW/bitmap.width,maxH/bitmap.height);
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d",{alpha:false});ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.86));
}
$("#chooseCover").onclick=()=>$("#coverInput").click();
$("#coverInput").onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    showToast("Kapak hazırlanıyor…");const blob=await compressCover(file);if(!blob)throw new Error("cover");
    coverBlobCache=blob;await coverDbPut(blob);applyCoverVisual();showToast("Kapak kaydedildi.");
  }catch{showToast("Kapak görseli işlenemedi.");}
  e.target.value="";
};
$("#removeCover").onclick=async()=>{coverBlobCache=null;await coverDbDelete();applyCoverVisual();showToast("Kapak kaldırıldı.");};
async function loadCover(){coverBlobCache=await coverDbGet();applyCoverVisual();}

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

/* ---------- v6 mikro-etkileşimler ve adaptif performans ---------- */
const lowEndDevice=((navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4));
document.documentElement.classList.toggle("perf-lite",!!lowEndDevice);

document.addEventListener("pointerdown",e=>{
  const button=e.target.closest?.("button");
  if(button&&!button.disabled)button.classList.add("pressed");
},{passive:true});
["pointerup","pointercancel","pointerout"].forEach(type=>document.addEventListener(type,e=>{
  const button=e.target.closest?.("button");
  if(button)button.classList.remove("pressed");
},{passive:true}));

render();buildReaderPages();openView("home");loadCover();
requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add("app-ready")));

if("serviceWorker" in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(refreshing)return;refreshing=true;location.reload();});
  window.addEventListener("load",async()=>{try{const reg=await navigator.serviceWorker.register("sw.js",{updateViaCache:"none"});await reg.update();}catch{}});
}
