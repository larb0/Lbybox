// Bump this release identifier whenever deploying a new shell.
const CACHE_NAME='larbybox-connection-20260922-1';
const CACHE_PREFIX='larbybox-';
const SHELL=['./','./index.html','./gold.css','./gold.js','./connection.js','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  // All files must arrive before replacing a functioning installed version.
  await cache.addAll(SHELL.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  // Serve one complete release, rather than mixing old HTML with new scripts.
  const hit=await cache.match(req);
  if(hit)return hit;
  if(req.mode==='navigate'){
   const shell=await cache.match(new URL('./index.html',self.registration.scope));
   if(shell)return shell;
  }
  return fetch(req);
 })());
});
