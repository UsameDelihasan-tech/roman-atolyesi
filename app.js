
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const STORAGE_KEY = "roman_atolyesi_v1";

const fontMap = {
  georgia:'Georgia, serif',
  palatino:'"Palatino Linotype","Book Antiqua",Palatino,serif',
  times:'"Times New Roman",Times,serif',
  sans:'system-ui,-apple-system,"Segoe UI",sans-serif',
  mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'
};
const fontNames = {georgia:"Georgia",palatino:"Palatino",times:"Times",sans:"Modern",mono:"Daktilo"};

const fresh = () => {
  const id = "c_" + Date.now();
  return {
    bookTitle:"Adsız Roman", mode:"night", ambience:"library",
    font:"georgia", fontSize:19, activeId:id,
    chapters:[{id,title:"Bölüm 1",content:""}]
  };
};

let state;
try{
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  state = saved && saved.chapters?.length ? saved : fresh();
}catch{ state = fresh(); }

/* Eski sürüm verilerini koruyarak yeni ayarlara geçir. */
state.mode = state.mode || "night";
state.ambience = state.ambience || (["rain","candle","library"].includes(state.theme) ? state.theme : "library");
state.font = state.font || "georgia";
state.fontSize = Number(state.fontSize) || 19;

const active = () => state.chapters.find(x=>x.id===state.activeId) || state.chapters[0];
const words = t => ((t||"").trim() ? (t||"").trim().split(/\s+/).length : 0);
const esc = s => (s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

let timer;
function saveSoon(){
  $("#saveState").textContent="Kaydediliyor…";
  clearTimeout(timer);
  timer=setTimeout(saveNow,280);
}
function saveNow(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  $("#saveState").textContent="Kaydedildi";
}
function totalWords(){return state.chapters.reduce((sum,c)=>sum+words(c.content),0);}

function applyAppearance(){
  document.body.dataset.mode=state.mode;
  document.body.dataset.ambience=state.ambience;
  document.documentElement.style.setProperty("--book-font",fontMap[state.font]||fontMap.georgia);
  document.documentElement.style.setProperty("--book-font-size",`${state.fontSize}px`);
  $("#modeBtn").textContent=state.mode==="night"?"☀":"☾";
  $("#modeBtn").setAttribute("aria-label",state.mode==="night"?"Gündüz moduna geç":"Gece moduna geç");
  $("#fontSize").value=state.fontSize;
  $("#fontSizeValue").textContent=`${state.fontSize} px`;
  $("#homeFontName").textContent=fontNames[state.font]||"Georgia";
  $$("[data-mode-choice]").forEach(b=>b.classList.toggle("selected",b.dataset.modeChoice===state.mode));
  $$("[data-font]").forEach(b=>b.classList.toggle("selected",b.dataset.font===state.font));
  $$("[data-ambience]").forEach(b=>b.classList.toggle("selected",b.dataset.ambience===state.ambience));
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
  $("#homeFontName").textContent=fontNames[state.font]||"Georgia";
}

function renderList(){
  const host=$("#chapterList"); host.innerHTML="";
  state.chapters.forEach((c,i)=>{
    const row=document.createElement("div");
    row.className="chapter-row"+(c.id===state.activeId?" active":"");
    row.innerHTML=`
      <div class="chapter-info">
        <strong>${esc(c.title||`Bölüm ${i+1}`)}</strong>
        <small>${words(c.content||"")} kelime</small>
      </div>
      <button type="button" class="rename" aria-label="Bölüm adını düzenle" title="Bölüm adını düzenle">✎</button>
      <button type="button" class="delete" aria-label="Bölümü sil" title="Sil">⋮</button>`;
    row.querySelector(".chapter-info").onclick=()=>{
      state.activeId=c.id; saveNow(); render(); closeDrawer(); openView("editor");
    };
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
  const c=active(); state.activeId=c.id;
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
  const tab=$(`.bottom-nav [data-view-target="${name}"]`);
  if(tab)tab.classList.add("active");
  if(name==="reader"){buildReaderPages();renderReaderPage();}
  if(name==="home")updateHome();
  window.scrollTo({top:0,behavior:"smooth"});
}

$("#bookTitle").oninput=e=>{
  state.bookTitle=e.target.value;$("#coverTitle").textContent=state.bookTitle||"Adsız Roman";saveSoon();
};
$("#chapterTitle").oninput=e=>{active().title=e.target.value;saveSoon();renderList();updateHome();};
$("#editor").oninput=e=>{active().content=e.target.value;saveSoon();updateStats();renderList();updateHome();};

$("#homeBtn").onclick=()=>openView("home");
$("#chaptersBtn").onclick=openDrawer;
$("#closeDrawer").onclick=closeDrawer;
$("#scrim").onclick=closeDrawer;

$("#newChapter").onclick=()=>{
  const id="c_"+Date.now();
  state.chapters.push({id,title:`Bölüm ${state.chapters.length+1}`,content:""});
  state.activeId=id;saveNow();render();closeDrawer();openView("editor");
  setTimeout(()=>$("#editor").focus(),120);
};

$("#focusBtn").onclick=()=>{
  document.body.classList.toggle("focus");
  showToast(document.body.classList.contains("focus")?"Odak modu açık.":"Odak modu kapalı.");
};
$("#modeBtn").onclick=()=>{
  state.mode=state.mode==="night"?"day":"night";saveNow();applyAppearance();
};

$$("[data-view-target]").forEach(b=>b.onclick=()=>openView(b.dataset.viewTarget));
$("#continueBtn").onclick=()=>openView("editor");
$("#readBookBtn").onclick=()=>openView("reader");

$("#appearanceBtn").onclick=()=>openSheet("#appearanceSheet");
$("#homeAppearanceBtn").onclick=()=>openSheet("#appearanceSheet");
$("#readerAppearanceBtn").onclick=()=>openSheet("#appearanceSheet");
$("#soundBtn").onclick=()=>openSheet("#soundSheet");
$$(".close-sheet").forEach(b=>b.onclick=closeSheets);
$$(".sheet").forEach(s=>s.onclick=e=>{if(e.target===s)closeSheets();});

$$("[data-mode-choice]").forEach(b=>b.onclick=()=>{
  state.mode=b.dataset.modeChoice;saveNow();applyAppearance();
});
$$("[data-font]").forEach(b=>b.onclick=()=>{
  state.font=b.dataset.font;saveNow();applyAppearance();
  if($("#readerView").classList.contains("active")){buildReaderPages();renderReaderPage();}
});
$$("[data-ambience]").forEach(b=>b.onclick=()=>{
  state.ambience=b.dataset.ambience;saveNow();applyAppearance();
});
$("#fontSize").oninput=e=>{
  state.fontSize=Number(e.target.value);
  $("#fontSizeValue").textContent=`${state.fontSize} px`;
  document.documentElement.style.setProperty("--book-font-size",`${state.fontSize}px`);
};
$("#fontSize").onchange=()=>{
  saveNow();
  if($("#readerView").classList.contains("active")){buildReaderPages();renderReaderPage();}
};

/* Kitap görünümü ve sayfa çevirme */
let readerPages=[],readerIndex=0,touchStartX=0;
function charsPerPage(){
  const base=window.innerWidth<600?850:1500;
  return Math.max(480,Math.round(base*(19/state.fontSize)));
}
function splitIntoPages(text,limit){
  const clean=(text||"").trim();
  if(!clean)return[""];
  const tokens=clean.split(/(\s+)/),pages=[];
  let page="";
  for(const token of tokens){
    if(page.length+token.length>limit&&page.trim()){
      pages.push(page.trim());page=token.trimStart();
    }else page+=token;
  }
  if(page.trim()||!pages.length)pages.push(page.trim());
  return pages;
}
function buildReaderPages(){
  readerPages=[];
  const limit=charsPerPage();
  state.chapters.forEach((c,chapterIndex)=>{
    const parts=splitIntoPages(c.content,limit);
    parts.forEach((part,partIndex)=>readerPages.push({
      chapterId:c.id,chapterIndex,
      chapterTitle:c.title||`Bölüm ${chapterIndex+1}`,
      text:part||"Bu bölüm henüz boş.",
      partIndex,partCount:parts.length
    }));
  });
  if(!readerPages.length)readerPages=[{chapterTitle:"Bölüm 1",text:"Henüz metin yok.",partIndex:0,partCount:1}];
  readerIndex=Math.min(readerIndex,readerPages.length-1);
}
function renderReaderPage(){
  const p=readerPages[readerIndex]||readerPages[0];
  $("#readerBookTitle").textContent=state.bookTitle||"Adsız Roman";
  $("#readerChapter").textContent=p.chapterTitle;
  $("#pageChapterTitle").textContent=p.partIndex===0?p.chapterTitle:"";
  $("#pageText").textContent=p.text;
  $("#pageNumberTop").textContent=readerIndex+1;
  $("#pageIndicator").textContent=`${readerIndex+1} / ${readerPages.length}`;
  $("#prevPage").disabled=readerIndex<=0;
  $("#nextPage").disabled=readerIndex>=readerPages.length-1;
}
function turnPage(delta){
  const next=readerIndex+delta;
  if(next<0||next>=readerPages.length)return;
  const page=$("#bookPage");
  page.classList.add(delta>0?"turn-next":"turn-prev");
  setTimeout(()=>{
    readerIndex=next;renderReaderPage();
    page.classList.remove("turn-next","turn-prev");
  },180);
}
$("#prevPage").onclick=()=>turnPage(-1);
$("#nextPage").onclick=()=>turnPage(1);
$("#bookPage").addEventListener("touchstart",e=>{touchStartX=e.changedTouches[0].clientX},{passive:true});
$("#bookPage").addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-touchStartX;
  if(Math.abs(dx)>55)turnPage(dx<0?1:-1);
},{passive:true});
$("#bookPage").addEventListener("keydown",e=>{
  if(e.key==="ArrowRight")turnPage(1);
  if(e.key==="ArrowLeft")turnPage(-1);
});
window.addEventListener("resize",()=>{
  if($("#readerView").classList.contains("active")){buildReaderPages();renderReaderPage();}
});

/* Dışa aktar */
function exportText(){
  saveNow();
  const chunks=[state.bookTitle,"\n"];
  for(const c of state.chapters){
    chunks.push(`\n${c.title}\n${"=".repeat(Math.max(6,(c.title||"").length))}\n\n${c.content}\n`);
  }
  const blob=new Blob([chunks.join("\n")],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=(state.bookTitle||"roman").replace(/[^\p{L}\p{N}_-]+/gu,"_")+".txt";
  a.click();URL.revokeObjectURL(a.href);
}
$("#drawerExport").onclick=exportText;

/* İnternetsiz ambiyans sesi */
let ctx=null,master=null,nodes=[];
function stopSound(){
  for(const n of nodes){try{n.stop?.()}catch{}try{n.disconnect?.()}catch{}}
  nodes=[];if(master){try{master.disconnect()}catch{}master=null;}
}
function noiseBuffer(type="white"){
  const seconds=3,len=ctx.sampleRate*seconds;
  const b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);
  let last=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    if(type==="brown"){last=(last+0.02*w)/1.02;d[i]=last*3.2;}else d[i]=w;
  }
  return b;
}
async function playSound(kind){
  if(kind==="off"){stopSound();showToast("Ambiyans kapatıldı.");return;}
  if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();
  await ctx.resume();stopSound();
  master=ctx.createGain();master.gain.value=parseFloat($("#volume").value);master.connect(ctx.destination);
  const src=ctx.createBufferSource();
  src.buffer=noiseBuffer(kind==="brown"||kind==="fire"?"brown":"white");src.loop=true;
  const f=ctx.createBiquadFilter();
  if(kind==="rain"){f.type="lowpass";f.frequency.value=2500;}
  else if(kind==="fire"){f.type="bandpass";f.frequency.value=520;f.Q.value=.8;}
  else{f.type="lowpass";f.frequency.value=420;}
  src.connect(f);f.connect(master);src.start();nodes.push(src,f);
  showToast("Ambiyans başladı.");
}
$$("[data-sound]").forEach(b=>b.onclick=()=>playSound(b.dataset.sound));
$("#volume").oninput=e=>{if(master)master.gain.value=parseFloat(e.target.value);};

document.addEventListener("visibilitychange",()=>{if(document.hidden)saveNow();});
window.addEventListener("beforeunload",saveNow);

/* PWA kurulumu */
let deferredInstallPrompt=null;
const installBtn=$("#installBtn");
function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
}
if(isStandalone())installBtn.hidden=true;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstallPrompt=e;if(!isStandalone())installBtn.hidden=false;
});
installBtn.addEventListener("click",async()=>{
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    const choice=await deferredInstallPrompt.userChoice;
    deferredInstallPrompt=null;installBtn.hidden=true;
    if(choice.outcome==="accepted")showToast("Roman Atölyesi kuruluyor…");
  }else showToast("Chrome menüsünden “Uygulamayı yükle” seç.");
});
window.addEventListener("appinstalled",()=>{installBtn.hidden=true;showToast("Roman Atölyesi kuruldu.");});

render();
openView("home");

if("serviceWorker" in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(refreshing)return;refreshing=true;location.reload();
  });
  window.addEventListener("load",async()=>{
    try{
      const reg=await navigator.serviceWorker.register("sw.js",{updateViaCache:"none"});
      await reg.update();
    }catch{}
  });
}
