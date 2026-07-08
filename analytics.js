/* Scent Stories — lightweight analytics: Microsoft Clarity + named events.
   Heatmaps & session recordings come from Clarity automatically once the ID
   below is set. ssTrack() adds named funnel events (quiz, add-to-bag, waitlist)
   that you can filter recordings by. */
(function(){

  /* ─── 1) Paste your Clarity project ID here ───────────────────────────────
     clarity.microsoft.com → create project → Settings → Overview → "Clarity ID"
     Leave empty to disable Clarity (named events still log locally).           */
  var CLARITY_ID = "";

  if (CLARITY_ID) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,"clarity","script",CLARITY_ID);
  }

  /* ─── 2) named event helper ─────────────────────────────────────────────── */
  function track(name, tags){
    try{
      if(window.clarity){
        window.clarity("event", name);
        if(tags) Object.keys(tags).forEach(function(k){
          var v = tags[k];
          if(v!==null && v!==undefined && v!=="") window.clarity("set", k, String(v));
        });
      }
    }catch(e){}
    // local mirror so you can inspect events on your own device (ssEvents())
    try{
      var log = JSON.parse(localStorage.getItem("ss_events")||"[]");
      log.push({ t: Date.now(), name: name, tags: tags||null });
      localStorage.setItem("ss_events", JSON.stringify(log.slice(-400)));
    }catch(e){}
    if(location.search.indexOf("debug")>-1 || location.hash.indexOf("debug")>-1)
      console.log("[ss]", name, tags||"");
  }
  window.ssTrack  = track;
  window.ssEvents = function(){ try{ return JSON.parse(localStorage.getItem("ss_events")||"[]"); }catch(e){ return []; } };

  /* ─── 3) automatic signals ──────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function(){
    track("page_view", { page: (location.pathname.split("/").pop() || "index.html") });
  });

  // CTA intent (nav "Join the list", hero links, cart button, arrow links)
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a.nav-cta, .hero-actions a, a.link-arrow, .cart-btn");
    if(a){ track("cta_click", { label: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0,48) }); }
  }, true);

})();
