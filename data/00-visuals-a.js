/* Interactive concept visuals — part A: ML, statistics, deep learning.
   Each entry: {title, caption, build() -> html, init(root)}
   SVG uses currentColor + CSS vars so it themes automatically. */

(function(){
"use strict";

/* deterministic pseudo-random so the picture is identical every load */
function lcg(seed){ var s=seed; return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }
function gauss(rnd,mu,sd){ var u=1-rnd(),v=rnd();
  return mu+sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }
function f2(x){ return (Math.round(x*100)/100).toFixed(2); }

/* ============================================================
   1. ROC CURVE  — threshold slider, live confusion, live curve
   ============================================================ */
var R=lcg(7), POS=[], NEG=[];
for(var i=0;i<60;i++)  POS.push(clamp(gauss(R,0.68,0.17),0.01,0.99));
for(var j=0;j<140;j++) NEG.push(clamp(gauss(R,0.34,0.17),0.01,0.99));

function counts(t){
  var tp=0,fn=0,fp=0,tn=0;
  POS.forEach(function(s){ s>=t?tp++:fn++; });
  NEG.forEach(function(s){ s>=t?fp++:tn++; });
  return {tp:tp,fn:fn,fp:fp,tn:tn};
}
function rocPoints(){
  var pts=[];
  for(var t=1.02;t>=-0.02;t-=0.02){
    var c=counts(t);
    pts.push([c.fp/(c.fp+c.tn||1), c.tp/(c.tp+c.fn||1)]);
  }
  return pts;
}
function aucRank(){
  var all=POS.map(function(s){return{s:s,p:1};}).concat(NEG.map(function(s){return{s:s,p:0};}));
  all.sort(function(a,b){return a.s-b.s;});
  var r=0,sum=0;
  all.forEach(function(o,idx){ if(o.p) sum+=idx+1; });
  r=(sum-POS.length*(POS.length+1)/2)/(POS.length*NEG.length);
  return r;
}
function hist(arr,bins){
  var h=new Array(bins).fill(0);
  arr.forEach(function(s){ h[Math.min(bins-1,Math.floor(s*bins))]++; });
  return h;
}

VISUALS.roc = {
title:"Slide the threshold and watch the curve move",
caption:"Each point on an ROC curve is one decision threshold. Sliding it trades missed positives against false alarms; the area under the whole curve is the AUC.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>Decision threshold <output id="rocOut">0.50</output></label>'+
    '<input type="range" id="rocT" min="0" max="1" step="0.01" value="0.5"></div>'+
    '<div class="vz-2col">'+
      '<figure><svg id="rocDist" viewBox="0 0 320 170" role="img" '+
        'aria-label="Score distributions for positive and negative cases with a movable threshold line"></svg>'+
        '<figcaption>Model scores. Where they overlap is where mistakes live.</figcaption></figure>'+
      '<figure><svg id="rocCurve" viewBox="0 0 196 200" role="img" '+
        'aria-label="ROC curve with the current threshold marked"></svg>'+
        '<figcaption>ROC curve. The dot is your current threshold.</figcaption></figure>'+
    '</div>'+
    '<div class="vz-grid4" id="rocNums"></div>'+
  '</div>';
},
init:function(root){
  var slider=root.querySelector("#rocT"), out=root.querySelector("#rocOut");
  var dist=root.querySelector("#rocDist"), curve=root.querySelector("#rocCurve");
  var nums=root.querySelector("#rocNums");
  var hp=hist(POS,20), hn=hist(NEG,20);
  var mx=Math.max.apply(null,hp.concat(hn));
  var pts=rocPoints(), auc=aucRank();

  function draw(){
    var t=parseFloat(slider.value); out.textContent=f2(t);
    var c=counts(t);
    var tpr=c.tp/(c.tp+c.fn||1), fpr=c.fp/(c.fp+c.tn||1);
    var prec=c.tp/(c.tp+c.fp||1), rec=tpr;

    /* --- distributions --- */
    var s='<g stroke="none">';
    for(var b=0;b<20;b++){
      var x=20+b*14, wN=hn[b]/mx*110, wP=hp[b]/mx*110;
      s+='<rect x="'+x+'" y="'+(130-wN)+'" width="6" height="'+wN+'" fill="var(--vz-neg)" opacity=".85"/>';
      s+='<rect x="'+(x+6)+'" y="'+(130-wP)+'" width="6" height="'+wP+'" fill="var(--vz-pos)" opacity=".85"/>';
    }
    s+='</g><line x1="20" y1="130" x2="300" y2="130" stroke="currentColor" stroke-width="1" opacity=".35"/>';
    var tx=20+t*280;
    s+='<line x1="'+tx+'" y1="14" x2="'+tx+'" y2="136" stroke="var(--vz-hi)" stroke-width="2.5"/>'+
       '<text x="'+clamp(tx,34,286)+'" y="10" font-size="9" text-anchor="middle" fill="var(--vz-hi)">threshold</text>'+
       '<text x="20" y="148" font-size="9" fill="currentColor" opacity=".7">score 0</text>'+
       '<text x="300" y="148" font-size="9" text-anchor="end" fill="currentColor" opacity=".7">1</text>'+
       '<text x="20" y="164" font-size="9" fill="var(--vz-neg)">■ actually negative (140)</text>'+
       '<text x="180" y="164" font-size="9" fill="var(--vz-pos)">■ actually positive (60)</text>'+
       '<text x="'+(tx+4)+'" y="126" font-size="8.5" fill="currentColor" opacity=".6">flag →</text>';
    dist.innerHTML=s;

    /* --- roc curve --- */
    var path=pts.map(function(p,i){ return (i?"L":"M")+(20+p[0]*160)+" "+(170-p[1]*160); }).join(" ");
    var area=pts.map(function(p){ return (20+p[0]*160)+","+(170-p[1]*160); }).join(" ");
    curve.innerHTML=
      '<polygon points="20,170 '+area+' 180,170" fill="var(--vz-hi)" opacity=".13"/>'+
      '<line x1="20" y1="170" x2="180" y2="10" stroke="currentColor" stroke-dasharray="3 3" opacity=".4"/>'+
      '<path d="'+path+'" fill="none" stroke="var(--vz-hi)" stroke-width="2.2"/>'+
      '<line x1="20" y1="170" x2="180" y2="170" stroke="currentColor" opacity=".45"/>'+
      '<line x1="20" y1="170" x2="20" y2="10" stroke="currentColor" opacity=".45"/>'+
      '<circle cx="'+(20+fpr*160)+'" cy="'+(170-tpr*160)+'" r="5" fill="var(--vz-hi)" stroke="var(--vz-card)" stroke-width="2"/>'+
      '<text x="100" y="190" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">false alarm rate →</text>'+
      '<text x="10" y="90" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7" transform="rotate(-90 10 90)">caught rate →</text>'+
      '<text x="182" y="128" font-size="12" font-weight="700" text-anchor="end" fill="var(--vz-hi)">AUC '+f2(auc)+'</text>'+
      '<text x="182" y="140" font-size="7.5" text-anchor="end" fill="currentColor" opacity=".6">one number for the</text>'+
      '<text x="182" y="150" font-size="7.5" text-anchor="end" fill="currentColor" opacity=".6">whole curve</text>';

    /* --- numbers --- */
    nums.innerHTML=
      tile("Caught (recall)",Math.round(rec*100)+"%",c.tp+" of 60 positives found","ok")+
      tile("Trustworthy (precision)",Math.round(prec*100)+"%","of "+(c.tp+c.fp)+" flagged, "+c.tp+" were real","hi")+
      tile("False alarms",String(c.fp),"real negatives wrongly flagged","warn")+
      tile("Missed",String(c.fn),"real positives that slipped through","warn");
  }
  slider.addEventListener("input",draw); draw();
}};

function tile(label,val,sub,kind){
  return '<div class="vz-tile k-'+(kind||"")+'"><b>'+val+'</b><span>'+label+'</span><i>'+sub+'</i></div>';
}

/* ============================================================
   2. PRECISION vs RECALL — same data, business-cost framing
   ============================================================ */
VISUALS["prec-recall"] = {
title:"Precision and recall pull against each other",
caption:"You cannot raise both by moving the threshold — only by improving the model. What you choose depends on which mistake costs more.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>Threshold <output id="prOut">0.50</output></label>'+
    '<input type="range" id="prT" min="0.05" max="0.95" step="0.01" value="0.5"></div>'+
    '<figure><svg id="prCurve" viewBox="0 0 320 180" role="img" '+
      'aria-label="Precision, recall and F1 plotted against the decision threshold"></svg>'+
      '<figcaption>As the threshold rises, precision climbs and recall falls. F1 peaks somewhere in between.</figcaption></figure>'+
    '<div class="vz-note" id="prNote"></div>'+
  '</div>';
},
init:function(root){
  var sl=root.querySelector("#prT"), out=root.querySelector("#prOut");
  var svg=root.querySelector("#prCurve"), note=root.querySelector("#prNote");
  var P=[],Rc=[],F=[];
  for(var k=0;k<=100;k++){
    var t=k/100, c=counts(t);
    var p=c.tp/(c.tp+c.fp||1), r=c.tp/(c.tp+c.fn||1);
    P.push(p); Rc.push(r); F.push(p+r?2*p*r/(p+r):0);
  }
  function line(arr,color,w){
    return '<path d="'+arr.map(function(v,k){ return (k?"L":"M")+(28+k*2.7)+" "+(150-v*130); }).join(" ")+
      '" fill="none" stroke="'+color+'" stroke-width="'+(w||2)+'"/>';
  }
  function draw(){
    var t=parseFloat(sl.value); out.textContent=f2(t);
    var idx=Math.round(t*100), x=28+idx*2.7;
    svg.innerHTML=
      '<line x1="28" y1="150" x2="298" y2="150" stroke="currentColor" opacity=".45"/>'+
      '<line x1="28" y1="150" x2="28" y2="16" stroke="currentColor" opacity=".45"/>'+
      '<text x="20" y="22" font-size="9" text-anchor="end" fill="currentColor" opacity=".6">1.0</text>'+
      '<text x="20" y="153" font-size="9" text-anchor="end" fill="currentColor" opacity=".6">0</text>'+
      line(P,"var(--vz-hi)")+line(Rc,"var(--vz-pos)")+line(F,"var(--vz-warn)",1.6)+
      '<line x1="'+x+'" y1="16" x2="'+x+'" y2="150" stroke="currentColor" stroke-width="1.5" opacity=".55" stroke-dasharray="3 3"/>'+
      '<circle cx="'+x+'" cy="'+(150-P[idx]*130)+'" r="4" fill="var(--vz-hi)"/>'+
      '<circle cx="'+x+'" cy="'+(150-Rc[idx]*130)+'" r="4" fill="var(--vz-pos)"/>'+
      '<text x="304" y="'+(150-P[100]*130-4)+'" font-size="9" text-anchor="end" fill="var(--vz-hi)">precision</text>'+
      '<text x="34" y="'+(150-Rc[0]*130-6)+'" font-size="9" fill="var(--vz-pos)">recall</text>'+
      '<text x="150" y="'+(150-Math.max.apply(null,F)*130-7)+'" font-size="9" text-anchor="middle" fill="var(--vz-warn)">F1</text>'+
      '<text x="163" y="172" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">strict threshold →</text>';
    var p=P[idx],r=Rc[idx];
    var msg = t>0.7
      ? "<b>High threshold.</b> You only flag cases you are sure about, so almost every alarm is real — but you are missing "+Math.round((1-r)*100)+"% of the genuine positives. This is what you want for auto-blocking a payment or filing something automatically, where a false alarm is visible and costly."
      : t<0.35
      ? "<b>Low threshold.</b> You catch "+Math.round(r*100)+"% of genuine positives, but only "+Math.round(p*100)+"% of your alarms are real. This is what you want for cancer screening or fraud triage, where a miss is far worse than a review — provided someone has capacity to review the queue."
      : "<b>Balanced.</b> Precision "+Math.round(p*100)+"%, recall "+Math.round(r*100)+"%. Reasonable when both errors cost about the same — which in real business problems is rarer than people assume.";
    note.innerHTML=msg;
  }
  sl.addEventListener("input",draw); draw();
}};

