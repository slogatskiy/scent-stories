/* Scent Stories — pre-launch feedback widget.
   Floating button → short survey designed to answer the launch questions:
   would you order, which product first, fair price, what's missing.
   Responses POST to FEEDBACK_ENDPOINT (Formspree) and mirror to localStorage
   + Clarity. Works without an endpoint (stored locally, emailed once set). */
(function(){

  /* ─── Paste your Formspree endpoint here (formspree.io → new form) ─────────
     e.g. "https://formspree.io/f/abcdwxyz". Empty = store locally only.        */
  var FEEDBACK_ENDPOINT = "";

  var Q2 = ["A Story set", "An Advent calendar", "A Mystery box", "Build-your-own (quiz)"];
  var PRICES = ["$35", "$50", "$65", "Wouldn't pay"];

  // ---- styles (self-contained, uses site vars when present) ----
  var css = document.createElement("style");
  css.textContent = [
    ".fb-btn{position:fixed;right:16px;bottom:16px;z-index:9000;font-family:var(--sans,Inter,sans-serif);",
      "font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;cursor:pointer;",
      "background:#c9a87d;color:#100f0d;border:0;border-radius:999px;padding:.85em 1.4em;box-shadow:0 8px 24px -10px rgba(0,0,0,.5)}",
    ".fb-btn:hover{transform:translateY(-2px)}",
    ".fb-overlay{position:fixed;inset:0;z-index:9001;background:rgba(16,15,13,.6);backdrop-filter:blur(4px);",
      "display:none;align-items:center;justify-content:center;padding:1.2rem}",
    ".fb-overlay.open{display:flex}",
    ".fb-card{background:#f5f2eb;color:#1b1a15;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;",
      "border-radius:10px;padding:1.8rem 1.6rem;font-family:var(--sans,Inter,sans-serif);animation:fbin .35s ease}",
    "@keyframes fbin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
    ".fb-card h3{font-family:var(--disp,Fraunces,serif);font-weight:300;font-size:1.6rem;margin:0 0 .2rem}",
    ".fb-card .fb-sub{color:#8c8678;font-size:.86rem;margin:0 0 1.2rem}",
    ".fb-q{font-size:.82rem;font-weight:500;margin:1.1rem 0 .5rem}",
    ".fb-opts{display:flex;flex-wrap:wrap;gap:.5rem}",
    ".fb-chip{border:1px solid rgba(27,26,21,.2);background:#fff;border-radius:999px;padding:.55em 1em;",
      "font-size:.82rem;cursor:pointer;transition:.15s;color:#1b1a15}",
    ".fb-chip:hover{border-color:#9a7245}",
    ".fb-chip.sel{background:#1b1a15;color:#f5f2eb;border-color:#1b1a15}",
    ".fb-card textarea{width:100%;margin-top:.2rem;border:1px solid rgba(27,26,21,.2);border-radius:8px;",
      "padding:.7em .8em;font-family:inherit;font-size:.9rem;resize:vertical;min-height:64px;background:#fff;color:#1b1a15}",
    ".fb-card input[type=text]{width:100%;border:1px solid rgba(27,26,21,.2);border-radius:999px;padding:.65em 1em;",
      "font-family:inherit;font-size:.9rem;background:#fff;color:#1b1a15}",
    ".fb-send{margin-top:1.3rem;width:100%;background:#1b1a15;color:#f5f2eb;border:0;border-radius:999px;",
      "padding:1em;font-family:inherit;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;cursor:pointer}",
    ".fb-send:hover{background:#9a7245}",
    ".fb-x{float:right;background:none;border:0;font-size:1.5rem;line-height:1;cursor:pointer;color:#8c8678}",
    ".fb-thanks{text-align:center;padding:1.5rem 0}",
    ".fb-thanks p{color:#8c8678;margin:.4rem 0 0}"
  ].join("");
  document.head.appendChild(css);

  // ---- state ----
  var ans = { order:null, first:null, price:null };

  function chips(items, key){
    return '<div class="fb-opts">' + items.map(function(t){
      return '<button type="button" class="fb-chip" data-key="'+key+'" data-val="'+t+'">'+t+'</button>';
    }).join("") + '</div>';
  }

  function formHTML(){
    return '<button class="fb-x" data-fbclose aria-label="Close">×</button>'+
      '<h3>Honest take?</h3>'+
      '<p class="fb-sub">30 seconds. This is a concept — your gut reaction shapes it.</p>'+
      '<div class="fb-q">Would you actually order this?</div>'+ chips(["Yes","Maybe","No"],"order")+
      '<div class="fb-q">What would you reach for first?</div>'+ chips(Q2,"first")+
      '<div class="fb-q">Fair price for a 5 × 2 ml set?</div>'+ chips(PRICES,"price")+
      '<div class="fb-q">What’s missing, confusing, or would make you buy?</div>'+
        '<textarea id="fbText" placeholder="Say anything — the more honest the better"></textarea>'+
      '<div class="fb-q">Your name (so I know who to thank)</div>'+
        '<input type="text" id="fbName" autocomplete="name" placeholder="optional"/>'+
      '<button class="fb-send" id="fbSend">Send feedback</button>';
  }

  function open(){ card.innerHTML = formHTML(); bind(); overlay.classList.add("open"); }
  function close(){ overlay.classList.remove("open"); }

  function bind(){
    card.querySelectorAll(".fb-chip").forEach(function(b){
      b.addEventListener("click", function(){
        var k=b.dataset.key;
        card.querySelectorAll('.fb-chip[data-key="'+k+'"]').forEach(function(x){x.classList.remove("sel");});
        b.classList.add("sel"); ans[k]=b.dataset.val;
      });
    });
    card.querySelector("[data-fbclose]").addEventListener("click", close);
    card.querySelector("#fbSend").addEventListener("click", send);
  }

  function send(){
    var payload = {
      order: ans.order, first_choice: ans.first, fair_price: ans.price,
      comment: (card.querySelector("#fbText")||{}).value || "",
      name: (card.querySelector("#fbName")||{}).value || "",
      page: location.pathname.split("/").pop() || "index.html",
      ts: new Date().toISOString()
    };
    // mirror locally + Clarity
    try{ var l=JSON.parse(localStorage.getItem("ss_feedback")||"[]"); l.push(payload); localStorage.setItem("ss_feedback", JSON.stringify(l.slice(-200))); }catch(e){}
    if(window.ssTrack) window.ssTrack("feedback_submit", { order:payload.order, first_choice:payload.first_choice, fair_price:payload.fair_price });
    // send to Formspree if configured
    if(FEEDBACK_ENDPOINT){
      try{
        fetch(FEEDBACK_ENDPOINT, { method:"POST", headers:{ "Accept":"application/json", "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      }catch(e){}
    }
    card.innerHTML = '<div class="fb-thanks"><h3>Thank you 🖤</h3><p>Genuinely — this is exactly what I needed.</p></div>';
    setTimeout(close, 1800);
  }

  // ---- mount ----
  var btn = document.createElement("button");
  btn.className = "fb-btn"; btn.type="button"; btn.textContent = "Feedback";
  btn.addEventListener("click", open);
  var overlay = document.createElement("div");
  overlay.className = "fb-overlay";
  var card = document.createElement("div");
  card.className = "fb-card";
  overlay.appendChild(card);
  overlay.addEventListener("click", function(e){ if(e.target===overlay) close(); });

  document.addEventListener("DOMContentLoaded", function(){
    document.body.appendChild(btn);
    document.body.appendChild(overlay);
  });
  window.ssFeedback = function(){ try{ return JSON.parse(localStorage.getItem("ss_feedback")||"[]"); }catch(e){ return []; } };

})();
