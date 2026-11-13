/* Nutrition Diary Web Push service worker. Scope: /Dnevnik_pitaniya/consultant/ */

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}
  const title = typeof payload.title === "string" ? payload.title.slice(0,100) : "Дневник питания";
  const body = typeof payload.body === "string" ? payload.body.slice(0,240) : "Откройте дневник питания.";
  const defaultURL = self.registration.scope;
  let target = defaultURL;
  try {
    const url = new URL(payload.url || defaultURL, defaultURL);
    if (url.origin === self.location.origin && url.pathname.startsWith("/Dnevnik_pitaniya/")) target = url.href;
  } catch (_) {}
  const iconURL = "/Dnevnik_pitaniya/diary-icon.webp";
  event.waitUntil(self.registration.showNotification(title, {
    body, icon:iconURL, badge:iconURL,
    tag:String(payload.tag || "diary-notification").slice(0,180),
    data:{url:target},
    renotify:false
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data?.url || self.registration.scope;
  event.waitUntil((async()=>{
    const windows = await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const item of windows){
      if(item.url.split("?")[0]===target.split("?")[0]){await item.focus();await item.navigate(target);return;}
    }
    await clients.openWindow(target);
  })());
});
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