/* ============================================================
   3. BIAS-VARIANCE — complexity slider with train/test error
   ============================================================ */
VISUALS["bias-variance"] = {
title:"Underfitting, fitting, and memorising",
caption:"Drag complexity up. Training error always falls; test error falls then rises. The gap between the two lines is variance; the height of both together is bias.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>Model complexity (polynomial degree <output id="bvOut">3</output>)</label>'+
    '<input type="range" id="bvD" min="1" max="14" step="1" value="3"></div>'+
    '<div class="vz-2col">'+
      '<figure><svg id="bvFit" viewBox="0 0 260 180" role="img" '+
        'aria-label="A curve fitted through training points at the selected complexity"></svg>'+
        '<figcaption>The fit. Hollow dots are unseen test points.</figcaption></figure>'+
      '<figure><svg id="bvErr" viewBox="0 0 260 180" role="img" '+
        'aria-label="Training and test error plotted against model complexity"></svg>'+
        '<figcaption>Error against complexity. The sweet spot is the dip.</figcaption></figure>'+
    '</div>'+
    '<div class="vz-note" id="bvNote"></div>'+
  '</div>';
},
init:function(root){
  var sl=root.querySelector("#bvD"), out=root.querySelector("#bvOut");
  var fitSvg=root.querySelector("#bvFit"), errSvg=root.querySelector("#bvErr");
  var note=root.querySelector("#bvNote");
  var rnd=lcg(21), truth=function(x){ return Math.sin(x*Math.PI*1.35)*0.62+0.5; };
  var TR=[],TE=[],n=14;
  for(var i=0;i<n;i++){ var x=i/(n-1); TR.push([x,clamp(truth(x)+gauss(rnd,0,0.085),0.02,0.98)]); }
  for(var k=0;k<12;k++){ var xx=(k+0.5)/12; TE.push([xx,clamp(truth(xx)+gauss(rnd,0,0.085),0.02,0.98)]); }

  function polyfit(pts,deg){
    var m=deg+1,A=[],b=[];
    for(var r=0;r<m;r++){
      A.push(new Array(m).fill(0)); b.push(0);
      for(var c=0;c<m;c++) pts.forEach(function(p){ A[r][c]+=Math.pow(p[0],r+c); });
      pts.forEach(function(p){ b[r]+=Math.pow(p[0],r)*p[1]; });
    }
    for(var i2=0;i2<m;i2++){
      var piv=i2;
      for(var r2=i2+1;r2<m;r2++) if(Math.abs(A[r2][i2])>Math.abs(A[piv][i2])) piv=r2;
      var tA=A[i2];A[i2]=A[piv];A[piv]=tA; var tb=b[i2];b[i2]=b[piv];b[piv]=tb;
      if(Math.abs(A[i2][i2])<1e-12) A[i2][i2]=1e-12;
      for(var r3=i2+1;r3<m;r3++){
        var f=A[r3][i2]/A[i2][i2];
        for(var c3=i2;c3<m;c3++) A[r3][c3]-=f*A[i2][c3];
        b[r3]-=f*b[i2];
      }
    }
    var co=new Array(m).fill(0);
    for(var i3=m-1;i3>=0;i3--){
      var s=b[i3];
      for(var c4=i3+1;c4<m;c4++) s-=A[i3][c4]*co[c4];
      co[i3]=s/A[i3][i3];
    }
    return co;
  }
  function ev(co,x){ var s=0; for(var i=0;i<co.length;i++) s+=co[i]*Math.pow(x,i); return s; }
  function mse(co,pts){ var s=0; pts.forEach(function(p){ var d=ev(co,p[0])-p[1]; s+=d*d; }); return s/pts.length; }

  var curves={},trE=[],teE=[];
  for(var d=1;d<=14;d++){ var co=polyfit(TR,d); curves[d]=co; trE.push(mse(co,TR)); teE.push(mse(co,TE)); }
  var maxE=0.09;

  function draw(){
    var d=parseInt(sl.value,10); out.textContent=d;
    var co=curves[d], path="";
    for(var px=0;px<=100;px++){
      var x=px/100, y=clamp(ev(co,x),-0.4,1.4);
      path+=(px?"L":"M")+(24+x*214)+" "+(154-y*130);
    }
    var pts="";
    TR.forEach(function(p){ pts+='<circle cx="'+(24+p[0]*214)+'" cy="'+(154-p[1]*130)+'" r="3.4" fill="var(--vz-hi)"/>'; });
    TE.forEach(function(p){ pts+='<circle cx="'+(24+p[0]*214)+'" cy="'+(154-p[1]*130)+'" r="3.4" fill="none" stroke="var(--vz-pos)" stroke-width="1.6"/>'; });
    var tp="";
    for(var tx=0;tx<=100;tx++){ var xv=tx/100; tp+=(tx?"L":"M")+(24+xv*214)+" "+(154-truth(xv)*130); }
    fitSvg.innerHTML=
      '<clipPath id="bvClip"><rect x="20" y="8" width="222" height="150"/></clipPath>'+
      '<path d="'+tp+'" fill="none" stroke="currentColor" opacity=".3" stroke-dasharray="4 3" stroke-width="1.4"/>'+
      '<g clip-path="url(#bvClip)"><path d="'+path+'" fill="none" stroke="var(--vz-warn)" stroke-width="2.4"/></g>'+
      pts+
      '<line x1="24" y1="158" x2="238" y2="158" stroke="currentColor" opacity=".4"/>'+
      '<text x="24" y="174" font-size="8.5" fill="currentColor" opacity=".6">dashed = the real pattern</text>';

    function ep(arr,color){
      return '<path d="'+arr.map(function(v,i){
        return (i?"L":"M")+(28+i*15.5)+" "+(150-clamp(v/maxE,0,1)*128);
      }).join(" ")+'" fill="none" stroke="'+color+'" stroke-width="2.2"/>';
    }
    var cx=28+(d-1)*15.5;
    var best=teE.indexOf(Math.min.apply(null,teE))+1;
    errSvg.innerHTML=
      '<line x1="28" y1="150" x2="248" y2="150" stroke="currentColor" opacity=".45"/>'+
      '<line x1="28" y1="150" x2="28" y2="14" stroke="currentColor" opacity=".45"/>'+
      '<rect x="'+(28+(best-1)*15.5-7)+'" y="14" width="14" height="136" fill="var(--vz-pos)" opacity=".12"/>'+
      ep(trE,"var(--vz-hi)")+ep(teE,"var(--vz-pos)")+
      '<line x1="'+cx+'" y1="14" x2="'+cx+'" y2="150" stroke="currentColor" opacity=".5" stroke-dasharray="3 3"/>'+
      '<circle cx="'+cx+'" cy="'+(150-clamp(trE[d-1]/maxE,0,1)*128)+'" r="4" fill="var(--vz-hi)"/>'+
      '<circle cx="'+cx+'" cy="'+(150-clamp(teE[d-1]/maxE,0,1)*128)+'" r="4" fill="var(--vz-pos)"/>'+
      '<text x="34" y="26" font-size="9" fill="var(--vz-pos)">test error</text>'+
      '<text x="34" y="140" font-size="9" fill="var(--vz-hi)">training error</text>'+
      '<text x="138" y="170" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">more complex →</text>';

    var msg = d<=2
      ? "<b>Underfitting — high bias.</b> The curve is too rigid to follow the real pattern, so it is wrong on training data <em>and</em> test data. More data will not help. You need more capacity or better features."
      : d>=9
      ? "<b>Overfitting — high variance.</b> The curve now passes almost exactly through the training dots, including their noise, and swings wildly between them. Training error is near zero while test error has climbed. This is memorisation, not learning."
      : "<b>About right.</b> The curve follows the underlying pattern without chasing individual points. Training and test error are both low and close together — that small gap is what you are aiming for.";
    note.innerHTML=msg;
  }
  sl.addEventListener("input",draw); draw();
}};

