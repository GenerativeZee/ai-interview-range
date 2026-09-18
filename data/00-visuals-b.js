/* Interactive concept visuals — part B: transformers, RAG, agents. */

(function(){
"use strict";
function f2(x){ return (Math.round(x*100)/100).toFixed(2); }
function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }

/* ============================================================
   8. SELF-ATTENTION — click a word, see what it looks at
   ============================================================ */
var SENT=["The","cat","that","the","dog","chased","sat","on","the","mat"];
/* hand-set weights reflecting the syntax a trained model actually learns */
var ATT={
 0:[.34,.41,.05,.03,.03,.03,.05,.02,.02,.02],
 1:[.16,.38,.07,.03,.05,.12,.13,.02,.02,.02],
 2:[.05,.28,.22,.06,.13,.19,.03,.02,.01,.01],
 3:[.04,.05,.06,.30,.42,.07,.02,.02,.01,.01],
 4:[.03,.06,.08,.19,.35,.24,.02,.01,.01,.01],
 5:[.02,.11,.09,.06,.39,.26,.04,.01,.01,.01],
 6:[.05,.44,.04,.02,.05,.06,.21,.05,.03,.05],
 7:[.02,.06,.01,.02,.02,.03,.26,.22,.12,.24],
 8:[.02,.03,.01,.03,.02,.02,.05,.14,.28,.40],
 9:[.02,.05,.01,.02,.02,.02,.14,.19,.18,.35]
};
VISUALS.attention = {
title:"Click a word to see what it pays attention to",
caption:"Every word builds a new version of itself by taking a weighted blend of all the other words. The weights are learned, and they end up tracking real grammatical relationships.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-words" id="atW">'+SENT.map(function(w,i){
      return '<button class="vz-word" data-i="'+i+'">'+w+'</button>'; }).join("")+'</div>'+
    '<figure><svg id="atSvg" viewBox="0 0 340 150" role="img" '+
      'aria-label="Arcs from the selected word to every other word, thicker where attention is stronger"></svg>'+
      '<figcaption>Arc thickness is attention weight. All ten weights always add up to 1.</figcaption></figure>'+
    '<div class="vz-note" id="atNote"></div>'+
    '<div class="vz-steps">'+
      '<div><b>1 · Compare</b>The word\'s <em>query</em> is compared against every word\'s <em>key</em>, giving a raw relevance score for each.</div>'+
      '<div><b>2 · Normalise</b>Softmax turns those scores into weights that sum to 1, so it becomes "how should I split my attention".</div>'+
      '<div><b>3 · Blend</b>Each word\'s <em>value</em> is multiplied by its weight and summed. That blend is the word\'s new, context-aware representation.</div>'+
    '</div>'+
  '</div>';
},
init:function(root){
  var svg=root.querySelector("#atSvg"), note=root.querySelector("#atNote");
  var btns=root.querySelectorAll(".vz-word"), sel=6;
  function draw(){
    var w=ATT[sel], s="", n=SENT.length;
    var xs=SENT.map(function(_,i){ return 24+i*(292/(n-1)); });
    /* arcs */
    for(var i=0;i<n;i++){
      if(i===sel) continue;
      var a=xs[sel], b=xs[i], mid=(a+b)/2, h=100-Math.min(58,Math.abs(b-a)*0.42);
      s+='<path d="M'+a+' 96 Q'+mid+' '+h+' '+b+' 96" fill="none" stroke="var(--vz-hi)" '+
         'stroke-width="'+(0.5+w[i]*15)+'" opacity="'+(0.18+w[i]*1.6)+'" stroke-linecap="round"/>';
    }
    /* self loop */
    s+='<circle cx="'+xs[sel]+'" cy="96" r="'+(4+w[sel]*16)+'" fill="var(--vz-warn)" opacity=".28"/>';
    /* bars + labels */
    for(var j=0;j<n;j++){
      var bh=w[j]*54;
      s+='<rect x="'+(xs[j]-5)+'" y="'+(140-bh)+'" width="10" height="'+bh+'" rx="1.5" fill="'+
         (j===sel?"var(--vz-warn)":"var(--vz-hi)")+'" opacity="'+(j===sel?.9:.75)+'"/>';
      s+='<text x="'+xs[j]+'" y="112" font-size="9" text-anchor="middle" fill="currentColor" opacity="'+
         (j===sel?1:.7)+'" font-weight="'+(j===sel?700:400)+'">'+SENT[j]+'</text>';
      s+='<text x="'+xs[j]+'" y="'+(136-bh)+'" font-size="7.5" text-anchor="middle" fill="currentColor" opacity=".6">'+
         Math.round(w[j]*100)+'</text>';
    }
    svg.innerHTML=s+'<text x="170" y="14" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".75">'+
      'how "'+SENT[sel]+'" splits its attention (%)</text>';
    Array.prototype.forEach.call(btns,function(b){
      b.classList.toggle("on", parseInt(b.dataset.i,10)===sel);
    });
    var msgs={
      6:'<b>"sat" looks hardest at "cat" (44%), not at "dog".</b> That is the whole point. "dog" sits far closer in the sentence, but "cat" is the actual subject of "sat" — and attention has learned to reach across the intervening clause to find it. An older model that read strictly left-to-right would struggle here.',
      5:'<b>"chased" looks at "dog" (39%).</b> It has found its own subject inside the relative clause, correctly ignoring "cat", which belongs to the outer sentence.',
      1:'<b>"cat" spreads attention toward "chased" and "sat".</b> It is gathering up both things that happen to it — one in the relative clause, one in the main sentence.',
      9:'<b>"mat" looks back at "on" and "the".</b> Short-range, mostly positional. Plenty of attention is mundane like this; not every head is doing something clever.'
    };
    note.innerHTML = msgs[sel] || '<b>"'+SENT[sel]+'"</b> spends '+Math.round(w[sel]*100)+
      '% of its attention on itself and the rest on its neighbours. Try <b>sat</b> — that is the one that shows why attention was worth inventing.';
  }
  Array.prototype.forEach.call(btns,function(b){
    b.addEventListener("click",function(){ sel=parseInt(b.dataset.i,10); draw(); });
  });
  draw();
}};

