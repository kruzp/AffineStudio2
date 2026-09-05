/* Affine Studio — theme, menu, the canvas trace field and scroll morph.
   No dependencies. Loaded at the end of <body>. */

(function(){
  "use strict";
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root=document.documentElement;

  /* ===================== theme: light is default ===================== */
  var bL=document.getElementById('tLight'), bD=document.getElementById('tDark');
  function get(){try{return localStorage.getItem('affine-theme');}catch(e){return null;}}
  function put(v){try{localStorage.setItem('affine-theme',v);}catch(e){}}
  var PAL={};
  function paint(){
    var cs=getComputedStyle(root);
    PAL={
      line:cs.getPropertyValue('--line').trim(),
      hi:cs.getPropertyValue('--line-hi').trim(),
      etch:cs.getPropertyValue('--etch').trim(),
      grid:cs.getPropertyValue('--grid').trim(),
      text:cs.getPropertyValue('--text').trim(),
      dim:cs.getPropertyValue('--dim').trim(),
      faint:cs.getPropertyValue('--faint').trim(),
      bg:cs.getPropertyValue('--bg').trim(),
      a:parseFloat(cs.getPropertyValue('--thread-a'))||.7
    };
  }
  function theme(v){
    if(v==='dark')root.setAttribute('data-theme','dark');else root.removeAttribute('data-theme');
    bD.setAttribute('aria-pressed',v==='dark'?'true':'false');
    bL.setAttribute('aria-pressed',v==='dark'?'false':'true');
    setTimeout(paint,12);
  }
  bL.addEventListener('click',function(){theme('light');put('light');});
  bD.addEventListener('click',function(){theme('dark');put('dark');});
  theme(get()==='dark'?'dark':'light');

  /* ===================== menu ===================== */
  var ov=document.getElementById('overlay');
  document.getElementById('openMenu').addEventListener('click',function(){
    ov.classList.add('open');document.body.style.overflow='hidden';
    ov.querySelector('a').focus();
  });
  function shutMenu(refocus){
    ov.classList.remove('open');document.body.style.overflow='';
    if(refocus)document.getElementById('openMenu').focus();
  }
  document.getElementById('closeMenu').addEventListener('click',function(){shutMenu(true);});
  ov.querySelectorAll('[data-nav]').forEach(function(a){
    a.addEventListener('click',function(){shutMenu(false);});
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&ov.classList.contains('open'))shutMenu(true);
  });

  /* ============ the package you pick follows you to contact ============ */
  var MAIL='studio@affine.studio';
  var pickRow=document.getElementById('pickRow'),
      pickName=document.getElementById('pickName'),
      mailLink=document.getElementById('mailLink');
  document.querySelectorAll('[data-pick]').forEach(function(b){
    b.addEventListener('click',function(){
      var p=b.getAttribute('data-pick');
      pickName.textContent=p;
      pickRow.hidden=false;
      mailLink.href='mailto:'+MAIL+'?subject='+encodeURIComponent('New project — '+p);
    });
  });

  /* ===================== the board =====================
     Board space 100 x 56. Fourteen routed traces, each with a target
     that is a line of a finished page. Signals propagate through the
     node graph: a packet reaches a pad, the pad fires, a new packet
     leaves on a connected trace. Traces stay warm where signals ran. */

  var BW=100,BH=56,N=48;
  var seed=20260905;
  function rnd(){seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;}
  function ss(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);}

  function resample(pts,n){
    var segs=[],total=0,i;
    for(i=0;i<pts.length-1;i++){
      var L=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);
      segs.push(L);total+=L;
    }
    if(total<1e-6)total=1e-6;
    var out=[],si=0,acc=0;
    for(var k=0;k<n;k++){
      var t=total*k/(n-1);
      while(si<segs.length-1&&acc+segs[si]<t){acc+=segs[si];si++;}
      var f=segs[si]?(t-acc)/segs[si]:0;
      out.push([pts[si][0]+(pts[si+1][0]-pts[si][0])*f,
                pts[si][1]+(pts[si+1][1]-pts[si][1])*f]);
    }
    return out;
  }
  /* a routed trace: break out of the pad, one 45-degree dogleg, run in */
  function route(sx,sy,ex,ey,axis,serp){
    var a=[sx,sy];
    var b=(axis==='h')?[sx+(ex>sx?6.5:-6.5),sy]:[sx,sy+(ey>sy?5.5:-5.5)];
    var dx=ex-b[0],dy=ey-b[1],m=Math.min(Math.abs(dx),Math.abs(dy));
    var c=[b[0]+Math.sign(dx)*m,b[1]+Math.sign(dy)*m];
    var pts=[a,b,c];
    if(serp){
      /* length-matching serpentine on the straight run into the core */
      var vx=ex-c[0],vy=ey-c[1],len=Math.hypot(vx,vy)||1;
      var ux=vx/len,uy=vy/len,px=-uy,py=ux,amp=1.05,legs=5;
      for(var s=0;s<legs;s++){
        var t0=(s+0.6)/(legs+1.4),t1=(s+1.1)/(legs+1.4),sgn=(s%2?-1:1);
        pts.push([c[0]+ux*len*t0+px*amp*sgn, c[1]+uy*len*t0+py*amp*sgn]);
        pts.push([c[0]+ux*len*t1+px*amp*sgn, c[1]+uy*len*t1+py*amp*sgn]);
      }
    }
    pts.push([ex,ey]);
    return resample(pts,N);
  }
  function seg(x0,y0,x1,y1){return resample([[x0,y0],[x1,y1]],N);}

  /* the page these traces resolve into */
  var TARGET=[
    {t:seg(12,9.5,88,9.5),   w:.26},
    {t:seg(12,15.2,60,15.2), w:2.05},
    {t:seg(12,20.6,47,20.6), w:2.05},
    {t:seg(12,25.8,25,25.8), w:.50},
    {t:seg(12,30,42,30),     w:.40},
    {t:seg(12,32.8,38,32.8), w:.40},
    {t:seg(12,35.6,44,35.6), w:.40},
    {t:seg(62,24,88,24),     w:.38},
    {t:seg(88,24,88,40),     w:.38},
    {t:seg(88,40,62,40),     w:.38},
    {t:seg(62,40,62,24),     w:.38},
    {t:seg(12,44.6,88,44.6), w:.26},
    {t:seg(12,48.8,29,48.8), w:.36},
    {t:seg(71,48.8,88,48.8), w:.36}
  ];

  var ROUTE=[
    [2,10,45,21,'h',0],  [98,12,59,21,'h',1], [2,20,45,25,'h',0],
    [98,22,59,25,'h',0], [2,30,45,29,'h',1],  [98,32,59,29,'h',0],
    [2,42,45,33,'h',0],  [98,44,59,33,'h',0], [20,2,47,17,'v',0],
    [34,2,51,17,'v',0],  [66,2,57,17,'v',1],  [80,54,57,39,'v',0],
    [30,54,47,39,'v',0], [52,54,52,39,'v',0]
  ];

  var TRACES=[],NODES={},ADJ={};
  function nodeId(x,y){return Math.round(x*2)+':'+Math.round(y*2);}
  function addNode(x,y){
    var id=nodeId(x,y);
    if(!NODES[id]){NODES[id]={x:x,y:y,flash:-9};ADJ[id]=[];}
    return id;
  }
  ROUTE.forEach(function(r,i){
    var src=route(r[0],r[1],r[2],r[3],r[4],r[5]);
    var A=addNode(r[0],r[1]), B=addNode(r[2],r[3]);
    var tr={src:src,tgt:TARGET[i].t,w:TARGET[i].w,layer:i%3===0?0:1,
            A:A,B:B,heat:0,d:(i%7)/7*0.26,serp:!!r[5],
            corner:[src[Math.round(N*0.30)],src[Math.round(N*0.55)]]};
    TRACES.push(tr);
    ADJ[A].push({i:i,end:0});ADJ[B].push({i:i,end:1});
  });
  var EDGE_NODES=Object.keys(NODES).filter(function(id){
    var n=NODES[id];return n.x<6||n.x>94||n.y<6||n.y>50;
  });

  /* the chip the traces run into */
  var CHIP={x:45,y:17,w:14,h:22};

  /* ---- signals: a real propagation graph, Poisson-fired ---- */
  var PACKETS=[],nextFire=0;
  function fire(now){
    if(PACKETS.length>20)return;
    var id=EDGE_NODES[(Math.random()*EDGE_NODES.length)|0];
    var opts=ADJ[id];if(!opts||!opts.length)return;
    var pick=opts[(Math.random()*opts.length)|0];
    PACKETS.push({i:pick.i,dir:pick.end===0?1:-1,u:pick.end===0?0:1,
                  sp:0.30+Math.random()*0.34,born:now});
    TRACES[pick.i].heat=1;
  }
  function step(dt,now){
    for(var p=PACKETS.length-1;p>=0;p--){
      var k=PACKETS[p];
      k.u+=k.dir*k.sp*dt;
      if(k.u>=1||k.u<=0){
        var tr=TRACES[k.i];
        var land=k.dir>0?tr.B:tr.A;
        NODES[land].flash=now;
        PACKETS.splice(p,1);
        /* the pad fires onward down a different trace */
        var out=ADJ[land].filter(function(o){return o.i!==k.i;});
        if(out.length&&Math.random()<0.72&&PACKETS.length<20){
          var n2=out[(Math.random()*out.length)|0];
          PACKETS.push({i:n2.i,dir:n2.end===0?1:-1,u:n2.end===0?0:1,
                        sp:0.30+Math.random()*0.34,born:now});
          TRACES[n2.i].heat=1;
        }
      }
    }
    for(var t=0;t<TRACES.length;t++)TRACES[t].heat*=Math.exp(-dt/1.45);
    if(now>nextFire){fire(now);nextFire=now+0.16+Math.random()*0.85;}
  }

  /* ===================== renderer ===================== */
  function Field(id,o){
    var cv=document.getElementById(id),ctx=cv.getContext('2d');
    var W=0,H=0,dpr=1,morph=0,shear=0,tilt=0;
    function resize(){
      var r=cv.getBoundingClientRect();
      dpr=Math.min(window.devicePixelRatio||1,2);
      W=Math.max(1,r.width);H=Math.max(1,r.height);
      cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    }
    function draw(now){
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,W,H);
      var S=Math.max(W/BW,H/BH)*(o.zoom||1);
      var ox=W/2-(BW/2)*S, oy=H/2-(BH/2)*S;
      var furn=1-ss(morph/0.42);                 /* board furniture fades   */
      var settle=1-ss((morph-0.74)/0.26);        /* signals quiet on arrival */
      var flight=Math.sin(ss(morph)*Math.PI);    /* mid-travel relaxation    */
      var every=o.every||1, wM=o.wMul||1, aM=o.aMul||1, eM=o.eMul||1;

      function A(x,y,dep){
        var sh=shear*(dep?1:0.52), ti=tilt*(dep?1:0.52);
        var cx=x-BW/2, cy=y-BH/2;
        return [ox+(BW/2+cx+sh*cy)*S, oy+(BH/2+cy+ti*cx)*S];
      }

      /* the grid is always present and almost never noticed */
      ctx.strokeStyle=PAL.grid;ctx.lineWidth=1;
      for(var c=0;c<=12;c++){
        var gx=12+76*c/12,p1=A(gx,4,1),p2=A(gx,52,1);
        ctx.beginPath();ctx.moveTo(p1[0],p1[1]);ctx.lineTo(p2[0],p2[1]);ctx.stroke();
      }

      var geo=[];
      for(var i=0;i<TRACES.length;i++){
        if(i%every){geo.push(null);continue;}
        var tr=TRACES[i],pts=[];
        for(var k=0;k<N;k++){
          var local=ss((morph-tr.d-(k/N)*0.24)/(1-0.26-0.24));
          var x=tr.src[k][0]+(tr.tgt[k][0]-tr.src[k][0])*local;
          var y=tr.src[k][1]+(tr.tgt[k][1]-tr.src[k][1])*local;
          pts.push(A(x,y,tr.layer));
        }
        var sm=Math.round(flight*2);
        for(var s2=0;s2<sm;s2++){
          var np=[pts[0]];
          for(var q=1;q<pts.length-1;q++)
            np.push([(pts[q-1][0]+pts[q][0]*2+pts[q+1][0])/4,
                     (pts[q-1][1]+pts[q][1]*2+pts[q+1][1])/4]);
          np.push(pts[pts.length-1]);pts=np;
        }
        geo.push(pts);
      }

      function trace(pts){
        ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
        for(var z=1;z<pts.length;z++)ctx.lineTo(pts[z][0],pts[z][1]);
      }

      /* two passes per layer: an etched shadow, then the copper */
      for(var pass=0;pass<2;pass++){
        for(var L=0;L<2;L++){
          for(var t2=0;t2<TRACES.length;t2++){
            var g=geo[t2];if(!g)continue;
            var th=TRACES[t2];if(th.layer!==L)continue;
            var far=(L===0)?0.62:1;
            var lw=Math.max(.7,(0.34+(th.w-0.34)*ss((morph-.55)/.45))*S*wM*(L===0?.82:1));
            ctx.lineJoin='round';ctx.lineCap='round';
            if(pass===0){
              ctx.save();ctx.translate(Math.max(.6,lw*.16),Math.max(.6,lw*.16));
              trace(g);
              ctx.strokeStyle=PAL.etch;ctx.globalAlpha=0.5*aM*far;
              ctx.lineWidth=lw;ctx.stroke();ctx.restore();
            }else{
              trace(g);
              ctx.globalAlpha=PAL.a*aM*far;
              ctx.strokeStyle=(morph>.86)?PAL.text:PAL.line;
              ctx.lineWidth=lw;ctx.stroke();
              if(th.heat>0.02&&morph<.86){          /* still warm from a signal */
                trace(g);
                ctx.globalAlpha=th.heat*0.34*aM*eM;
                ctx.strokeStyle=PAL.hi;ctx.lineWidth=lw*1.35;ctx.stroke();
              }
            }
          }
        }
      }
      ctx.globalAlpha=1;

      /* board furniture: chip, pads, vias, silkscreen */
      if(furn>0.02&&!o.quiet){
        var cA=A(CHIP.x,CHIP.y,1),cB=A(CHIP.x+CHIP.w,CHIP.y+CHIP.h,1);
        ctx.globalAlpha=furn*0.7;
        ctx.strokeStyle=PAL.dim;ctx.lineWidth=Math.max(1,S*.09);
        ctx.strokeRect(cA[0],cA[1],cB[0]-cA[0],cB[1]-cA[1]);
        ctx.globalAlpha=furn*0.10;ctx.fillStyle=PAL.text;
        ctx.fillRect(cA[0],cA[1],cB[0]-cA[0],cB[1]-cA[1]);
        ctx.globalAlpha=furn*0.75;ctx.fillStyle=PAL.dim;
        ctx.font=(S*1.35)+'px "Martian Mono",monospace';
        ctx.fillText('U1',cA[0]+S*1.1,cA[1]+S*2.6);
        /* pin 1 dot */
        ctx.beginPath();ctx.arc(cA[0]+S*.9,cB[1]-S*.9,S*.28,0,6.2832);ctx.fill();
      }
      if(furn>0.02){
        var pM=o.padMul||1;
        for(var nid in NODES){
          if(every>1){
            var shown=false;
            for(var ai=0;ai<ADJ[nid].length;ai++){if(ADJ[nid][ai].i%every===0){shown=true;break;}}
            if(!shown)continue;
          }
          var n=NODES[nid],np2=A(n.x,n.y,1);
          var fl=Math.max(0,1-(now-n.flash)/0.42);
          ctx.globalAlpha=furn*(0.85);
          ctx.fillStyle=PAL.line;
          ctx.beginPath();ctx.arc(np2[0],np2[1],S*.46*pM,0,6.2832);ctx.fill();
          ctx.globalAlpha=furn;
          ctx.fillStyle=PAL.bg;
          ctx.beginPath();ctx.arc(np2[0],np2[1],S*.19*pM,0,6.2832);ctx.fill();
          if(fl>0&&!reduce){
            ctx.globalAlpha=furn*fl*0.9*eM;
            ctx.strokeStyle=PAL.hi;ctx.lineWidth=Math.max(1,S*.14);
            ctx.beginPath();ctx.arc(np2[0],np2[1],S*(.5+(1-fl)*1.5)*pM,0,6.2832);ctx.stroke();
          }
        }
        if(!o.quiet){
          ctx.globalAlpha=furn*0.55;ctx.fillStyle=PAL.faint;
          ctx.font=(S*.95)+'px "Martian Mono",monospace';
          var REF=[['R1',6,7],['C4',92,7],['J2',6,49],['L3',92,49],['Q7',30,50],['D2',68,4]];
          for(var r2=0;r2<REF.length;r2++){
            var rp=A(REF[r2][1],REF[r2][2],1);ctx.fillText(REF[r2][0],rp[0],rp[1]);
          }
        }
        /* vias at the doglegs */
        ctx.globalAlpha=furn*0.6;
        for(var v=0;v<TRACES.length;v++){
          if(v%every)continue;
          var cpt=TRACES[v].corner[0];if(!cpt)continue;
          var vp=A(cpt[0],cpt[1],TRACES[v].layer);
          ctx.strokeStyle=PAL.line;ctx.lineWidth=Math.max(.8,S*.11);
          ctx.beginPath();ctx.arc(vp[0],vp[1],S*.30,0,6.2832);ctx.stroke();
        }
        ctx.globalAlpha=1;
      }

      /* signals travelling inside the copper */
      if(!reduce&&settle>0.02){
        ctx.lineCap='butt';
        for(var pk=0;pk<PACKETS.length;pk++){
          var P=PACKETS[pk],gg=geo[P.i];if(!gg)continue;
          var tw=TRACES[P.i];
          var base=Math.max(.7,(0.34+(tw.w-0.34)*ss((morph-.55)/.45))*S*wM);
          for(var e=0;e<9;e++){
            var f1=P.u-P.dir*(0.135*e/9), f0=P.u-P.dir*(0.135*(e+1)/9);
            var lo=Math.min(f0,f1),hi=Math.max(f0,f1);
            if(hi<=0||lo>=1)continue;
            var i0=Math.max(0,Math.floor(lo*(gg.length-1)));
            var i1=Math.min(gg.length-1,Math.ceil(hi*(gg.length-1)));
            if(i1<=i0)continue;
            ctx.beginPath();ctx.moveTo(gg[i0][0],gg[i0][1]);
            for(var w2=i0+1;w2<=i1;w2++)ctx.lineTo(gg[w2][0],gg[w2][1]);
            ctx.globalAlpha=Math.pow(1-e/9,1.8)*0.92*eM*settle;
            ctx.strokeStyle=PAL.hi;ctx.lineWidth=base*(1.5-e*0.06);
            ctx.stroke();
          }
          /* the bright core, with a little instability */
          var ci=Math.max(0,Math.min(gg.length-1,Math.round(P.u*(gg.length-1))));
          ctx.globalAlpha=(0.85+Math.sin(now*47+P.born*11)*0.15)*eM*settle;
          ctx.fillStyle=PAL.hi;
          ctx.beginPath();ctx.arc(gg[ci][0],gg[ci][1],base*0.82,0,6.2832);ctx.fill();
        }
        ctx.globalAlpha=1;ctx.lineCap='round';
      }
    }
    return {
      resize:resize,draw:draw,
      setMorph:function(v){morph=v;},
      point:function(px,py){
        var ts=(px-.5)*0.26, tt=(py-.5)*0.09;
        shear+=(ts-shear)*(reduce?1:.055);tilt+=(tt-tilt)*(reduce?1:.055);
      },
      relax:function(){shear+=(0-shear)*.035;tilt+=(0-tilt)*.035;},
      read:function(){return {shear:shear,tilt:tilt};}
    };
  }

  var hero=Field('cvField',{zoom:1.06,every:2,wMul:0.28,aMul:0.34,eMul:0.5,padMul:0.60,quiet:true});
  var chap=Field('cvChap',{zoom:1.02,every:1,wMul:1,aMul:1,eMul:1});

  var ptr=null,openEl=document.querySelector('.open');
  openEl.addEventListener('pointermove',function(e){
    var r=this.getBoundingClientRect();
    ptr=[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];
  });
  openEl.addEventListener('pointerleave',function(){ptr=null;});

  var steps=[].slice.call(document.querySelectorAll('.step'));
  var chapter=document.querySelector('.chapter');
  var stEl=document.getElementById('chapState');
  var NAMES=['substrate','transform','resolve','ship'];
  function onScroll(){
    var r=chapter.getBoundingClientRect();
    var total=r.height-window.innerHeight;
    var p=total>0?Math.max(0,Math.min(1,(-r.top)/total)):0;
    chap.setMorph(p);
    var act=Math.min(steps.length-1,Math.floor(p*steps.length*0.999));
    steps.forEach(function(s,i){s.classList.toggle('on',i===act);});
    stEl.textContent=NAMES[act];
  }

  var mtx=document.getElementById('mtx'),lastT=0,lastW=0;
  function frame(ts){
    var now=ts/1000, dt=Math.min(.05,now-lastT||.016);lastT=now;
    if(!reduce)step(dt,now);
    if(ptr)hero.point(ptr[0],ptr[1]);else hero.relax();
    hero.draw(now);chap.draw(now);
    if(ts-lastW>100){
      lastW=ts;var s=hero.read();
      mtx.innerHTML='matrix  <b>1.000</b>  '+s.tilt.toFixed(3)+'\n'+
                    '        '+s.shear.toFixed(3)+'  <b>1.000</b>\n'+
                    'det <b>'+(1-s.shear*s.tilt).toFixed(4)+'</b> · parallels held';
    }
    requestAnimationFrame(frame);
  }
  function resizeAll(){hero.resize();chap.resize();onScroll();}
  window.addEventListener('resize',resizeAll);
  window.addEventListener('scroll',onScroll,{passive:true});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(resizeAll);

  document.querySelectorAll('.frame').forEach(function(f){
    f.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();f.classList.toggle('held');
        var s=f.querySelector('.site');
        s.style.transform=f.classList.contains('held')
          ?'translateY('+getComputedStyle(f).getPropertyValue('--pan')+')':'translateY(0)';
      }
    });
  });

  paint();resizeAll();
  for(var w=0;w<5;w++)fire(0);
  requestAnimationFrame(frame);
})();