/* ============================================================
   4. GRADIENT DESCENT — animated ball, learning-rate slider
   ============================================================ */
VISUALS["gradient-descent"] = {
title:"Walking downhill in fog",
caption:"Training measures the slope where it stands and steps downhill. The learning rate is the step size — too small and it crawls, too large and it overshoots and never settles.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>Learning rate <output id="gdOut">0.60</output></label>'+
    '<input type="range" id="gdLr" min="0.02" max="2.6" step="0.02" value="0.6">'+
    '<button class="vz-btn" id="gdRun">Run training</button>'+
    '<button class="vz-btn ghost" id="gdReset">Reset</button></div>'+
    '<figure><svg id="gdSvg" viewBox="0 0 340 190" role="img" '+
      'aria-label="A ball descending a loss curve, one gradient step at a time"></svg>'+
      '<figcaption>The curve is the error for every possible parameter value. Training cannot see the whole curve — only the slope underfoot.</figcaption></figure>'+
    '<div class="vz-note" id="gdNote">Press <b>Run training</b>. Then push the learning rate above about 2.0 and run it again.</div>'+
  '</div>';
},
init:function(root){
  var sl=root.querySelector("#gdLr"), out=root.querySelector("#gdOut");
  var svg=root.querySelector("#gdSvg"), note=root.querySelector("#gdNote");
  var runBtn=root.querySelector("#gdRun"), resetBtn=root.querySelector("#gdReset");
  var L=function(w){ return w*w/9+Math.sin(w*1.5)*0.55+1.6; };
  var dL=function(w){ return 2*w/9+Math.cos(w*1.5)*0.825; };
  var W0=-7.4, w=W0, trail=[], timer=null, steps=0;

  function X(wv){ return 22+(wv+9)/18*296; }
  function Y(lv){ return 158-clamp(lv/9,0,1)*132; }

  function draw(){
    var path="";
    for(var i=0;i<=160;i++){ var wv=-9+i/160*18; path+=(i?"L":"M")+X(wv)+" "+Y(L(wv)); }
    var tr=trail.map(function(p,i){ return (i?"L":"M")+X(p)+" "+Y(L(p)); }).join(" ");
    var dots=trail.map(function(p){
      return '<circle cx="'+X(p)+'" cy="'+Y(L(p))+'" r="2.4" fill="var(--vz-hi)" opacity=".45"/>';
    }).join("");
    var slope=dL(w), ang=Math.atan2(-slope*14.6,16.4);
    var ax=X(w), ay=Y(L(w));
    svg.innerHTML=
      '<defs><marker id="gdA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">'+
      '<path d="M0 0 L10 5 L0 10 z" fill="var(--vz-warn)"/></marker></defs>'+
      '<path d="'+path+'" fill="none" stroke="currentColor" stroke-width="2" opacity=".55"/>'+
      '<path d="'+tr+'" fill="none" stroke="var(--vz-hi)" stroke-width="1.4" opacity=".5" stroke-dasharray="2 2"/>'+
      dots+
      '<line x1="'+(ax-Math.cos(ang)*26)+'" y1="'+(ay-Math.sin(ang)*26)+'" x2="'+(ax+Math.cos(ang)*26)+'" y2="'+(ay+Math.sin(ang)*26)+
        '" stroke="var(--vz-warn)" stroke-width="2" marker-end="url(#gdA)"/>'+
      '<circle cx="'+ax+'" cy="'+ay+'" r="6.5" fill="var(--vz-hi)" stroke="var(--vz-card)" stroke-width="2"/>'+
      '<line x1="22" y1="162" x2="318" y2="162" stroke="currentColor" opacity=".35"/>'+
      '<text x="170" y="180" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">parameter value →</text>'+
      '<text x="10" y="90" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7" transform="rotate(-90 10 90)">error →</text>'+
      '<text x="318" y="20" font-size="9.5" text-anchor="end" fill="currentColor">step '+steps+'  ·  error '+f2(L(w))+'</text>'+
      '<text x="'+clamp(ax,40,300)+'" y="'+clamp(ay-14,14,150)+'" font-size="8.5" text-anchor="middle" fill="var(--vz-warn)">slope '+f2(slope)+'</text>';
  }
  function stop(){ if(timer){ clearInterval(timer); timer=null; } }
  function reset(){ stop(); w=W0; trail=[W0]; steps=0; draw();
    note.innerHTML="Press <b>Run training</b>. Then push the learning rate above about 2.0 and run it again."; }
  function run(){
    stop(); w=W0; trail=[W0]; steps=0;
    var lr=parseFloat(sl.value);
    timer=setInterval(function(){
      var g=dL(w);
      w=clamp(w-lr*g,-9,9); trail.push(w); steps++;
      draw();
      if(steps>=60||Math.abs(g)<0.004){
        stop();
        var settled=Math.abs(dL(w))<0.02;
        note.innerHTML = lr>1.9
          ? "<b>Learning rate too high.</b> Each step overshoots the bottom and lands on the far side, so it bounces around instead of settling. In a real network this is how you get a loss that jumps around or turns into NaN."
          : lr<0.12
          ? "<b>Learning rate too low.</b> After "+steps+" steps it is still creeping. It will get there eventually, but you are burning compute — and on a real model that is hours of GPU time."
          : settled
          ? "<b>Settled.</b> It reached a minimum in "+steps+" steps and the slope is now flat. Note it may have stopped in a <em>local</em> dip rather than the deepest one — which is exactly why a bit of noise from mini-batching is useful."
          : "Stopped after "+steps+" steps, still moving. Nudge the learning rate up a little.";
      }
    },55);
  }
  sl.addEventListener("input",function(){ out.textContent=f2(parseFloat(sl.value)); });
  runBtn.addEventListener("click",run); resetBtn.addEventListener("click",reset);
  out.textContent=f2(parseFloat(sl.value)); reset();
  root.addEventListener("vz:hide",stop);
}};

