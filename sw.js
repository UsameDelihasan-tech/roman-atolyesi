const CACHE="roman-atolyesi-shell-v6";
const ASSETS=[
  "./","./index.html","./style.css","./app.js","./manifest.json",
  "./icon-192.png","./icon-512.png","./icon-512-maskable.png","./paper-grain.png",
  "./texture-wrinkle.png","./texture-snow.png","./texture-velvet.png","./texture-kilim.png",
  "./texture-linen.png","./texture-kraft.png","./texture-marble.png","./texture-leather.png","./texture-rice.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response&&response.ok){
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }
    return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);if(cached)return cached;
    if(event.request.mode==="navigate")return caches.match("./index.html");
    throw new Error("offline");
  }));
});
