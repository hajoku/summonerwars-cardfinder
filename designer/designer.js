// Card designer: the card is drawn on a canvas (1050×750, landscape like the printed cards), so the preview is exactly what the PNG download contains.
(()=>{
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height;
const SYMS=['Air','Cunning','Dark','Divine','Earth','Fire','Instinct','Light','Logic','Mercenary','Resolve','Spirit','Water'];
const PRESETS=[['#b3283a','#4a1a24'],['#2f7a3a','#1d3a20'],['#2b6a9a','#16314a'],['#c08a1e','#4d3612'],['#6e3b9a','#2e1a45'],['#4f5d6b','#22282e'],['#b8562a','#3f2214'],['#1f8a85','#123a38']];
const DEF={type:'Common',name:'Ember Guard',faction:'Ashen Vale',cost:2,life:4,str:2,atk:'Melee',phase:'Summon Phase',struct:false,sy:['Fire'],
  abs:[{n:'Flame Ward',t:'When this unit is attacked, the attacker takes 1 damage after the attack.'}],c1:PRESETS[0][0],c2:PRESETS[0][1],img:null,zoom:100,ox:0,oy:0};
let S;
try{S=JSON.parse(localStorage.getItem('swd-card')||'null');}catch(e){}
S=Object.assign(structuredClone(DEF),S||{});
const isUnit=()=>!S.type.includes('Event'), hasEmblem=()=>S.type==='Summoner'||S.type==='Epic Event';

// ---------- form ----------
const seg=(id,val)=>$(id).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===val));
$('syms').innerHTML=SYMS.map(s=>`<button type="button" class="sym" data-s="${s}" aria-pressed="false" title="${s}" aria-label="${s}"><img src="../img/symbols/${s}.png" alt=""></button>`).join('');
$('presets').innerHTML=PRESETS.map(([a,b],i)=>`<button type="button" data-i="${i}" aria-label="Color preset ${i+1}" style="background:linear-gradient(135deg,${a} 50%,${b} 50%)"></button>`).join('');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function renderAbs(){
  $('abs').innerHTML=S.abs.map((a,i)=>`<div class="ab" data-i="${i}"><div class="row"><input type="text" data-k="n" list="abList" autocomplete="off" value="${esc(a.n)}" placeholder="${isUnit()?'Ability name':'Name (optional, e.g. ACTIVE)'}" aria-label="Ability ${i+1} name"><button type="button" data-del="${i}" aria-label="Remove ability ${i+1}">✕</button></div><textarea data-k="t" rows="3" placeholder="Text" aria-label="Ability ${i+1} text">${esc(a.t)}</textarea></div>`).join('');
}
function fill(){
  seg('type',S.type);seg('atk',S.atk);
  for(const k of ['name','faction','cost','life','str','phase'])$(k).value=S[k]??'';
  $('struct').checked=!!S.struct;
  $('c1').value=S.c1;$('c2').value=S.c2;
  $('syms').querySelectorAll('.sym').forEach(b=>b.setAttribute('aria-pressed',S.sy.includes(b.dataset.s)));
  $('zoom').value=S.zoom;$('ox').value=S.ox;$('oy').value=S.oy;
  renderAbs();showFields();presetMark();
}
function showFields(){
  const u=isUnit();
  document.querySelectorAll('[data-show]').forEach(el=>{const k=el.dataset.show;el.hidden=k==='unit'?!u:k==='event'?u:k==='cost'?S.type==='Summoner':k==='life'?!(u||S.struct):false;});
  $('abLbl').textContent=u?'Abilities':'Event text';
  $('abList').innerHTML=Object.keys(u?TX.abilities:TX.events).map(n=>`<option value="${esc(n)}">`).join('');
  $('abHint').textContent=u?'Type an existing ability name (or pick it from the suggestions) to insert its text. Leave the name empty for plain text. A line break starts a new paragraph.':'Type an existing event name in the name field to insert its text (the name is then removed). Leave the name empty for plain text, or use e.g. ACTIVE.';
  $('imgCtl').hidden=!S.img;$('noImg').disabled=!S.img;
}
function presetMark(){$('presets').querySelectorAll('button').forEach(b=>{const p=PRESETS[b.dataset.i];b.setAttribute('aria-pressed',p[0]===S.c1&&p[1]===S.c2);});}
let saveT;
function changed(){draw();clearTimeout(saveT);saveT=setTimeout(save,400);}
function save(){
  try{localStorage.setItem('swd-card',JSON.stringify(S));$('msg').textContent='';}
  catch(e){try{localStorage.setItem('swd-card',JSON.stringify({...S,img:null}));}catch(_){}$('msg').textContent='The image is too large to keep after a reload. Use “Save design” to keep it.';}
}
$('struct').addEventListener('change',e=>{S.struct=e.target.checked;showFields();changed();});
$('type').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.type=b.dataset.v;seg('type',S.type);showFields();renderAbs();changed();});
$('atk').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.atk=b.dataset.v;seg('atk',S.atk);changed();});
for(const k of ['name','faction','phase'])$(k).addEventListener('input',e=>{S[k]=e.target.value;changed();});
for(const k of ['cost','life','str'])$(k).addEventListener('input',e=>{S[k]=e.target.value===''?'':Math.max(0,Math.min(99,parseInt(e.target.value,10)||0));changed();});
$('syms').addEventListener('click',e=>{const b=e.target.closest('.sym');if(!b)return;const s=b.dataset.s;S.sy=S.sy.includes(s)?S.sy.filter(x=>x!==s):[...S.sy,s].sort((a,b)=>SYMS.indexOf(a)-SYMS.indexOf(b));b.setAttribute('aria-pressed',S.sy.includes(s));changed();});
$('abs').addEventListener('input',e=>{
  const box=e.target.closest('.ab');if(!box)return;const a=S.abs[box.dataset.i];a[e.target.dataset.k]=e.target.value;
  if(e.target.dataset.k==='n'){
    const src=isUnit()?TX.abilities:TX.events,key=Object.keys(src).find(k=>k.toLowerCase()===e.target.value.trim().toLowerCase());
    const ta=box.querySelector('textarea');
    if(key){a.t=src[key];ta.value=a.t;if(isUnit()){a.n=key;e.target.value=key;}else{a.n='';e.target.value='';}}
  }
  changed();});