/* ============================================================
   5. BACKPROPAGATION — forward then backward, with real numbers
   ============================================================ */
VISUALS.backprop = {
title:"One forward pass, one backward pass",
caption:"Forward, each neuron combines its inputs. Backward, the error is handed back and each weight learns how much it contributed — by multiplying the slopes along its path.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><button class="vz-btn" id="bpFwd">1 · Forward pass</button>'+
    '<button class="vz-btn" id="bpBwd">2 · Backward pass</button>'+
    '<button class="vz-btn ghost" id="bpRst">Reset</button></div>'+
    '<figure><svg id="bpSvg" viewBox="0 0 340 200" role="img" '+
      'aria-label="A two-input, two-hidden-neuron, one-output network showing forward values and backward gradients"></svg>'+
      '<figcaption>Two inputs, two hidden neurons, one output. Target = 1.0.</figcaption></figure>'+
    '<div class="vz-note" id="bpNote">Press <b>Forward pass</b> to push the inputs through the network.</div>'+
  '</div>';
},
init:function(root){
  var svg=root.querySelector("#bpSvg"), note=root.querySelector("#bpNote");
  var phase=0;
  var x1=0.9,x2=0.4,y=1.0;
  var w11=0.5,w21=-0.6,w12=0.8,w22=0.3,v1=0.7,v2=-0.4;
  var sg=function(z){ return 1/(1+Math.exp(-z)); };
  var zh1=w11*x1+w21*x2, h1=sg(zh1);
  var zh2=w12*x1+w22*x2, h2=sg(zh2);
  var zo=v1*h1+v2*h2, yh=sg(zo);
  var dLdy=yh-y;                       /* BCE + sigmoid → (ŷ − y) */
  var dv1=dLdy*h1, dv2=dLdy*h2;
  var dh1=dLdy*v1*h1*(1-h1), dh2=dLdy*v2*h2*(1-h2);
  var dw11=dh1*x1, dw21=dh1*x2, dw12=dh2*x1, dw22=dh2*x2;

  var N={x1:[34,62],x2:[34,140],h1:[150,52],h2:[150,150],o:[268,100]};
  function node(p,lab,val,show,kind){
    return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="20" fill="var(--vz-card)" stroke="'+
      (show?"var(--vz-"+kind+")":"currentColor")+'" stroke-width="'+(show?2.4:1.4)+'" '+
      (show?"":'opacity=".5"')+'/>'+
      '<text x="'+p[0]+'" y="'+(p[1]-3)+'" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">'+lab+'</text>'+
      '<text x="'+p[0]+'" y="'+(p[1]+9)+'" font-size="10.5" font-weight="700" text-anchor="middle" fill="'+
        (show?"var(--vz-"+kind+")":"currentColor")+'"'+(show?"":' opacity=".35"')+'>'+(show?val:"?")+'</text>';
  }
  function edge(a,b,w,grad,mode){
    var ax=N[a][0],ay=N[a][1],bx=N[b][0],by=N[b][1];
    var dx=bx-ax,dy=by-ay,len=Math.sqrt(dx*dx+dy*dy);
    var sx=ax+dx/len*20, sy=ay+dy/len*20, ex=bx-dx/len*20, ey=by-dy/len*20;
    var col=mode===2?"var(--vz-warn)":"currentColor";
    var lw=mode===2?Math.min(4,1+Math.abs(grad)*26):1.5;
    return '<line x1="'+(mode===2?ex:sx)+'" y1="'+(mode===2?ey:sy)+'" x2="'+(mode===2?sx:ex)+'" y2="'+(mode===2?sy:ey)+
      '" stroke="'+col+'" stroke-width="'+lw+'" opacity="'+(mode?0.95:0.4)+'" marker-end="url(#bpA'+(mode===2?"b":"f")+')"/>'+
      '<text x="'+((sx+ex)/2)+'" y="'+((sy+ey)/2-4)+'" font-size="8.5" text-anchor="middle" fill="'+
        (mode===2?"var(--vz-warn)":"currentColor")+'" opacity="'+(mode===2?1:.75)+'">'+
        (mode===2?"∂"+f2(Math.abs(grad)):f2(w))+'</text>';
  }
  function draw(){
    var f=phase>=1, b=phase>=2;
    svg.innerHTML=
      '<defs>'+
      '<marker id="bpAf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity=".5"/></marker>'+
      '<marker id="bpAb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--vz-warn)"/></marker>'+
      '</defs>'+
      edge("x1","h1",w11,dw11,b?2:f?1:0)+edge("x2","h1",w21,dw21,b?2:f?1:0)+
      edge("x1","h2",w12,dw12,b?2:f?1:0)+edge("x2","h2",w22,dw22,b?2:f?1:0)+
      edge("h1","o",v1,dv1,b?2:f?1:0)+edge("h2","o",v2,dv2,b?2:f?1:0)+
      node(N.x1,"x₁",f2(x1),true,"hi")+node(N.x2,"x₂",f2(x2),true,"hi")+
      node(N.h1,"h₁",f2(h1),f,"pos")+node(N.h2,"h₂",f2(h2),f,"pos")+
      node(N.o,"ŷ",f2(yh),f,b?"warn":"pos")+
      '<text x="300" y="96" font-size="9" fill="currentColor" opacity=".7">target</text>'+
      '<text x="300" y="108" font-size="12" font-weight="700" fill="var(--vz-pos)">1.00</text>'+
      (b?'<text x="268" y="146" font-size="9.5" text-anchor="middle" fill="var(--vz-warn)">error '+f2(dLdy)+'</text>':'')+
      '<text x="34" y="184" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".6">inputs</text>'+
      '<text x="150" y="184" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".6">hidden</text>'+
      '<text x="268" y="184" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".6">output</text>';
    if(phase===0) note.innerHTML="Press <b>Forward pass</b> to push the inputs through the network.";
    if(phase===1) note.innerHTML="<b>Forward done.</b> Each neuron multiplied its inputs by the edge weights, added them up and squashed the result with a sigmoid. The output is "+f2(yh)+" but the target is 1.00, so we are off by "+f2(Math.abs(dLdy))+". Now press <b>Backward pass</b>.";
    if(phase===2) note.innerHTML="<b>Backward done.</b> The error travels back along every edge, and the numbers on the edges are each weight's share of the blame — thicker means a bigger update. Notice w₁₁ gets a gradient of "+f2(Math.abs(dw11))+": that is the output error "+f2(Math.abs(dLdy))+" multiplied by v₁, by h₁'s own slope, and by x₁. <b>Multiply the slopes along the path — that is the whole of backpropagation.</b>";
  }
  root.querySelector("#bpFwd").addEventListener("click",function(){ phase=1; draw(); });
  root.querySelector("#bpBwd").addEventListener("click",function(){ phase=2; draw(); });
  root.querySelector("#bpRst").addEventListener("click",function(){ phase=0; draw(); });
  draw();
}};

