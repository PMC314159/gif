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

  function rr(ctx,x,y,w,h,r){
    r=Math.max(0,Math.min(r,Math.min(w,h)/2));
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function localRect(el,rootRect){
    if(!el) return {x:0,y:0,w:0,h:0};
    const r=el.getBoundingClientRect();
    return {
      x:r.left-rootRect.left,
      y:r.top-rootRect.top,
      w:r.width,
      h:r.height
    };
  }

  function rgba(hex,a){
    if(hex.startsWith('rgba')||hex.startsWith('rgb')) return hex;
    return hex;
  }

  function glass(ctx,r,alpha=.22,radius=24){
    ctx.save();
    rr(ctx,r.x,r.y,r.w,r.h,radius);
    ctx.fillStyle=`rgba(238,242,248,${alpha})`;
    ctx.fill();
    ctx.lineWidth=1;
    ctx.strokeStyle='rgba(255,255,255,.58)';
    ctx.stroke();
    ctx.restore();
  }

  function fitImage(ctx,img,r,fit='cover',zoom=1,ox=0,oy=0,radius=0){
    if(!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;

    const nw=img.naturalWidth;
    const nh=img.naturalHeight;

    const base=fit==='contain'
      ? Math.min(r.w/nw,r.h/nh)
      : Math.max(r.w/nw,r.h/nh);

    const dw=nw*base*zoom;
    const dh=nh*base*zoom;

    ctx.save();

    if(radius){
      rr(ctx,r.x,r.y,r.w,r.h,radius);
      ctx.clip();
    }

    ctx.drawImage(
      img,
      r.x+r.w/2+ox-dw/2,
      r.y+r.h/2+oy-dh/2,
      dw,
      dh
    );

    ctx.restore();
  }

  function font(ctx,size,weight=500){
    ctx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;
  }

  function drawText(
    ctx,
    text,
    x,
    y,
    size,
    weight,
    color='white',
    align='left',
    baseline='alphabetic'
  ){
    ctx.save();
    font(ctx,size,weight);
    ctx.fillStyle=color;
    ctx.textAlign=align;
    ctx.textBaseline=baseline;
    ctx.fillText(text,x,y);
    ctx.restore();
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

  function drawSearch(ctx,s){
    const r=s.rects.search;

    glass(ctx,r,s.glassAlpha,29);

    drawText(
      ctx,
      s.text.search,
      r.x+18,
      r.y+r.h/2,
      14,
      500,
      'rgba(255,255,255,.88)',
      'left',
      'middle'
    );

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

  function drawDday(ctx,s){
    const r=s.rects.dday;

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

    drawText(
      ctx,
      s.text.ddayCount,
      r.x+17,
      r.y+53,
      31,
      650,
      '#fff'
    );

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

  function drawMusic(ctx,s){
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
      r.y+48,
      10,
      500,
      'rgba(255,255,255,.68)'
    );

    const playR=14;
    const playCx=r.x+r.w-28;
    const playCy=r.y+72;

    const barX=tx;
    const barY=r.y+72;
    const barW=Math.max(
      35,
      playCx-26-barX
    );

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

    ctx.beginPath();
    ctx.arc(playCx,playCy,playR,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.90)';
    ctx.fill();

    ctx.fillStyle='#17181c';
    ctx.beginPath();
    ctx.moveTo(playCx-3,playCy-5);
    ctx.lineTo(playCx+5,playCy);
    ctx.lineTo(playCx-3,playCy+5);
    ctx.closePath();
    ctx.fill();

    drawText(
      ctx,
      s.text.current,
      barX,
      r.y+92,
      8,
      500,
      'rgba(255,255,255,.62)'
    );

    drawText(
      ctx,
      s.text.duration,
      r.x+r.w-15,
      r.y+92,
      8,
      500,
      'rgba(255,255,255,.62)',
      'right'
    );

    let yy=r.y+116;

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

  function drawPost(ctx,s){
    if(!s.postVisible) return;

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

    drawText(
      ctx,
      s.text.postTitle,
      titleR.x+12,
      titleR.y+titleR.h/2,
      12,
      620,
      '#fff',
      'left',
      'middle'
    );
  }

  function drawCommission(ctx,s){
    if(!s.text.commission) return;

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

    return {
      w:540,
      h:opts.height||Math.round(rootRect.height),
      duration:num('duration',5),

      glassAlpha:clamp(
        .10+glassValue/100*.34,
        .12,
        .34
      ),

      rects:{
        phone:localRect($('#phone'),rootRect),
        screen:localRect($('.screen'),rootRect),
        search:localRect($('#searchWidget'),rootRect),
        dday:localRect($('#ddayWidget'),rootRect),
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

        progress:num('progress',42)
      },

      text:{
        search:val('searchTextInput'),
        ddayLabel:txt('#ddayLabelOut'),
        ddayCount:txt('#ddayCount'),
        ddayDate:visible($('#ddayDateOut'))
          ? txt('#ddayDateOut')
          : '',
        song:txt('#songOut'),
        artist:txt('#artistOut'),
        current:txt('#currentTimeOut'),
        duration:txt('#durationTimeOut'),
        postTitle:txt('#postCaptionOut'),
        commission:val('commissionText')
      }
    };
  }

  function showAt(s,t,name){
    const f=s.duration/5;

    const times={
      search:.72*f,
      music:1.68*f,
      dday:2.58*f,
      post:3.42*f
    };

    return t>=times[name];
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

    if(final||showAt(state,t,'search')){
      drawSearch(ctx,state);
    }

    if(final||showAt(state,t,'music')){
      drawMusic(ctx,state);
    }

    if(final||showAt(state,t,'dday')){
      drawDday(ctx,state);
    }

    if(final||showAt(state,t,'post')){
      drawPost(ctx,state);
    }

    drawCommission(ctx,state);

    return c;
  }

  window.PairExportRenderer={
    version:'20261007-4',
    captureState,
    render
  };
})();