$('abs').addEventListener('click',e=>{const b=e.target.closest('[data-del]');if(!b)return;S.abs.splice(+b.dataset.del,1);renderAbs();changed();});
$('addAb').addEventListener('click',()=>{S.abs.push({n:'',t:''});renderAbs();changed();const t=$('abs').querySelectorAll('.ab');t[t.length-1].querySelector('input').focus();});
$('presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[S.c1,S.c2]=PRESETS[b.dataset.i];$('c1').value=S.c1;$('c2').value=S.c2;presetMark();changed();});
$('c1').addEventListener('input',e=>{S.c1=e.target.value;presetMark();changed();});
$('c2').addEventListener('input',e=>{S.c2=e.target.value;presetMark();changed();});
for(const k of ['zoom','ox','oy'])$(k).addEventListener('input',e=>{S[k]=+e.target.value;changed();});

// image upload: downscale so it fits in browser storage
let IMG=null;
function loadImg(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});}
$('img').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{
    const url=URL.createObjectURL(f);const i=await loadImg(url);URL.revokeObjectURL(url);
    const k=Math.min(1,1400/Math.max(i.naturalWidth,i.naturalHeight));
    const c=document.createElement('canvas');c.width=Math.round(i.naturalWidth*k);c.height=Math.round(i.naturalHeight*k);
    c.getContext('2d').drawImage(i,0,0,c.width,c.height);
    S.img=c.toDataURL('image/jpeg',.88);S.zoom=100;S.ox=0;S.oy=0;$('zoom').value=100;$('ox').value=0;$('oy').value=0;
    IMG=await loadImg(S.img);showFields();changed();
  }catch(err){$('msg').textContent='This image could not be read. Try a JPG or PNG.';}
});
$('noImg').addEventListener('click',()=>{S.img=null;IMG=null;showFields();changed();});

