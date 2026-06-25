


//STORAGE OF BROWSER
const CACHE_NAME = "version-1";
const urlsToCache = ["/index.html", "/src/App.js", "/src/index.js", "/src/App.scss", "/src/index.scss"];
const self = this;

// //installation
// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       console.log("Opened cache");

//       cache.addAll([
//         '/',
//         '/index.html',
//         '/manifest.json',
//         '/static/js/bundle.js'
//       ]);
//     })
//   );
// });

// // listen for request
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });



// actitivate the service worker
self.addEventListener("activate", (event) => {
    const cacheWhitelist = [];
    cacheWhitelist.push(CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames.map((cacheName) => {
                if(!cacheWhitelist.includes(cacheName)){
                    return caches.delete(cacheName);
                }
            })
        ))
    )
});


self.addEventListener("push" , e=>{
    console.log(e)
  const data = e.data.json();
    console.log(data.type)
  switch (data.type) {
    case 'newInvoice':
        e.waitUntil(
            self.registration.showNotification(`درخواست توسط ${data.sendFrom} تکمیل شد `, {
                body: `${data.document}`,
                icon: './xmsLogo.png'
              })
        )

      break;
      case 'sendRequest':
        e.waitUntil(
            self.registration.showNotification(`درخواست از طرف ${data.sendFrom} برای شما ارسال شده است`, {
              body: `${data.document}`,
              icon: './xmsLogo.png'
            })
        )
      break;
      case 'edited':
        e.waitUntil(
            self.registration.showNotification(`درخواست توسط ${data.sendFrom} ویرایش شد`, {
              body: `${data.document}`,
              icon: './xmsLogo.png'
            })
        )
        break;
    default:
      break;
  }

 
})