/* ============================================================
   9. KV CACHE — with and without, step by step
   ============================================================ */
VISUALS["kv-cache"] = {
title:"Why generation would be unaffordable without the cache",
caption:"To produce each new word the model must look at every word before it. Without a cache it redoes all that work every single time.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><button class="vz-btn" id="kvStep">Generate next word</button>'+
    '<button class="vz-btn ghost" id="kvRst">Reset</button>'+
    '<label class="vz-tog"><input type="checkbox" id="kvOn" checked> use KV cache</label></div>'+
    '<figure><svg id="kvSvg" viewBox="0 0 340 200" role="img" '+
      'aria-label="A grid showing which token computations are performed at each generation step, with and without caching"></svg>'+
      '<figcaption>One row per generation step. Each cell is one token\'s key/value computation.</figcaption></figure>'+
    '<div class="vz-note" id="kvNote"></div>'+
  '</div>';
},
init:function(root){
  var svg=root.querySelector("#kvSvg"), note=root.querySelector("#kvNote");
  var chk=root.querySelector("#kvOn"); var step=0, MAX=7;
  var toks=["The","best","way","to","learn","is","to","build"];
  function draw(){
    var cached=chk.checked, s="", total=0;
    for(var r=0;r<=step;r++){
      var cols=r+1;
      for(var c=0;c<cols;c++){
        var fresh = cached ? (c===cols-1) : true;
        if(fresh) total++;
        s+='<rect x="'+(56+c*32)+'" y="'+(30+r*21)+'" width="28" height="17" rx="3" fill="'+
          (fresh?"var(--vz-warn)":"var(--vz-hi)")+'" opacity="'+(fresh?.85:.22)+'"/>';
        if(r===step) s+='<text x="'+(70+c*32)+'" y="'+(42+r*21)+'" font-size="7.5" text-anchor="middle" fill="var(--vz-card)">'+
          (fresh?"new":"")+'</text>';
      }
      s+='<text x="50" y="'+(43+r*21)+'" font-size="8.5" text-anchor="end" fill="currentColor" opacity=".65">step '+(r+1)+'</text>';
    }
    for(var t=0;t<=step;t++)
      s+='<text x="'+(70+t*32)+'" y="24" font-size="8" text-anchor="middle" fill="currentColor" opacity=".7">'+toks[t]+'</text>';
    var noCache=(step+1)*(step+2)/2, withCache=step+1;
    svg.innerHTML=s+
      '<text x="336" y="14" font-size="9.5" text-anchor="end" fill="currentColor">computations so far: <tspan font-weight="700" fill="var(--vz-warn)">'+total+'</tspan></text>'+
      '<text x="56" y="194" font-size="8.5" fill="var(--vz-warn)">■ computed now</text>'+
      '<text x="160" y="194" font-size="8.5" fill="var(--vz-hi)" opacity=".8">■ reused from cache</text>'+
      '<text x="336" y="194" font-size="8.5" text-anchor="end" fill="currentColor" opacity=".7">cache: '+withCache+' vs no cache: '+noCache+'</text>';
    note.innerHTML = cached
      ? "<b>With the cache</b>, each step computes only the one new word and reuses everything before it. After "+(step+1)+" words that is <b>"+withCache+"</b> units of work — it grows in a straight line. The cost is memory: that cache has to be held in fast GPU memory for every request you are serving at once, which is why cache size, not raw compute, sets how many users you can handle."
      : "<b>Without the cache</b>, every step recomputes the whole sequence from scratch. After "+(step+1)+" words that is <b>"+noCache+"</b> units of work, and it grows as the square of the length. Generate a 1,000-word answer this way and you have done roughly half a million units instead of a thousand.";
  }
  root.querySelector("#kvStep").addEventListener("click",function(){ if(step<MAX){step++;draw();} });
  root.querySelector("#kvRst").addEventListener("click",function(){ step=0; draw(); });
  chk.addEventListener("change",draw);
  draw();
}};

/* ============================================================
   10. LoRA — rank slider, parameter count collapse
   ============================================================ */