// ---------- actions ----------
const slug=()=>(S.name||'card').trim().replace(/[^\w\- ]+/g,'').replace(/\s+/g,'-').toLowerCase()||'card';
function dl(href,name){const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();}
$('png').addEventListener('click',()=>{cv.toBlob(b=>{const u=URL.createObjectURL(b);dl(u,slug()+'.png');setTimeout(()=>URL.revokeObjectURL(u),4000);},'image/png');});
$('saveJson').addEventListener('click',()=>{const u=URL.createObjectURL(new Blob([JSON.stringify({swCardDesign:1,...S})],{type:'application/json'}));dl(u,slug()+'.json');setTimeout(()=>URL.revokeObjectURL(u),4000);});
$('loadJson').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const o=JSON.parse(await f.text());if(!o||!o.swCardDesign)throw 0;delete o.swCardDesign;S=Object.assign(structuredClone(DEF),o);IMG=S.img?await loadImg(S.img):null;fill();changed();$('msg').textContent='Design loaded.';}
  catch(err){$('msg').textContent='This file is not a saved card design.';}
});
$('newCard').addEventListener('click',()=>{if(!confirm('Start a new card? The current design will be replaced.'))return;S=structuredClone(DEF);S.name='';S.faction='';S.abs=[{n:'',t:''}];IMG=null;fill();changed();});

// ---------- drawing ----------
const DISPLAY='"Pirata One", Georgia, serif', BODY='Alegreya, Georgia, serif';
function rgb(h){const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];}
function mix(h,t,a){const c=rgb(h),d=t==='w'?[255,255,255]:[0,0,0];return `rgb(${c.map((v,i)=>Math.round(v+(d[i]-v)*a)).join(',')})`;}
function rgba(h,a){return `rgba(${rgb(h).join(',')},${a})`;}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
const ICON={};['cost','life','melee','ranged'].forEach(n=>{const i=new Image();i.onload=()=>draw();i.src=`../img/icons/${n}.png`;ICON[n]=i;});
const iconW=(n,h)=>{const i=ICON[n];return i&&i.naturalWidth?i.naturalWidth/i.naturalHeight*h:h;};
function icon(n,x,cy,h){const i=ICON[n];if(i&&i.complete&&i.naturalWidth)ctx.drawImage(i,x,cy-h/2,iconW(n,h),h);}
const symImg={};SYMS.forEach(s=>{const i=new Image();i.onload=()=>draw();i.src=`../img/symbols/${s}.png`;symImg[s]=i;});

// icons (own simple shapes)
function crown(cx,cy,s,col){ctx.beginPath();ctx.moveTo(cx-s,cy+s*.6);ctx.lineTo(cx-s,cy-s*.35);ctx.lineTo(cx-s*.5,cy+s*.1);ctx.lineTo(cx,cy-s*.75);ctx.lineTo(cx+s*.5,cy+s*.1);ctx.lineTo(cx+s,cy-s*.35);ctx.lineTo(cx+s,cy+s*.6);ctx.closePath();ctx.fillStyle=col;ctx.fill();}

function wrap(text,font,maxW){
  ctx.font=font;const lines=[];
  for(const para of String(text).split(/\n/)){
    let line='';
    for(const w of para.split(/\s+/).filter(Boolean)){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}
    lines.push(line);
  }
  return lines;
}
function fitText(t,font,size,maxW){ctx.font=`${size}px ${font}`;while(size>14&&ctx.measureText(t).width>maxW){size--;ctx.font=`${size}px ${font}`;}return size;}

