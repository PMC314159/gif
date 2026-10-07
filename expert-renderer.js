(() => {
  const $ = s => document.querySelector(s);
  const num = (id, fallback = 0) => {
    const el = $(id.startsWith('#') ? id : `#${id}`);
    const v = el ? Number(el.value) : NaN;
    return Number.isFinite(v) ? v : fallback;
  };
  const txt = id => ($(id)?.textContent || '').trim();
  const val = id => ($(id)?.value || '').trim();
  const visible = el => !!el && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden');
  const clamp = (n,a=0,b=1) => Math.min(b, Math.max(a,n));
  const easeOutCubic = x => 1 - Math.pow(1 - clamp(x), 3);

  function rr(ctx,x,y,w,h,r){
    r=Math.max(0,Math.min(r,Math.min(w,h)/2));
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  }
  function localRect(el,rootRect){
    if(!el) return {x:0,y:0,w:0,h:0};
    const r=el.getBoundingClientRect();
    return {x:r.left-rootRect.left,y:r.top-rootRect.top,w:r.width,h:r.height};
  }
  function glass(ctx,r,alpha=.22,radius=24){
    ctx.save();rr(ctx,r.x,r.y,r.w,r.h,radius);ctx.fillStyle=`rgba(238,242,248,${alpha})`;ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.58)';ctx.stroke();ctx.restore();
  }
  function fitImage(ctx,img,r,fit='cover',zoom=1,ox=0,oy=0,radius=0){
    if(!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;
    const nw=img.naturalWidth, nh=img.naturalHeight;
    const base=fit==='contain'?Math.min(r.w/nw,r.h/nh):Math.max(r.w/nw,r.h/nh);
    const dw=nw*base*zoom, dh=nh*base*zoom;
    ctx.save();if(radius){rr(ctx,r.x,r.y,r.w,r.h,radius);ctx.clip();}
    ctx.drawImage(img,r.x+r.w/2+ox-dw/2,r.y+r.h/2+oy-dh/2,dw,dh);ctx.restore();
  }
  function font(ctx,size,weight=500){ctx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;}
  function drawText(ctx,text,x,y,size,weight,color='white',align='left',baseline='alphabetic'){
    ctx.save();font(ctx,size,weight);ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillText(text,x,y);ctx.restore();
  }

  const measureCanvas=document.createElement('canvas');
  const measureCtx=measureCanvas.getContext('2d');

  function measureTextWidth(text,size=14,weight=500){
    if(!measureCtx) return (text||'').length*size*.58;
    measureCtx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;
    return measureCtx.measureText(text||'').width;
  }

  function searchState(s,t,final=false){
    const full=s.text.search||'';
    const start=s.timeline.searchStart;
    const speed=s.controls.typingSpeed||18;
    const count=final
      ? full.length
      : clamp(Math.floor(Math.max(0,t-start)*speed),0,full.length);

    const text=full.slice(0,count);

    return {
      text,
      width:Math.max(
        88,
        Math.min(
          300,
          Math.ceil(measureTextWidth(text,14,500)+86)
        )
      )
    };
  }

  function postState(s,t,final=false){
    const full=s.text.postTitle||'';
    const start=s.timeline.postStart+.12*(s.duration/5);
    const speed=Math.max(10,(s.controls.typingSpeed||18)-2);
    const count=final
      ? full.length
      : clamp(Math.floor(Math.max(0,t-start)*speed),0,full.length);

    return full.slice(0,count);
  }

  function ddayState(s,t,final=false){
    const meta=s.dday;

    if(!meta || !meta.animate || final){
      return {
        text:s.text.ddayCount,
        phase:1,
        flipping:false
      };
    }

    const target=meta.value;
    const startValue=Math.max(0,target-5);
    const stepDur=.13*(s.duration/5);
    const elapsed=Math.max(0,t-(s.timeline.ddayStart+.12*(s.duration/5)));
    const steps=Math.min(5,Math.floor(elapsed/stepDur));
    const value=Math.min(target,startValue+steps);
    const phase=clamp((elapsed-steps*stepDur)/stepDur);
    const prefix=meta.prefix||'D+';

    return {
      text:`${prefix}${value}`,
      phase,
      flipping:value<target,
      value
    };
  }

  function drawBackground(ctx,s){
    ctx.fillStyle='#68707c';
    ctx.fillRect(0,0,s.w,s.h);

    const img=s.images.bg;

    if(img && img.complete && img.naturalWidth){
      fitImage(
        ctx,
        img,
        {x:0,y:0,w:s.w,h:s.h},
        'contain',
        s.controls.bgZoom,
        s.controls.bgX,
        s.controls.bgY,
        0
      );
    }else{
      const g=ctx.createLinearGradient(0,0,s.w,s.h);
      g.addColorStop(0,'#cfd2d9');
      g.addColorStop(.45,'#929aa6');
      g.addColorStop(1,'#4d5159');
      ctx.fillStyle=g;
      ctx.fillRect(0,0,s.w,s.h);
    }

    const ov=ctx.createLinearGradient(0,0,0,s.h);
    ov.addColorStop(0,'rgba(9,10,14,.10)');
    ov.addColorStop(.6,'rgba(7,8,11,.20)');
    ov.addColorStop(1,'rgba(6,7,10,.35)');
    ctx.fillStyle=ov;
    ctx.fillRect(0,0,s.w,s.h);
  }

  function drawPhone(ctx,s){
    const p=s.rects.phone;
    const sc=s.rects.screen;

    ctx.save();
    rr(ctx,p.x,p.y,p.w,p.h,51);
    ctx.fillStyle='rgba(214,220,230,.24)';
    ctx.fill();
    ctx.lineWidth=1.2;
    ctx.strokeStyle='rgba(255,255,255,.52)';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    rr(ctx,sc.x,sc.y,sc.w,sc.h,44);
    ctx.fillStyle='#77808d';
    ctx.fill();
    ctx.restore();

    fitImage(
      ctx,
      s.images.main,
      sc,
      'cover',
      s.controls.mainZoom,
      s.controls.mainX,
      s.controls.mainY,
      44
    );

    const shade=ctx.createLinearGradient(0,sc.y,0,sc.y+sc.h);
    shade.addColorStop(0,'rgba(0,0,0,.05)');
    shade.addColorStop(.45,'rgba(0,0,0,0)');
    shade.addColorStop(1,'rgba(0,0,0,.15)');

    ctx.save();
    rr(ctx,sc.x,sc.y,sc.w,sc.h,44);
    ctx.clip();
    ctx.fillStyle=shade;
    ctx.fillRect(sc.x,sc.y,sc.w,sc.h);
    ctx.restore();

    const island={
      x:p.x+p.w/2-41.5,
      y:p.y+15,
      w:83,
      h:23
    };

    ctx.save();
    rr(ctx,island.x,island.y,island.w,island.h,12);
    ctx.fillStyle='#050608';
    ctx.fill();
    ctx.restore();
  }

  function drawSearch(ctx,s,t,final=false){
    const base=s.rects.search;
    const st=searchState(s,t,final);

    const r={
      x:base.x,
      y:base.y,
      w:st.width,
      h:base.h
    };

    glass(ctx,r,s.glassAlpha,29);

    if(st.text){
      drawText(
        ctx,
        st.text,
        r.x+18,
        r.y+r.h/2,
        14,
        500,
        'rgba(255,255,255,.92)',
        'left',
        'middle'
      );
    }

    const cx=r.x+r.w-28;
    const cy=r.y+r.h/2;

    ctx.save();
    ctx.strokeStyle='rgba(255,255,255,.92)';
    ctx.lineWidth=2;

    ctx.beginPath();
    ctx.arc(cx-2,cy-1,8,0,Math.PI*2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx+4,cy+5);
    ctx.lineTo(cx+10,cy+11);
    ctx.stroke();

    ctx.restore();
  }

  function drawDday(ctx,s,t,final=false){
    const r=s.rects.dday;
    const ds=ddayState(s,t,final);

    glass(ctx,r,s.glassAlpha,27);

    drawText(
      ctx,
      s.text.ddayLabel,
      r.x+17,
      r.y+22,
      10,
      700,
      'rgba(255,255,255,.72)'
    );

    const centerY=r.y+53;

    ctx.save();

    if(ds.flipping){
      const flip=Math.abs(Math.cos(Math.PI*ds.phase));
      const sy=.58+.42*flip;

      ctx.translate(r.x+17,centerY);
      ctx.scale(1,sy);
      ctx.translate(-(r.x+17),-centerY);
    }

    drawText(
      ctx,
      ds.text,
      r.x+17,
      centerY,
      31,
      650,
      '#fff'
    );

    ctx.restore();

    if(ds.flipping){
      ctx.save();
      ctx.globalAlpha=.22*(1-Math.abs(.5-ds.phase)*2);
      ctx.fillStyle='#fff';
      ctx.fillRect(
        r.x+17,
        r.y+42,
        Math.min(86,r.w-34),
        1
      );
      ctx.restore();
    }

    if(s.text.ddayDate){
      drawText(
        ctx,
        s.text.ddayDate,
        r.x+17,
        r.y+r.h-13,
        9,
        500,
        'rgba(255,255,255,.68)'
      );
    }
  }

  function drawEqualizer(ctx,x,y,t){
    const widths=2.2;
    const gap=2.4;

    for(let i=0;i<4;i++){
      const wave=.5+.5*Math.sin(t*(5.6+i*.7)+i*1.7);
      const h=4+wave*9;

      ctx.fillStyle='rgba(255,255,255,.82)';
      rr(
        ctx,
        x+i*(widths+gap),
        y-h/2,
        widths,
        h,
        1.1
      );
      ctx.fill();
    }
  }

  function drawMusic(ctx,s,t=0){
    const r=s.rects.music;

    glass(ctx,r,s.glassAlpha,28);

    const c=s.rects.cover;

    fitImage(
      ctx,
      s.images.cover,
      c,
      'cover',
      s.controls.coverZoom,
      s.controls.coverX,
      s.controls.coverY,
      20
    );

    const tx=c.x+c.w+14;

    drawText(
      ctx,
      s.text.song,
      tx,
      r.y+29,
      13,
      700,
      '#fff'
    );

    drawText(
      ctx,
      s.text.artist,
      tx,
      r.y+47,
      10,
      500,
      'rgba(255,255,255,.68)'
    );

    const playR=14;
    const playCx=r.x+r.w-28;
    const playCy=r.y+69;

    const eqX=playCx-34;
    const barX=tx;
    const barY=r.y+69;
    const barW=Math.max(28,eqX-10-barX);

    ctx.fillStyle='rgba(255,255,255,.28)';
    rr(ctx,barX,barY-1.5,barW,3,2);
    ctx.fill();

    ctx.fillStyle='#fff';
    rr(
      ctx,
      barX,
      barY-1.5,
      barW*s.controls.progress/100,
      3,
      2
    );
    ctx.fill();

    drawEqualizer(ctx,eqX,barY,t);

    ctx.beginPath();
    ctx.arc(playCx,playCy,playR,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.90)';
    ctx.fill();

    ctx.fillStyle='#17181c';

    rr(
      ctx,
      playCx-4.5,
      playCy-5,
      3,
      10,
      1
    );
    ctx.fill();

    rr(
      ctx,
      playCx+1.5,
      playCy-5,
      3,
      10,
      1
    );
    ctx.fill();

    drawText(
      ctx,
      s.text.current,
      barX,
      r.y+90,
      8,
      500,
      'rgba(255,255,255,.62)'
    );

    drawText(
      ctx,
      s.text.duration,
      r.x+r.w-15,
      r.y+90,
      8,
      500,
      'rgba(255,255,255,.62)',
      'right'
    );

    let yy=r.y+114;

    for(let i=0;i<s.queue.length;i++){
      const q=s.queue[i];

      ctx.fillStyle='rgba(255,255,255,.16)';
      ctx.fillRect(
        r.x+14,
        yy-7,
        r.w-28,
        1
      );

      drawText(
        ctx,
        q.title,
        r.x+14,
        yy+10,
        11,
        620,
        '#fff'
      );

      drawText(
        ctx,
        q.artist,
        r.x+14,
        yy+25,
        9,
        500,
        'rgba(255,255,255,.62)'
      );

      drawText(
        ctx,
        String(i+2).padStart(2,'0'),
        r.x+r.w-14,
        yy+10,
        9,
        500,
        'rgba(255,255,255,.45)',
        'right'
      );

      yy+=40;
    }
  }

  function drawPost(ctx,s,t,final=false){
    if(!s.postVisible)return;

    const imgR=s.rects.postImage;
    const titleR=s.rects.postTitle;

    fitImage(
      ctx,
      s.images.post,
      imgR,
      'contain',
      s.controls.postZoom,
      s.controls.postX,
      s.controls.postY,
      22
    );

    glass(
      ctx,
      titleR,
      Math.min(.26,s.glassAlpha+.02),
      16
    );

    const title=postState(s,t,final);

    if(title){
      drawText(
        ctx,
        title,
        titleR.x+12,
        titleR.y+titleR.h/2,
        12,
        620,
        '#fff',
        'left',
        'middle'
      );
    }
  }

  function drawCommission(ctx,s){
    if(s.text.commission){
      drawText(
        ctx,
        s.text.commission,
        14,
        s.h-12,
        9,
        500,
        'rgba(255,255,255,.65)'
      );
    }
  }

  function loadImage(src){
    return new Promise(resolve=>{
      if(!src){
        resolve(null);
        return;
      }

      const img=new Image();

      img.onload=()=>resolve(img);
      img.onerror=()=>resolve(null);
      img.src=src;
    });
  }

  async function captureState(opts={}){
    const root=$('#capture');
    const rootRect=root.getBoundingClientRect();
    const glassValue=num('glassOpacity',34);
    const queue=[];

    for(let i=1;i<=3;i++){
      const title=val(`queueTitle${i}`);
      const artist=val(`queueArtist${i}`);

      if(title||artist){
        queue.push({
          title:title||'Untitled',
          artist:artist||'Unknown'
        });
      }
    }

    const [bg,main,cover,post]=await Promise.all([
      loadImage(window.__pairBgSrc||''),
      loadImage($('#mainImage')?.src||''),
      loadImage($('#coverImage')?.src||''),
      loadImage($('#postImage')?.src||'')
    ]);

    const dur=num('duration',5);
    const f=dur/5;
    const ddayEl=$('#ddayWidget');

    return {
      w:540,
      h:opts.height||Math.round(rootRect.height),
      duration:dur,
      effect:val('animEffect')||'pop',

      glassAlpha:clamp(
        .10+glassValue/100*.34,
        .12,
        .34
      ),

      timeline:{
        searchStart:.42*f,
        musicStart:1.22*f,
        ddayStart:2.12*f,
        postStart:3.05*f
      },

      rects:{
        phone:localRect($('#phone'),rootRect),
        screen:localRect($('.screen'),rootRect),
        search:localRect($('#searchWidget'),rootRect),
        dday:localRect(ddayEl,rootRect),
        music:localRect($('#musicWidget'),rootRect),
        cover:localRect($('.cover'),rootRect),
        post:localRect($('#postWidget'),rootRect),
        postImage:localRect($('.post-image'),rootRect),
        postTitle:localRect($('.post-title'),rootRect)
      },

      images:{
        bg,
        main,
        cover,
        post
      },

      queue,

      postVisible:visible($('#postWidget')),

      controls:{
        bgZoom:num('bgZoom',1),
        bgX:num('bgX'),
        bgY:num('bgY'),

        mainZoom:num('zoom',1),
        mainX:num('posX'),
        mainY:num('posY'),

        coverZoom:num('coverZoom',1),
        coverX:num('coverX'),
        coverY:num('coverY'),

        postZoom:num('postZoom',1),
        postX:num('postX'),
        postY:num('postY'),

        progress:num('progress',42),
        typingSpeed:num('typingSpeed',18)
      },

      text:{
        search:val('searchTextInput'),
        ddayLabel:txt('#ddayLabelOut'),
        ddayCount:ddayEl?.dataset.finalText||txt('#ddayCount'),

        ddayDate:visible($('#ddayDateOut'))
          ? txt('#ddayDateOut')
          : '',

        song:txt('#songOut'),
        artist:txt('#artistOut'),
        current:txt('#currentTimeOut'),
        duration:txt('#durationTimeOut'),

        postTitle:
          val('postCaption')||
          txt('#postCaptionOut'),

        commission:val('commissionText')
      },

      dday:{
        animate:ddayEl?.dataset.animate==='1',
        value:Number(ddayEl?.dataset.abs||0),
        prefix:ddayEl?.dataset.prefix||'D+'
      }
    };
  }

  function motionProgress(s,t,name){
    const f=s.duration/5;

    const starts={
      search:.42*f,
      music:1.22*f,
      dday:2.12*f,
      post:3.05*f
    };

    const lens={
      search:.62*f,
      music:.72*f,
      dday:.66*f,
      post:.74*f
    };

    return clamp(
      (t-starts[name])/
      Math.max(.001,lens[name])
    );
  }

  function motionTransform(effect,p){
    const q=easeOutCubic(p);

    if(effect==='snap'){
      return {
        alpha:1,
        scale:1,
        dy:0
      };
    }

    if(effect==='fade'){
      return {
        alpha:q,
        scale:.985+.015*q,
        dy:0
      };
    }

    if(effect==='slide'){
      return {
        alpha:q,
        scale:1,
        dy:30*(1-q)
      };
    }

    const overshoot=
      .15*
      Math.sin(Math.PI*clamp(p))*
      Math.exp(-1.35*p);

    return {
      alpha:clamp(p*1.8),
      scale:.70+.30*q+overshoot,
      dy:14*(1-q)
    };
  }

  function drawMotion(ctx,s,t,name,fn,final=false){
    if(final){
      fn(ctx,s,t,true);
      return;
    }

    const p=motionProgress(s,t,name);

    if(p<=0)return;

    const m=motionTransform(
      s.effect||'pop',
      p
    );

    const r=s.rects[name];

    ctx.save();

    ctx.globalAlpha*=m.alpha;

    const cx=r.x+r.w/2;
    const cy=r.y+r.h/2;

    ctx.translate(
      cx,
      cy+m.dy
    );

    ctx.scale(
      m.scale,
      m.scale
    );

    ctx.translate(
      -cx,
      -cy
    );

    fn(
      ctx,
      s,
      t,
      false
    );

    ctx.restore();
  }

  function render(state,t,{final=false}={}){
    const c=document.createElement('canvas');

    c.width=state.w;
    c.height=state.h;

    const ctx=c.getContext('2d');

    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    drawBackground(ctx,state);
    drawPhone(ctx,state);

    drawMotion(
      ctx,
      state,
      t,
      'search',
      drawSearch,
      final
    );

    drawMotion(
      ctx,
      state,
      t,
      'music',
      drawMusic,
      final
    );

    drawMotion(
      ctx,
      state,
      t,
      'dday',
      drawDday,
      final
    );

    if(state.postVisible){
      drawMotion(
        ctx,
        state,
        t,
        'post',
        drawPost,
        final
      );
    }

    drawCommission(
      ctx,
      state
    );

    return c;
  }

  window.PairExportRenderer={
    version:'20261007-9',
    captureState,
    render
  };
})();