/* ============================================================
   6. BAGGING vs BOOSTING — parallel vs sequential
   ============================================================ */
VISUALS["bagging-boosting"] = {
title:"Built side by side, or built to fix each other",
caption:"Bagging trains independent models on random samples and averages them, which cancels noise. Boosting trains them in sequence, each one targeting what the last got wrong.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><button class="vz-btn" id="bbPlay">Play both</button>'+
    '<span class="vz-step" id="bbStep">round 0 of 4</span></div>'+
    '<figure><svg id="bbSvg" viewBox="0 0 340 215" role="img" '+
      'aria-label="Bagging trains four trees in parallel from random samples; boosting trains four trees in sequence on the previous errors"></svg>'+
      '<figcaption>Same four models, two very different ways of arranging them.</figcaption></figure>'+
    '<div class="vz-note" id="bbNote">Bagging can use all four processors at once. Boosting cannot start tree 2 until tree 1 is finished.</div>'+
  '</div>';
},
init:function(root){
  var svg=root.querySelector("#bbSvg"), stepEl=root.querySelector("#bbStep");
  var note=root.querySelector("#bbNote"), timer=null, k=0;
  function tree(x,y,on,lab,sub){
    return '<g opacity="'+(on?1:.25)+'">'+
      '<rect x="'+x+'" y="'+y+'" width="46" height="30" rx="5" fill="var(--vz-card)" stroke="'+
        (on?"var(--vz-hi)":"currentColor")+'" stroke-width="'+(on?2:1.2)+'"/>'+
      '<text x="'+(x+23)+'" y="'+(y+14)+'" font-size="9.5" font-weight="600" text-anchor="middle" fill="currentColor">'+lab+'</text>'+
      '<text x="'+(x+23)+'" y="'+(y+24)+'" font-size="7.5" text-anchor="middle" fill="currentColor" opacity=".7">'+sub+'</text></g>';
  }
  function draw(){
    stepEl.textContent="round "+k+" of 4";
    var bag="",boo="";
    for(var i=0;i<4;i++){
      var on=k>i;
      bag+=tree(70+i*64,28,on,"tree "+(i+1),"sample "+(i+1));
      bag+= on?'<line x1="'+(93+i*64)+'" y1="58" x2="170" y2="76" stroke="var(--vz-hi)" stroke-width="1.2" opacity=".5"/>':"";
      boo+=tree(24+i*78,146,on,"tree "+(i+1),i?"fix errors":"first fit");
      if(i<3) boo+='<line x1="'+(70+i*78)+'" y1="161" x2="'+(24+(i+1)*78)+'" y2="161" stroke="'+
        (k>i+1?"var(--vz-warn)":"currentColor")+'" stroke-width="'+(k>i+1?2:1)+'" opacity="'+(k>i+1?1:.3)+
        '" marker-end="url(#bbA)"/>';
    }
    svg.innerHTML=
      '<defs><marker id="bbA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">'+
      '<path d="M0 0 L10 5 L0 10 z" fill="var(--vz-warn)"/></marker></defs>'+
      '<text x="8" y="16" font-size="10" font-weight="700" fill="var(--vz-hi)">BAGGING — all at once</text>'+
      '<text x="8" y="43" font-size="8.5" fill="currentColor" opacity=".7">random</text>'+
      '<text x="8" y="53" font-size="8.5" fill="currentColor" opacity=".7">samples</text>'+
      bag+
      '<rect x="140" y="74" width="62" height="24" rx="5" fill="var(--vz-hi)" opacity="'+(k>=4?".2":".06")+
        '" stroke="var(--vz-hi)" stroke-width="'+(k>=4?2:1)+'"/>'+
      '<text x="171" y="90" font-size="9" font-weight="600" text-anchor="middle" fill="currentColor" opacity="'+(k>=4?1:.4)+'">average</text>'+
      '<line x1="4" y1="116" x2="336" y2="116" stroke="currentColor" opacity=".2"/>'+
      '<text x="8" y="134" font-size="10" font-weight="700" fill="var(--vz-warn)">BOOSTING — one after another</text>'+
      boo+
      '<text x="170" y="200" font-size="8.5" text-anchor="middle" fill="currentColor" opacity=".65">each arrow carries the previous tree\'s mistakes</text>';
  }
  root.querySelector("#bbPlay").addEventListener("click",function(){
    if(timer) clearInterval(timer);
    k=0; draw();
    timer=setInterval(function(){
      k++; draw();
      if(k>=4){ clearInterval(timer); timer=null;
        note.innerHTML="<b>Bagging</b> finished in one round of wall-clock time because the four trees never needed each other — that is why it parallelises perfectly, and why averaging independent models cancels out their individual noise (it reduces <em>variance</em>). <b>Boosting</b> took four sequential rounds because tree 2 needs tree 1's errors to exist. Slower, but each tree corrects a systematic mistake, so it reduces <em>bias</em> and usually ends up more accurate — at the cost of overfitting if you run too many rounds.";
      }
    },620);
  });
  draw();
  root.addEventListener("vz:hide",function(){ if(timer){clearInterval(timer);timer=null;} });
}};

