if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let o={};const f=e=>i(e,t),l={module:{uri:t},exports:o,require:f};s[t]=Promise.all(n.map((e=>l[e]||f(e)))).then((e=>(r(...e),o)))}}define(["./workbox-7369c0e1"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-036ebf6a.css",revision:null},{url:"assets/index-3886b029.js",revision:null},{url:"index.html",revision:"db5f8e99f891cf6ee027aae962e8aafd"},{url:"registerSW.js",revision:"ba66742e627f52733385ac8df6040df5"},{url:"manifest.webmanifest",revision:"f6ffe078e61bc806fd0b2e7d878033fc"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));