VISUALS.lora = {
title:"Why LoRA trains 1% of the numbers",
caption:"Rather than updating a huge grid of weights, LoRA learns two thin grids whose product is the update. The base model is never touched.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>Rank r = <output id="loOut">16</output></label>'+
    '<input type="range" id="loR" min="1" max="128" step="1" value="16"></div>'+
    '<figure><svg id="loSvg" viewBox="0 0 340 170" role="img" '+
      'aria-label="A frozen square weight matrix beside two thin trainable matrices whose product has the same shape"></svg>'+
      '<figcaption>One 4096×4096 weight matrix from a 7B model.</figcaption></figure>'+
    '<div class="vz-grid4" id="loNums"></div>'+
    '<div class="vz-note" id="loNote"></div>'+
  '</div>';
},
init:function(root){
  var sl=root.querySelector("#loR"), out=root.querySelector("#loOut");
  var svg=root.querySelector("#loSvg"), nums=root.querySelector("#loNums"), note=root.querySelector("#loNote");
  var D=4096;
  function draw(){
    var r=parseInt(sl.value,10); out.textContent=r;
    var full=D*D, lo=r*D*2, pct=lo/full*100;
    var wpx=Math.max(3,r/128*46);
    svg.innerHTML=
      '<rect x="20" y="34" width="96" height="96" rx="3" fill="var(--vz-hi)" opacity=".16" stroke="var(--vz-hi)" stroke-width="1.5" stroke-dasharray="4 3"/>'+
      '<text x="68" y="78" font-size="11" font-weight="700" text-anchor="middle" fill="currentColor">W</text>'+
      '<text x="68" y="91" font-size="8" text-anchor="middle" fill="currentColor" opacity=".7">frozen</text>'+
      '<text x="68" y="26" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".7">4096 × 4096</text>'+
      '<text x="68" y="144" font-size="9" text-anchor="middle" fill="currentColor" opacity=".8">16.8M numbers</text>'+
      '<text x="130" y="86" font-size="16" text-anchor="middle" fill="currentColor" opacity=".6">+</text>'+
      '<rect x="150" y="34" width="'+wpx+'" height="96" rx="2" fill="var(--vz-warn)" opacity=".85"/>'+
      '<text x="'+(150+wpx/2)+'" y="144" font-size="9" text-anchor="middle" fill="var(--vz-warn)">B</text>'+
      '<text x="'+(150+wpx/2)+'" y="26" font-size="8" text-anchor="middle" fill="currentColor" opacity=".7">4096×'+r+'</text>'+
      '<text x="'+(160+wpx)+'" y="86" font-size="13" text-anchor="middle" fill="currentColor" opacity=".6">×</text>'+
      '<rect x="'+(170+wpx)+'" y="34" width="96" height="'+wpx+'" rx="2" fill="var(--vz-pos)" opacity=".85"/>'+
      '<text x="'+(218+wpx)+'" y="'+(30+wpx+14)+'" font-size="9" text-anchor="middle" fill="var(--vz-pos)">A</text>'+
      '<text x="'+(218+wpx)+'" y="26" font-size="8" text-anchor="middle" fill="currentColor" opacity=".7">'+r+'×4096</text>'+
      '<text x="'+(278+wpx)+'" y="86" font-size="14" text-anchor="middle" fill="currentColor" opacity=".6">=</text>'+
      '<rect x="'+(290+wpx)+'" y="34" width="40" height="96" rx="3" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>'+
      '<text x="'+(310+wpx)+'" y="82" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".8">update,</text>'+
      '<text x="'+(310+wpx)+'" y="93" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".8">same</text>'+
      '<text x="'+(310+wpx)+'" y="104" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".8">shape</text>'+
      '<text x="170" y="12" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".8">only the orange and green strips are trained</text>';
    nums.innerHTML=
      '<div class="vz-tile"><b>16.8M</b><span>Full fine-tune</span><i>every number updated</i></div>'+
      '<div class="vz-tile k-hi"><b>'+(lo/1000).toFixed(0)+'K</b><span>LoRA at r='+r+'</span><i>trainable numbers</i></div>'+
      '<div class="vz-tile k-ok"><b>'+(full/lo).toFixed(0)+'×</b><span>Fewer</span><i>'+pct.toFixed(2)+'% of the original</i></div>'+
      '<div class="vz-tile k-warn"><b>'+(r<=8?"Style":r<=32?"Domain":"Heavy")+'</b><span>Typical use</span><i>'+
        (r<=8?"format, tone":r<=32?"domain adaptation":"rarely needed")+'</i></div>';
    note.innerHTML = "<b>The bet LoRA makes</b> is that the <em>change</em> you need for your task is far simpler than the model itself — so it can be described by two thin matrices instead of a full square one. At r="+r+" you train "+pct.toFixed(2)+"% of this layer's numbers."+
      (r<=4? " Very low rank: enough to nudge tone and formatting, probably not enough for a real domain shift." :
       r>=64? " High rank: you are approaching full fine-tuning's cost without much of its benefit. Most tasks plateau well below this." :
       " This is the range most production fine-tunes actually use.")+
      " <b>B starts at all zeros</b>, so on the very first step the update is exactly nothing and the model behaves identically to the original — then it learns away from there. That is what stops a random new matrix from wrecking a carefully pretrained network.";
  }
  sl.addEventListener("input",draw); draw();
}};

/* ============================================================
   11. CHUNKING — three strategies on the same document
   ============================================================ */