/* ============================================================
   7. DRIFT — distributions sliding apart, live PSI
   ============================================================ */
VISUALS.drift = {
title:"Watch a model go stale",
caption:"Nothing about the model changed. The world did. PSI measures how far live data has moved from what the model was trained on.",
build:function(){
  return '<div class="vz">'+
    '<div class="vz-ctl"><label>Months since training <output id="drOut">0</output></label>'+
    '<input type="range" id="drT" min="0" max="12" step="1" value="0"></div>'+
    '<figure><svg id="drSvg" viewBox="0 0 340 170" role="img" '+
      'aria-label="Training and live data distributions drifting apart with a population stability index readout"></svg>'+
      '<figcaption>Filled bars: the data the model learned from. Outlined bars: what it is seeing now.</figcaption></figure>'+
    '<div class="vz-note" id="drNote"></div>'+
  '</div>';
},
init:function(root){
  var sl=root.querySelector("#drT"), out=root.querySelector("#drOut");
  var svg=root.querySelector("#drSvg"), note=root.querySelector("#drNote");
  var B=16;
  function bins(mu,sd){
    var a=[],tot=0;
    for(var i=0;i<B;i++){ var x=(i+0.5)/B; var v=Math.exp(-Math.pow(x-mu,2)/(2*sd*sd)); a.push(v); tot+=v; }
    return a.map(function(v){ return v/tot; });
  }
  var base=bins(0.38,0.13);
  function psi(e,a){
    var s=0;
    for(var i=0;i<B;i++){ var ei=Math.max(e[i],0.0001), ai=Math.max(a[i],0.0001); s+=(ai-ei)*Math.log(ai/ei); }
    return s;
  }
  function draw(){
    var m=parseInt(sl.value,10); out.textContent=m;
    var cur=bins(0.38+m*0.026,0.13+m*0.0075);
    var p=psi(base,cur);
    var mx=Math.max(Math.max.apply(null,base),Math.max.apply(null,cur));
    var s="";
    for(var i=0;i<B;i++){
      var x=24+i*19, hb=base[i]/mx*104, hc=cur[i]/mx*104;
      s+='<rect x="'+x+'" y="'+(126-hb)+'" width="8" height="'+hb+'" fill="var(--vz-hi)" opacity=".5"/>';
      s+='<rect x="'+(x+8)+'" y="'+(126-hc)+'" width="8" height="'+hc+'" fill="none" stroke="var(--vz-warn)" stroke-width="1.6"/>';
    }
    var band = p<0.1?["stable","pos"]:p<0.25?["investigate","warn"]:["act now","neg"];
    svg.innerHTML=s+
      '<line x1="24" y1="126" x2="328" y2="126" stroke="currentColor" opacity=".4"/>'+
      '<text x="24" y="140" font-size="8.5" fill="currentColor" opacity=".65">low feature value</text>'+
      '<text x="328" y="140" font-size="8.5" text-anchor="end" fill="currentColor" opacity=".65">high</text>'+
      '<text x="24" y="156" font-size="8.5" fill="var(--vz-hi)">▬ training data</text>'+
      '<text x="130" y="156" font-size="8.5" fill="var(--vz-warn)">▭ live data, month '+m+'</text>'+
      '<text x="328" y="18" font-size="13" font-weight="700" text-anchor="end" fill="var(--vz-'+band[1]+')">PSI '+f2(p)+'</text>'+
      '<text x="328" y="30" font-size="9" text-anchor="end" fill="var(--vz-'+band[1]+')">'+band[0]+'</text>';
    note.innerHTML = p<0.1
      ? "<b>PSI "+f2(p)+" — below 0.1, stable.</b> The live data still looks like the training data. Nothing to do."
      : p<0.25
      ? "<b>PSI "+f2(p)+" — between 0.1 and 0.25, moderate shift.</b> Worth investigating, not panicking. And investigate <em>before</em> retraining: far more often than not this turns out to be an upstream pipeline change or plain seasonality, and retraining on broken data bakes the problem in."
      : "<b>PSI "+f2(p)+" — above 0.25, significant shift.</b> The model is now making predictions on a population it never learned. Check for a data bug first, then retrain on recent data and gate the new model against the current one on a frozen out-of-time holdout.";
  }
  sl.addEventListener("input",draw); draw();
}};

})();
