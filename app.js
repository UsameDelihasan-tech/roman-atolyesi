
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const fresh = () => {
  const id = "c_" + Date.now();
  return {
    bookTitle:"Adsız Roman",
    theme:"night",
    activeId:id,
    chapters:[{id,title:"Bölüm 1",content:""}]
  };
};

let state;
try{
  const x = JSON.parse(localStorage.getItem("roman_atolyesi_v1"));
  state = x && x.chapters?.length ? x : fresh();
}catch{ state = fresh(); }

const active = () => state.chapters.find(x=>x.id===state.activeId) || state.chapters[0];
const words = t => (t.trim() ? t.trim().split(/\s+/).length : 0);
const esc = s => (s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

let timer;
function saveSoon(){
  $("#saveState").textContent="Kaydediliyor…";
  clearTimeout(timer);
  timer=setTimeout(saveNow,300);
}
function saveNow(){
  localStorage.setItem("roman_atolyesi_v1",JSON.stringify(state));
  $("#saveState").textContent="Kaydedildi";
}
function updateStats(){
  const t=$("#editor").value||"";
  $("#stats").textContent=`${words(t)} kelime · ${t.length} karakter`;
}
function themeLabel(){
  return ({night:"🌙 Gece",rain:"🌧️ Yağmur",candle:"🕯️ Mum",library:"📚 Kütüphane"})[state.theme] || "🌙 Gece";
}
function renderList(){
  const host=$("#chapterList"); host.innerHTML="";
  state.chapters.forEach((c,i)=>{
    const row=document.createElement("div");
    row.className="chapter-row"+(c.id===state.activeId?" active":"");
    row.innerHTML=`<div class="chapter-info"><strong>${esc(c.title||`Bölüm ${i+1}`)}</strong><small>${words(c.content||"")} kelime</small></div><button type="button" class="rename" aria-label="Bölüm adını düzenle" title="Bölüm adını düzenle">✎</button><button class="delete">⋮</button>`;
    row.querySelector(".chapter-info").onclick=()=>{state.activeId=c.id;render();closeDrawer();};
    row.querySelector(".rename").onclick=e=>{
      e.stopPropagation();
      const name=prompt("Yeni bölüm adı:",c.title||`Bölüm ${i+1}`);
      if(name===null) return;
      const title=name.trim();
      if(!title){showToast("Bölüm adı boş olamaz.");return;}
      c.title=title;
      if(state.activeId===c.id) $("#chapterTitle").value=title;
      saveNow();renderList();
    };
    row.querySelector(".delete").onclick=e=>{
      e.stopPropagation();
      if(state.chapters.length===1){showToast("En az bir bölüm kalmalı.");return;}
      if(confirm(`"${c.title}" silinsin mi?`)){
        state.chapters=state.chapters.filter(x=>x.id!==c.id);
        if(state.activeId===c.id) state.activeId=state.chapters[0].id;
        saveNow();render();
      }
    };
    host.appendChild(row);
  });
}
function render(){
  document.body.dataset.theme=state.theme;
  $("#bookTitle").value=state.bookTitle;
  $("#themeBtn").textContent=themeLabel();
  const c=active(); state.activeId=c.id;
  $("#chapterTitle").value=c.title;
  $("#editor").value=c.content;
  renderList();updateStats();
}
function showToast(s){
  const x=$("#toast");x.textContent=s;x.classList.add("show");
  setTimeout(()=>x.classList.remove("show"),1500);
}
function openDrawer(){$("#drawer").classList.add("open");$("#scrim").classList.add("show");}
function closeDrawer(){$("#drawer").classList.remove("open");$("#scrim").classList.remove("show");}
function openSheet(id){$(id).classList.add("show");}
function closeSheets(){$$(".sheet").forEach(x=>x.classList.remove("show"));}

$("#bookTitle").oninput=e=>{state.bookTitle=e.target.value;saveSoon();};
$("#chapterTitle").oninput=e=>{active().title=e.target.value;saveSoon();renderList();};
$("#editor").oninput=e=>{active().content=e.target.value;saveSoon();updateStats();renderList();};

$("#chaptersBtn").onclick=openDrawer;
$("#closeDrawer").onclick=closeDrawer;
$("#scrim").onclick=closeDrawer;
$("#newChapter").onclick=()=>{
  const id="c_"+Date.now();
  state.chapters.push({id,title:`Bölüm ${state.chapters.length+1}`,content:""});
  state.activeId=id;saveNow();render();closeDrawer();$("#editor").focus();
};
$("#focusBtn").onclick=()=>document.body.classList.toggle("focus");
$("#themeBtn").onclick=()=>openSheet("#themeSheet");
$("#soundBtn").onclick=()=>openSheet("#soundSheet");
$$(".close-sheet").forEach(b=>b.onclick=closeSheets);
$$(".sheet").forEach(s=>s.onclick=e=>{if(e.target===s)closeSheets();});
$$("[data-theme]").forEach(b=>b.onclick=()=>{
  state.theme=b.dataset.theme;saveNow();render();closeSheets();
});

$("#exportBtn").onclick=()=>{
  saveNow();
  const chunks=[state.bookTitle,"\n"];
  for(const c of state.chapters){
    chunks.push(`\n${c.title}\n${"=".repeat(Math.max(6,c.title.length))}\n\n${c.content}\n`);
  }
  const blob=new Blob([chunks.join("\n")],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=(state.bookTitle||"roman").replace(/[^\p{L}\p{N}_-]+/gu,"_")+".txt";
  a.click(); URL.revokeObjectURL(a.href);
};

/* Ambiyans sesi: internet gerektirmeden Web Audio ile üretilir. */
let ctx=null, master=null, nodes=[];
function stopSound(){
  for(const n of nodes){try{n.stop?.()}catch{} try{n.disconnect?.()}catch{}}
  nodes=[];
  if(master){try{master.disconnect()}catch{} master=null;}
}
function noiseBuffer(type="white"){
  const seconds=3, len=ctx.sampleRate*seconds;
  const b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0);
  let last=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    if(type==="brown"){last=(last+0.02*w)/1.02;d[i]=last*3.2;}
    else d[i]=w;
  }
  return b;
}
async function playSound(kind){
  if(kind==="off"){stopSound();showToast("Ambiyans kapatıldı.");return;}
  if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)();
  await ctx.resume(); stopSound();
  master=ctx.createGain();master.gain.value=parseFloat($("#volume").value);master.connect(ctx.destination);

  const src=ctx.createBufferSource();
  src.buffer=noiseBuffer(kind==="brown"||kind==="fire"?"brown":"white");
  src.loop=true;
  const f=ctx.createBiquadFilter();
  if(kind==="rain"){f.type="lowpass";f.frequency.value=2500;}
  else if(kind==="fire"){f.type="bandpass";f.frequency.value=520;f.Q.value=.8;}
  else {f.type="lowpass";f.frequency.value=420;}
  src.connect(f);f.connect(master);src.start();
  nodes.push(src,f);
  showToast("Ambiyans başladı.");
}
$$("[data-sound]").forEach(b=>b.onclick=()=>playSound(b.dataset.sound));
$("#volume").oninput=e=>{if(master)master.gain.value=parseFloat(e.target.value);};

document.addEventListener("visibilitychange",()=>{if(document.hidden)saveNow();});
window.addEventListener("beforeunload",saveNow);



/* PWA kurulumu */
let deferredInstallPrompt = null;
const installBtn = $("#installBtn");

function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true;
}

if (isStandalone()) installBtn.hidden = true;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (!isStandalone()) installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
    if (choice.outcome === "accepted") showToast("Roman Atölyesi kuruluyor…");
  } else {
    showToast("Chrome menüsünden “Ana ekrana ekle / Uygulamayı yükle” seç.");
  }
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  showToast("Roman Atölyesi kuruldu.");
});


render();
if("serviceWorker" in navigator){
  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
      await reg.update();
    } catch {}
  });
}