VISUALS.chunking = {
title:"The same document, cut three ways",
caption:"Chunks must be small enough to retrieve precisely and big enough to make sense alone. Where you cut decides whether an answer survives.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl vz-tabs">'+
      '<button class="vz-btn on" data-m="fixed">Fixed size</button>'+
      '<button class="vz-btn" data-m="recursive">Recursive</button>'+
      '<button class="vz-btn" data-m="parent">Parent-child</button>'+
    '</div>'+
    '<div class="vz-doc" id="ckDoc"></div>'+
    '<div class="vz-note" id="ckNote"></div>'+
  '</div>';
},
init:function(root){
  var doc=root.querySelector("#ckDoc"), note=root.querySelector("#ckNote");
  var btns=root.querySelectorAll(".vz-tabs .vz-btn");
  var LINES=[
    {t:"SOP 4.2 — Reactor Startup",h:1},
    {t:"Safety interlocks",h:2},
    {t:"Confirm the pressure relief valve is seated before any heating begins.",h:0},
    {t:"The interlock will not release until both temperature sensors agree.",h:0},
    {t:"Startup sequence",h:2},
    {t:"Open the coolant loop, then bring the primary heater to 40% over ten minutes.",h:0},
    {t:"Do not exceed 60% until the interlock clears.",h:0}
  ];
  var MODES={
    fixed:{
      cuts:[[0,1],[2,3],[4,5],[6,6]],
      label:"Cut every N characters, ignoring structure",
      msg:"<b>The problem is visible in chunk 1.</b> The heading \"Safety interlocks\" got separated from the instruction it introduces, and \"Do not exceed 60% until the interlock clears\" ended up alone in chunk 4 — retrieved without the sequence it belongs to, it is nearly useless and potentially dangerous. Fixed-size chunking is predictable and structure-blind. Use it only as a baseline."
    },
    recursive:{
      cuts:[[0,3],[4,6]],
      label:"Split on the biggest natural boundary that fits",
      msg:"<b>Much better.</b> It tried paragraph breaks first, so each chunk is a complete section with its heading attached. This is what <code>RecursiveCharacterTextSplitter</code> does: try paragraphs, fall back to lines, then sentences, then raw characters — preserving meaning wherever it can while still guaranteeing nothing exceeds the size limit. A good default. The remaining weakness: a big section becomes one big chunk, so the relevant sentence gets diluted among everything else in it."
    },
    parent:{
      cuts:[[2,2],[3,3],[5,5],[6,6]],
      parents:[[0,3],[4,6]],
      label:"Index small pieces, return the whole section",
      msg:"<b>This is the pattern worth reaching for.</b> Search runs against the small outlined pieces, so a query about pressure valves matches one precise sentence rather than a whole page — high precision. But what gets handed to the model is the shaded <em>parent</em> section, so the answer arrives with its heading and surrounding steps intact — high completeness. You get precision in retrieval and context in generation, instead of trading one for the other."
    }
  };
  function draw(mode){
    var M=MODES[mode], html="";
    var inParent=function(i){
      if(!M.parents) return -1;
      for(var p=0;p<M.parents.length;p++) if(i>=M.parents[p][0]&&i<=M.parents[p][1]) return p;
      return -1;
    };
    var chunkOf=function(i){
      for(var c=0;c<M.cuts.length;c++) if(i>=M.cuts[c][0]&&i<=M.cuts[c][1]) return c;
      return -1;
    };
    LINES.forEach(function(L,i){
      var c=chunkOf(i), pi=inParent(i);
      var cls="ckl"+(L.h===1?" h1":L.h===2?" h2":"")+(c>=0?" ck":"")+(pi>=0?" pp p"+(pi%2):"");
      html+='<div class="'+cls+'" data-c="'+(c>=0?c+1:"")+'">'+
        (c>=0?'<i class="cktag">chunk '+(c+1)+'</i>':'')+
        '<span>'+L.t+'</span></div>';
    });
    doc.innerHTML='<div class="ckhead">'+M.label+'</div>'+html;
    note.innerHTML=M.msg;
    Array.prototype.forEach.call(btns,function(b){ b.classList.toggle("on", b.dataset.m===mode); });
  }
  Array.prototype.forEach.call(btns,function(b){
    b.addEventListener("click",function(){ draw(b.dataset.m); });
  });
  draw("fixed");
}};

/* ============================================================
   12. RRF — three ranked lists fusing, with K slider
   ============================================================ */