function draw(){
  const c1=S.c1,c2=S.c2,PARCH='#efe6d5',INK='#2a1f19';
  ctx.clearRect(0,0,W,H);
  ctx.save();rr(0,0,W,H,36);ctx.clip();
  // frame
  const fg=ctx.createLinearGradient(0,0,W,H);fg.addColorStop(0,mix(c2,'w',.18));fg.addColorStop(.5,c2);fg.addColorStop(1,mix(c2,'k',.3));
  ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);
  const IX=22,IY=22,IW=W-44,IH=H-44;
  ctx.save();rr(IX,IY,IW,IH,22);ctx.clip();
  // artwork
  const A={x:470,y:IY,w:IX+IW-470,h:IH};
  if(IMG){
    const k=Math.max(A.w/IMG.naturalWidth,A.h/IMG.naturalHeight)*S.zoom/100,w=IMG.naturalWidth*k,h=IMG.naturalHeight*k;
    const x=A.x+(A.w-w)/2-S.ox/100*Math.max(0,(w-A.w)/2+A.w*.25),y=A.y+(A.h-h)/2-S.oy/100*Math.max(0,(h-A.h)/2+A.h*.25);
    ctx.drawImage(IMG,x,y,w,h);
  }else{
    const g=ctx.createRadialGradient(A.x+A.w*.55,A.y+A.h*.45,20,A.x+A.w*.55,A.y+A.h*.45,A.w*.8);
    g.addColorStop(0,mix(c1,'w',.35));g.addColorStop(1,mix(c2,'k',.2));ctx.fillStyle=g;ctx.fillRect(IX,IY,IW,IH);
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.font=`34px ${BODY}`;ctx.textAlign='center';ctx.fillText('Upload artwork',A.x+A.w*.58,A.y+A.h*.48);ctx.textAlign='left';
  }
  // text panel (parchment) with slanted right edge
  const PX=600;
  const pg=ctx.createLinearGradient(0,IY,0,IY+IH);pg.addColorStop(0,'#f4ecdd');pg.addColorStop(1,'#e6dac4');
  const EY=IY+200,EB=IY+IH,ctrl=[PX-60,(EY+EB)/2];
  ctx.beginPath();ctx.moveTo(IX,IY);ctx.lineTo(PX-30,IY);ctx.lineTo(PX,EY);ctx.quadraticCurveTo(ctrl[0],ctrl[1],PX-14,EB);ctx.lineTo(IX,EB);ctx.closePath();
  ctx.fillStyle=pg;ctx.fill();
  ctx.lineWidth=7;ctx.strokeStyle=c2;ctx.beginPath();ctx.moveTo(PX,EY);ctx.quadraticCurveTo(ctrl[0],ctrl[1],PX-14,EB);ctx.stroke();
  // header band over the art
  const hg=ctx.createLinearGradient(PX-60,0,PX+260,0);hg.addColorStop(0,'rgba(244,236,221,1)');hg.addColorStop(1,'rgba(244,236,221,0)');
  ctx.fillStyle=hg;ctx.fillRect(PX-60,IY,320,128);
  // class line band
  const cg=ctx.createLinearGradient(IX,0,PX+200,0);cg.addColorStop(0,c1);cg.addColorStop(.75,rgba(c1,.95));cg.addColorStop(1,rgba(c1,0));
  ctx.fillStyle=cg;ctx.fillRect(IX,112,PX+200-IX,36);
  // name
  const name=S.name||'Unnamed';const ns=fitText(name,DISPLAY,66,PX+180-50);
  ctx.fillStyle=INK;ctx.font=`${ns}px ${DISPLAY}`;ctx.textBaseline='alphabetic';ctx.fillText(name,48,98);
  // class line
  const st=S.struct?' • Structure':'';const cls=isUnit()?`${S.type} Unit${st} • ${S.faction||'Faction'}`:`${S.type}${st} • ${S.phase}`;
  const cs=fitText(cls,`italic ${BODY}`,27,PX+150-50);ctx.font=`italic ${cs}px ${BODY}`;ctx.fillStyle='#fff4e8';ctx.fillText(cls,48,139);
  // stat row
  const RY=154,RH=66;
  const sg=ctx.createLinearGradient(IX,0,PX+40,0);sg.addColorStop(0,mix(c2,'k',.35));sg.addColorStop(.85,mix(c2,'k',.2));sg.addColorStop(1,rgba(c2,0));
  ctx.beginPath();ctx.moveTo(IX,RY);ctx.lineTo(PX+40,RY);ctx.lineTo(PX+10,RY+RH);ctx.lineTo(IX,RY+RH);ctx.closePath();ctx.fillStyle=sg;ctx.fill();
  let x=40;const box=(w,fn)=>{rr(x,RY+7,w,RH-14,6);ctx.fillStyle=mix(c1,'k',.25);ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=mix(c1,'w',.35);ctx.stroke();fn(x,RY+RH/2);x+=w+12;};
  const num=(v,bx,cy)=>{ctx.font=`50px ${DISPLAY}`;ctx.fillStyle='#fff6ec';ctx.textBaseline='middle';ctx.fillText(String(v),bx+16,cy+3);const w=ctx.measureText(String(v)).width;ctx.textBaseline='alphabetic';return bx+16+w;};
  if(hasEmblem())box(84,(bx,cy)=>crown(bx+42,cy+2,24,'#fff1d6'));
  if(S.type!=='Summoner'){const v=S.cost===''?0:S.cost;ctx.font=`50px ${DISPLAY}`;const w=ctx.measureText(String(v)).width;box(w+16+6+iconW('cost',42)+14,(bx,cy)=>{const e=num(v,bx,cy);icon('cost',e+6,cy,42);});}
  if(isUnit()||S.struct){const v=S.life===''?0:S.life;ctx.font=`50px ${DISPLAY}`;const w=ctx.measureText(String(v)).width;box(w+16+6+iconW('life',40)+14,(bx,cy)=>{const e=num(v,bx,cy);icon('life',e+6,cy+1,40);});}
  // deck symbols, right-aligned in the stat row
  const ss=46;let sx=PX-12-S.sy.length*(ss+8);
  sx=Math.max(sx,x);
  for(const s of S.sy){const im=symImg[s];if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,sx,RY+(RH-ss)/2,ss,ss);sx+=ss+8;}
  // abilities / event text, shrunk to fit
  const TX=48,TW=PX-48-62,TY=RY+RH+30,TH=IY+IH-24-TY;
  let k=1,layout;
  for(;k>.45;k-=.04){
    const nf=`${Math.round(36*k)}px ${DISPLAY}`,bf=`${Math.round(28*k)}px ${BODY}`,lh=Math.round(34*k),gap=Math.round(18*k);
    layout=[];let h=0;
    S.abs.forEach((a,i)=>{
      if(!a.n.trim()&&!a.t.trim())return;
      if(layout.length)h+=gap;
      if(a.n.trim()){layout.push({t:a.n.trim(),f:nf,y:h+Math.round(36*k)});h+=Math.round(42*k);}
      for(const l of wrap(a.t,bf,TW)){layout.push({t:l,f:bf,y:h+Math.round(28*k)});h+=lh;}
    });
    if(h<=TH)break;
  }
  ctx.fillStyle=INK;ctx.textBaseline='alphabetic';
  for(const l of layout){ctx.font=l.f;ctx.fillText(l.t,TX,TY+l.y-10);}
  // strength disc
  if(isUnit()){
    const cx=850,cy=600,r=74;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(cx,cy,r,0,7);
    const dg=ctx.createRadialGradient(cx-20,cy-24,8,cx,cy,r);dg.addColorStop(0,'#7a5236');dg.addColorStop(1,'#33200f');ctx.fillStyle=dg;ctx.fill();ctx.restore();
    ctx.lineWidth=6;ctx.strokeStyle=mix(c2,'w',.15);ctx.beginPath();ctx.arc(cx,cy,r-3,0,7);ctx.stroke();
    ctx.lineWidth=2;ctx.strokeStyle='rgba(255,236,210,.45)';ctx.beginPath();ctx.arc(cx,cy,r-12,0,7);ctx.stroke();
    const v=String(S.str===''?0:S.str);ctx.font=`76px ${DISPLAY}`;ctx.fillStyle='#fff6ec';ctx.textBaseline='middle';
    const n=S.atk==='Ranged'?'ranged':'melee',ih=n==='ranged'?64:70,gap=6;
    const w=ctx.measureText(v).width,tot=w+gap+iconW(n,ih);const x0=cx-tot/2;ctx.fillText(v,x0,cy+4);ctx.textBaseline='alphabetic';
    icon(n,x0+w+gap,cy+2,ih);
  }
  ctx.restore();
  // inner frame line
  ctx.lineWidth=4;ctx.strokeStyle=mix(c2,'w',.35);rr(IX-2,IY-2,IW+4,IH+4,24);ctx.stroke();
  ctx.restore();
}

// ---------- start ----------
let TX={abilities:{},events:{}};
fill();
fetch('texts.json?v=202611170626').then(r=>r.json()).then(j=>{TX=j;showFields();}).catch(()=>{});
(async()=>{
  if(S.img){try{IMG=await loadImg(S.img);}catch(e){S.img=null;}showFields();}
  draw();
  try{await Promise.all([document.fonts.load(`66px "Pirata One"`),document.fonts.load('28px Alegreya'),document.fonts.load('italic 28px Alegreya')]);}catch(e){}
  draw();
})();
})();