VISUALS.rrf = {
title:"Merging search results without comparing scores",
caption:"Three search engines return three different orderings. RRF combines them using only positions, so incomparable scores never have to be reconciled.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>K = <output id="rfOut">60</output></label>'+
    '<input type="range" id="rfK" min="0" max="120" step="1" value="60"></div>'+
    '<figure><svg id="rfSvg" viewBox="0 0 340 215" role="img" '+
      'aria-label="Three ranked document lists combining into one fused ranking by reciprocal rank scores"></svg>'+
      '<figcaption>Each engine contributes 1/(K + position) to every document it returns.</figcaption></figure>'+
    '<div class="vz-note" id="rfNote"></div>'+
  '</div>';
},
init:function(root){
  var sl=root.querySelector("#rfK"), out=root.querySelector("#rfOut");
  var svg=root.querySelector("#rfSvg"), note=root.querySelector("#rfNote");
  var SYS=[
    {n:"Keyword (BM25)",l:["D1","D3","D5","D7"]},
    {n:"Semantic (vector)",l:["D2","D1","D4"]},
    {n:"Graph",l:["D5","D3","D2"]}
  ];
  function draw(){
    var K=parseInt(sl.value,10); out.textContent=K;
    var sc={};
    SYS.forEach(function(s){ s.l.forEach(function(d,i){ sc[d]=(sc[d]||0)+1/(K+i+1); }); });
    var ord=Object.keys(sc).sort(function(a,b){ return sc[b]-sc[a]; });
    var mx=sc[ord[0]], s="";
    SYS.forEach(function(sy,c){
      var x=8+c*76;
      s+='<text x="'+(x+32)+'" y="14" font-size="8" text-anchor="middle" fill="currentColor" opacity=".75">'+sy.n+'</text>';
      sy.l.forEach(function(d,i){
        s+='<rect x="'+x+'" y="'+(22+i*24)+'" width="64" height="19" rx="3" fill="var(--vz-hi)" opacity="'+(0.34-i*0.05)+'"/>'+
           '<text x="'+(x+8)+'" y="'+(35+i*24)+'" font-size="9" fill="currentColor">'+d+'</text>'+
           '<text x="'+(x+58)+'" y="'+(35+i*24)+'" font-size="7.5" text-anchor="end" fill="currentColor" opacity=".7">#'+(i+1)+'</text>';
      });
    });
    s+='<line x1="238" y1="18" x2="238" y2="196" stroke="currentColor" opacity=".25"/>';
    s+='<text x="290" y="14" font-size="8.5" text-anchor="middle" fill="var(--vz-warn)" font-weight="700">FUSED</text>';
    ord.forEach(function(d,i){
      var bw=sc[d]/mx*46;
      s+='<rect x="250" y="'+(22+i*24)+'" width="'+bw+'" height="19" rx="3" fill="var(--vz-warn)" opacity=".55"/>'+
         '<text x="254" y="'+(35+i*24)+'" font-size="9" fill="currentColor">'+d+'</text>'+
         '<text x="336" y="'+(35+i*24)+'" font-size="7" text-anchor="end" fill="currentColor" opacity=".7">'+sc[d].toFixed(4)+'</text>';
    });
    svg.innerHTML=s+'<text x="170" y="210" font-size="8" text-anchor="middle" fill="currentColor" opacity=".6">'+
      'D3 and D5 were never anyone\'s top hit, but two engines each found them</text>';
    var d1=sc["D1"], d3=sc["D3"], d7=sc["D7"];
    note.innerHTML = K===0
      ? "<b>K = 0 means winner-takes-all.</b> A #1 result scores 1.0 and a #2 scores 0.5, so whichever engine shouts loudest decides the order. Agreement between engines barely counts."
      : K<15
      ? "<b>Low K ("+K+").</b> Top positions still dominate. Use this when you trust one engine's top hit more than you trust consensus."
      : "<b>K = "+K+" — consensus wins.</b> At this value a #1 and a #2 score almost the same ("+ (1/(K+1)).toFixed(4)+" vs "+(1/(K+2)).toFixed(4)+"), so what really drives the ranking is <em>how many engines found the document at all</em>. Look at D7: one engine ranked it 4th and nobody else saw it, so it scores "+d7.toFixed(4)+". D3 was only ever ranked 2nd, by two engines, and scores "+d3.toFixed(4)+" — more than double. That is the design intent: when each individual retriever is noisy, agreement is a better signal than confidence. K=60 is the published default and a sensible starting point.";
  }
  sl.addEventListener("input",draw); draw();
}};

/* ============================================================
   13. HNSW — layered graph, greedy descent
   ============================================================ */
VISUALS.hnsw = {
title:"Finding a needle without checking every haystack",
caption:"HNSW builds a layered map: a sparse top layer for long jumps, denser layers below for fine positioning. A search descends through them, hopping closer each time.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><button class="vz-btn" id="hnGo">Run a search</button>'+
    '<button class="vz-btn ghost" id="hnRst">Reset</button>'+
    '<span class="vz-step" id="hnStep"></span></div>'+
    '<figure><svg id="hnSvg" viewBox="0 0 340 230" role="img" '+
      'aria-label="A three-layer navigable graph where a search hops from a sparse top layer down to the nearest neighbour"></svg>'+
      '<figcaption>Three layers over the same 24 points. Only a handful of points exist in the top layer.</figcaption></figure>'+
    '<div class="vz-note" id="hnNote">Press <b>Run a search</b> to follow the path.</div>'+
  '</div>';
},
init:function(root){
  var svg=root.querySelector("#hnSvg"), note=root.querySelector("#hnNote");
  var stepEl=root.querySelector("#hnStep"); var t=0, timer=null;
  /* fixed layout: 24 points; layer membership; the visited path */
  var P=[];
  var seedX=[28,62,96,130,164,198,232,266,300,44,78,112,146,180,214,248,282,36,70,104,138,172,206,240];
  var seedY=[26,52,18,44,30,58,22,48,34,20,46,28,54,24,50,32,56,38,60,42,26,52,44,30];
  for(var i=0;i<24;i++) P.push({x:seedX[i],y:seedY[i]});
  var TARGET={x:250,y:44};
  var L2=[0,4,8,16,22], L1=[0,2,4,6,8,10,14,16,20,22], L0=P.map(function(_,i){return i;});
  var PATH=[{l:2,n:0},{l:2,n:8},{l:1,n:16},{l:1,n:20},{l:0,n:22},{l:0,n:23}];
  function ly(l){ return 30+(2-l)*70; }
  function draw(){
    var s="";
    [2,1,0].forEach(function(l){
      var mem=l===2?L2:l===1?L1:L0, yb=ly(l);
      s+='<text x="6" y="'+(yb+4)+'" font-size="8.5" fill="currentColor" opacity=".6">L'+l+'</text>';
      s+='<line x1="24" y1="'+(yb+34)+'" x2="336" y2="'+(yb+34)+'" stroke="currentColor" opacity=".12"/>';
      /* edges between consecutive members */
      for(var k=0;k<mem.length-1;k++){
        var a=P[mem[k]], b=P[mem[k+1]];
        s+='<line x1="'+a.x+'" y1="'+(yb+a.y*0.42)+'" x2="'+b.x+'" y2="'+(yb+b.y*0.42)+
           '" stroke="currentColor" stroke-width="0.8" opacity=".22"/>';
      }
      mem.forEach(function(idx){
        var p=P[idx];
        s+='<circle cx="'+p.x+'" cy="'+(yb+p.y*0.42)+'" r="3" fill="currentColor" opacity=".4"/>';
      });
      s+='<circle cx="'+TARGET.x+'" cy="'+(yb+TARGET.y*0.42)+'" r="5" fill="none" stroke="var(--vz-pos)" stroke-width="1.6" stroke-dasharray="2 2"/>';
    });
    /* path so far */
    var prev=null;
    for(var k2=0;k2<t&&k2<PATH.length;k2++){
      var st=PATH[k2], p=P[st.n], yb=ly(st.l);
      var cx=p.x, cy=yb+p.y*0.42;
      if(prev) s+='<line x1="'+prev[0]+'" y1="'+prev[1]+'" x2="'+cx+'" y2="'+cy+
        '" stroke="var(--vz-warn)" stroke-width="2" marker-end="url(#hnA)"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="var(--vz-warn)"/>';
      prev=[cx,cy];
    }
    svg.innerHTML='<defs><marker id="hnA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">'+
      '<path d="M0 0 L10 5 L0 10 z" fill="var(--vz-warn)"/></marker></defs>'+s+
      '<text x="336" y="222" font-size="8.5" text-anchor="end" fill="var(--vz-pos)">◌ the query\'s true nearest neighbour</text>'+
      '<text x="24" y="222" font-size="8.5" fill="currentColor" opacity=".7">comparisons: '+
        (t?PATH.slice(0,t).length*3:0)+' of 24</text>';
    stepEl.textContent = t? ("hop "+t+" of "+PATH.length) : "";
  }
  root.querySelector("#hnGo").addEventListener("click",function(){
    if(timer) clearInterval(timer);
    t=0; draw();
    timer=setInterval(function(){
      t++; draw();
      if(t>=PATH.length){ clearInterval(timer); timer=null;
        note.innerHTML="<b>Found it in "+PATH.length+" hops.</b> The search started at a fixed entry point in the sparse top layer and took big jumps to get roughly close. Then it dropped a layer, where there are more points and therefore finer steps, and refined. At the bottom layer it only had to check a few immediate neighbours. That is roughly <b>18 comparisons instead of 24</b> here — unimpressive at this size, but the saving is logarithmic, so on 10 million vectors it is a few hundred comparisons instead of 10 million.<br><br><b>The catch to remember for interviews:</b> this graph has to live in RAM, which is why HNSW is fast but memory-hungry. And if you add a restrictive metadata filter, most of the graph's neighbours become ineligible, the hops stop landing anywhere useful, and the search can collapse back to scanning everything. That is the usual reason a filtered vector search is mysteriously slow.";
      }
    },520);
  });
  root.querySelector("#hnRst").addEventListener("click",function(){
    if(timer){clearInterval(timer);timer=null;} t=0; draw();
    note.innerHTML="Press <b>Run a search</b> to follow the path.";
  });
  draw();
  root.addEventListener("vz:hide",function(){ if(timer){clearInterval(timer);timer=null;} });
}};

/* ============================================================
   14. RAG PIPELINE — animated flow with failure points
   ============================================================ */
VISUALS["rag-pipeline"] = {
title:"A question's journey through a RAG system",
caption:"Follow one question end to end. Each stage has a job, and each stage has a characteristic way of failing.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><button class="vz-btn" id="rgGo">Send a question</button>'+
    '<label class="vz-tog"><input type="checkbox" id="rgFail"> show what breaks</label></div>'+
    '<div class="vz-flow" id="rgFlow"></div>'+
    '<div class="vz-note" id="rgNote">Press <b>Send a question</b> to walk through the stages.</div>'+
  '</div>';
},
init:function(root){
  var flow=root.querySelector("#rgFlow"), note=root.querySelector("#rgNote");
  var chk=root.querySelector("#rgFail"); var t=-1, timer=null;
  var ST=[
    {n:"Question",d:'"What pressure must the relief valve hold at startup?"',f:"Follow-ups like “and for shutdown?” mean nothing on their own — they must be rewritten into a self-contained question first."},
    {n:"Rewrite",d:"Resolve pronouns, expand abbreviations, make it standalone",f:"Skipped in most tutorials. It is the highest-value stage in any multi-turn product."},
    {n:"Embed",d:"Turn the question into a list of numbers capturing its meaning",f:"If the query is embedded with a different model than the documents were, retrieval is uniformly terrible and nothing else matters."},
    {n:"Search",d:"Keyword + semantic search, fused by RRF",f:"Semantic search alone misses exact codes like “PRV-4471”. Keyword search alone misses paraphrases. You need both."},
    {n:"Filter",d:"Drop anything this user is not permitted to see",f:"Must happen here, from the verified login — never by asking the model to ignore documents. Too strict and you return nothing at all."},
    {n:"Rerank",d:"Re-read the top 50 against the question, keep the best 5",f:"Usually the single biggest quality win. Useless if the right document was never in the top 50 to begin with."},
    {n:"Assemble",d:"Label sources, order them, fit the token budget",f:"Models attend least to the middle of a long prompt, so the best passages go first and last — not in rank order."},
    {n:"Generate",d:"Answer using only the supplied context, with citations",f:"Without explicit permission to say “I don’t know”, the model fills gaps by inventing. Licensing refusal is what makes abstention possible."},
    {n:"Verify",d:"Check every claim is actually supported before it ships",f:"The strongest single control against hallucination, and the stage almost everyone leaves out."}
  ];
  function draw(){
    var showF=chk.checked;
    flow.innerHTML=ST.map(function(s,i){
      var on=i<=t, cur=i===t;
      return '<div class="fl'+(on?" on":"")+(cur?" cur":"")+'">'+
        '<div class="fl-n">'+(i+1)+'</div>'+
        '<div class="fl-b"><b>'+s.n+'</b><span>'+s.d+'</span>'+
        (showF?'<i class="fl-f">'+s.f+'</i>':'')+'</div></div>';
    }).join("");
    if(t>=0&&t<ST.length) note.innerHTML="<b>"+ST[t].n+".</b> "+ST[t].d+".";
    if(t>=ST.length-1) note.innerHTML="<b>Answer delivered with citations.</b> Notice how much of this is retrieval and how little is the model. That ratio is the main thing people get wrong about RAG — when answers are bad, the instinct is to rewrite the prompt, but most of the time the right document simply never made it into the context. Tick <b>show what breaks</b> to see the characteristic failure at each stage.";
  }
  root.querySelector("#rgGo").addEventListener("click",function(){
    if(timer) clearInterval(timer);
    t=-1; draw();
    timer=setInterval(function(){
      t++; draw();
      if(t>=ST.length-1){ clearInterval(timer); timer=null; }
    },620);
  });
  chk.addEventListener("change",draw);
  draw();
  root.addEventListener("vz:hide",function(){ if(timer){clearInterval(timer);timer=null;} });
}};

/* ============================================================
   15. AGENT LOOP — with the caps that stop it running away
   ============================================================ */
VISUALS["agent-loop"] = {
title:"The loop, and the four things that stop it",
caption:"An agent decides its own next step. Which means something other than the agent has to decide when it is finished.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl vz-tabs">'+
      '<button class="vz-btn on" data-s="good">Healthy run</button>'+
      '<button class="vz-btn" data-s="loop">Stuck in a loop</button>'+
      '<button class="vz-btn" data-s="cost">Runaway cost</button>'+
    '</div>'+
    '<figure><svg id="agSvg" viewBox="0 0 340 210" role="img" '+
      'aria-label="The agent think-act-observe loop with step, cost, time and no-progress limits"></svg>'+
      '<figcaption>Every production agent needs all four limits, enforced in code rather than requested in the prompt.</figcaption></figure>'+
    '<div class="vz-note" id="agNote"></div>'+
  '</div>';
},
init:function(root){
  var svg=root.querySelector("#agSvg"), note=root.querySelector("#agNote");
  var btns=root.querySelectorAll(".vz-tabs .vz-btn"), timer=null, k=0, mode="good";
  var RUNS={
    good:[["think","which tool answers this?"],["act","search_docs(\"relief valve\")"],["observe","3 passages returned"],
          ["think","enough to answer"],["done","final answer + citations"]],
    loop:[["think","which tool?"],["act","search_docs(\"valve\")"],["observe","0 results"],
          ["think","try again"],["act","search_docs(\"valve\")"],["observe","0 results"],
          ["think","try again"],["halt","no-progress detector fired"]],
    cost:[["think","plan the research"],["act","search × 8 in parallel"],["observe","94k tokens returned"],
          ["think","summarise all of it"],["act","search × 8 more"],["observe","181k tokens"],
          ["halt","token budget exceeded"]]
  };
  var COL={think:"hi",act:"warn",observe:"pos",done:"pos",halt:"neg"};
  function draw(){
    var run=RUNS[mode], s="", cx=96, cy=92;
    /* the loop ring */
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="52" fill="none" stroke="currentColor" opacity=".2" stroke-width="1.4"/>';
    [["think",-90],["act",30],["observe",150]].forEach(function(pair){
      var ang=pair[1]*Math.PI/180, x=cx+Math.cos(ang)*52, y=cy+Math.sin(ang)*52;
      var active=k>0&&run[Math.min(k-1,run.length-1)][0]===pair[0];
      s+='<circle cx="'+x+'" cy="'+y+'" r="21" fill="var(--vz-card)" stroke="var(--vz-'+COL[pair[0]]+')" '+
         'stroke-width="'+(active?3:1.4)+'" opacity="'+(active?1:.55)+'"/>'+
         '<text x="'+x+'" y="'+(y+3)+'" font-size="8.5" font-weight="600" text-anchor="middle" fill="currentColor">'+pair[0]+'</text>';
    });
    s+='<path d="M'+(cx+14)+' '+(cy-48)+' A52 52 0 0 1 '+(cx+48)+' '+(cy+18)+'" fill="none" stroke="currentColor" opacity=".3" marker-end="url(#agA)"/>';
    s+='<path d="M'+(cx+30)+' '+(cy+42)+' A52 52 0 0 1 '+(cx-44)+' '+(cy+28)+'" fill="none" stroke="currentColor" opacity=".3" marker-end="url(#agA)"/>';
    s+='<path d="M'+(cx-50)+' '+(cy-14)+' A52 52 0 0 1 '+(cx-16)+' '+(cy-49)+'" fill="none" stroke="currentColor" opacity=".3" marker-end="url(#agA)"/>';
    /* transcript */
    run.slice(0,k).forEach(function(r,i){
      var y=22+i*22;
      s+='<rect x="176" y="'+(y-11)+'" width="160" height="18" rx="3" fill="var(--vz-'+COL[r[0]]+')" opacity="'+
         (r[0]==="halt"?".3":".14")+'"/>'+
         '<text x="182" y="'+(y+2)+'" font-size="8" font-weight="700" fill="var(--vz-'+COL[r[0]]+')">'+r[0]+'</text>'+
         '<text x="212" y="'+(y+2)+'" font-size="8" fill="currentColor" opacity=".85">'+r[1]+'</text>';
    });
    /* caps */
    var caps=[["steps",run.length>6?"8 / 8":k+" / 8",mode==="loop"&&k>=8],
              ["tokens",mode==="cost"?"181k / 150k":"12k / 150k",mode==="cost"&&k>=6],
              ["wall clock","14s / 120s",false],
              ["no progress",mode==="loop"&&k>=7?"TRIPPED":"ok",mode==="loop"&&k>=7]];
    caps.forEach(function(c,i){
      s+='<rect x="'+(20+i*80)+'" y="176" width="74" height="26" rx="4" fill="'+
         (c[2]?"var(--vz-neg)":"var(--vz-card)")+'" opacity="'+(c[2]?".25":"1")+'" stroke="'+
         (c[2]?"var(--vz-neg)":"currentColor")+'" stroke-width="'+(c[2]?2:1)+'" '+(c[2]?"":'opacity=".4"')+'/>'+
         '<text x="'+(57+i*80)+'" y="187" font-size="7.5" text-anchor="middle" fill="currentColor" opacity=".7">'+c[0]+'</text>'+
         '<text x="'+(57+i*80)+'" y="197" font-size="9" font-weight="700" text-anchor="middle" fill="'+
         (c[2]?"var(--vz-neg)":"currentColor")+'">'+c[1]+'</text>';
    });
    svg.innerHTML='<defs><marker id="agA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">'+
      '<path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity=".45"/></marker></defs>'+s+
      '<text x="20" y="170" font-size="8" fill="currentColor" opacity=".6">LIMITS, enforced in code:</text>';
  }
  function play(m){
    mode=m;
    Array.prototype.forEach.call(btns,function(b){ b.classList.toggle("on", b.dataset.s===m); });
    if(timer) clearInterval(timer);
    k=0; draw();
    timer=setInterval(function(){
      k++; draw();
      if(k>=RUNS[m].length){
        clearInterval(timer); timer=null;
        note.innerHTML = m==="good"
          ? "<b>A healthy run.</b> Think, act, observe, then recognise it has enough and stop. Short, cheap, and every decision grounded in a real tool result rather than speculation."
          : m==="loop"
          ? "<b>Stuck.</b> The search returns nothing, the agent has no better idea, and it tries the identical call again. Left alone it will do this until it exhausts the step budget, burning money to produce nothing. The fix is a <b>no-progress detector</b>: hash the tool name and arguments, and if you see the same pair twice in a row, break out — either force a different approach or stop and report. A step cap alone would eventually save you, but far more expensively."
          : "<b>Runaway cost.</b> Nothing here is wrong exactly — the agent fanned out searches in parallel, which is good practice, and each tool dutifully returned everything it found. But two rounds of that put 181,000 tokens through the context and blew the budget. The fixes are at the tool boundary: cap how much any single tool may return, paginate, and summarise before appending. One chatty tool can end a run on its own.";
      }
    },560);
  }
  Array.prototype.forEach.call(btns,function(b){
    b.addEventListener("click",function(){ play(b.dataset.s); });
  });
  play("good");
  root.addEventListener("vz:hide",function(){ if(timer){clearInterval(timer);timer=null;} });
}};

})();
