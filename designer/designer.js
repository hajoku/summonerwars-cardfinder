// Card designer: one faction (name, deck symbols, colors, logo) with any number of cards.
// Each card is drawn on a canvas (1050×750, landscape like the printed cards), so the preview is exactly what the PNG contains.
(()=>{
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height;
const SYMS=['Air','Cunning','Dark','Divine','Earth','Fire','Instinct','Light','Logic','Mercenary','Resolve','Spirit','Water'];
const PRESETS=[['#b3283a','#4a1a24'],['#2f7a3a','#1d3a20'],['#2b6a9a','#16314a'],['#c08a1e','#4d3612'],['#6e3b9a','#2e1a45'],['#4f5d6b','#22282e'],['#b8562a','#3f2214'],['#1f8a85','#123a38']];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const newCard=(o={})=>Object.assign({id:uid(),type:'Common',name:'',cost:1,life:2,str:2,atk:'Melee',phase:'Summon Phase',struct:false,sy:null,abs:[{n:'',t:''}],img:null,zoom:100,ox:0,oy:0},o);
function defFaction(){
  return {name:'Ashen Vale',sy:['Fire','Light'],c1:PRESETS[0][0],c2:PRESETS[0][1],logo:null,cur:0,cards:[
    newCard({type:'Summoner',name:'Ember Queen',life:7,str:3,atk:'Ranged',abs:[{n:'Flame Ward',t:'When this unit is attacked, the attacker takes 1 damage after the attack.'}]}),
    newCard({type:'Common',name:'Ember Guard',cost:2,life:4,str:2,sy:['Fire'],abs:[{n:'Steadfast',t:'This unit cannot be moved by enemy abilities or events.'}]})]};
}
let F=defFaction();
const card=()=>F.cards[F.cur];
const isUnit=c=>!c.type.includes('Event'), hasEmblem=c=>c.type==='Summoner'||c.type==='Epic Event';
const cardSyms=c=>c.type==='Summoner'?[...F.sy,'Mercenary']:(c.sy??F.sy.slice(0,1)).filter(s=>F.sy.includes(s));

// ---------- storage (IndexedDB, because several images do not fit into localStorage) ----------
const DB={
  db:null,
  open(){return this.db||(this.db=new Promise((ok,no)=>{const r=indexedDB.open('sw-designer',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);}));},
  async get(k){const d=await this.open();return new Promise((ok,no)=>{const r=d.transaction('kv').objectStore('kv').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});},
  async set(k,v){const d=await this.open();return new Promise((ok,no)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>no(t.error);});}
};
let saveT;
function save(){DB.set('faction',F).then(()=>{$('msg').textContent='';}).catch(()=>{$('msg').textContent='Could not save in this browser. Use “Save faction” to keep your work.';});}
function changed(){draw();clearTimeout(saveT);saveT=setTimeout(save,500);}

// ---------- images ----------
function loadImg(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});}
const IMGS=new Map();   // dataURL -> Image
function imgOf(src){if(!src)return null;let i=IMGS.get(src);if(!i){i=new Image();i.onload=()=>draw();i.src=src;IMGS.set(src,i);}return i.complete&&i.naturalWidth?i:null;}
async function ready(src){if(!src)return;const i=IMGS.get(src);if(i&&i.complete&&i.naturalWidth)return;const n=await loadImg(src);IMGS.set(src,n);}
async function readFile(f,max,type){
  const url=URL.createObjectURL(f);try{const i=await loadImg(url);
    const k=Math.min(1,max/Math.max(i.naturalWidth,i.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(i.naturalWidth*k);c.height=Math.round(i.naturalHeight*k);
    c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c.toDataURL(type,.88);}finally{URL.revokeObjectURL(url);}
}

// ---------- faction form ----------
const seg=(id,val)=>$(id).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===val));
const symBtn=s=>`<button type="button" class="sym" data-s="${s}" aria-pressed="false" title="${s}" aria-label="${s}"><img src="../img/symbols/${s}.png" alt=""></button>`;
$('facSy').innerHTML=SYMS.map(symBtn).join('');
$('presets').innerHTML=PRESETS.map(([a,b],i)=>`<button type="button" data-i="${i}" aria-label="Color preset ${i+1}" style="background:linear-gradient(135deg,${a} 50%,${b} 50%)"></button>`).join('');
function fillFaction(){
  $('facName').value=F.name;$('c1').value=F.c1;$('c2').value=F.c2;
  $('facSy').querySelectorAll('.sym').forEach(b=>b.setAttribute('aria-pressed',F.sy.includes(b.dataset.s)));
  $('facSyN').textContent=`(${F.sy.length}/2)`;$('noLogo').disabled=!F.logo;presetMark();
}
function presetMark(){$('presets').querySelectorAll('button').forEach(b=>{const p=PRESETS[b.dataset.i];b.setAttribute('aria-pressed',p[0]===F.c1&&p[1]===F.c2);});}
$('facName').addEventListener('input',e=>{F.name=e.target.value;changedFac();});
$('facSy').addEventListener('click',e=>{const b=e.target.closest('.sym');if(!b)return;const s=b.dataset.s;
  if(F.sy.includes(s))F.sy=F.sy.filter(x=>x!==s);else{F.sy=[...F.sy,s];if(F.sy.length>2)F.sy.shift();}
  fillFaction();fillCardSy();changedFac();});
$('presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[F.c1,F.c2]=PRESETS[b.dataset.i];fillFaction();changedFac();});
$('c1').addEventListener('input',e=>{F.c1=e.target.value;presetMark();changedFac();});
$('c2').addEventListener('input',e=>{F.c2=e.target.value;presetMark();changedFac();});
$('logo').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{F.logo=await readFile(f,512,'image/png');await ready(F.logo);fillFaction();changedFac();}catch(err){$('msg').textContent='This image could not be read. Try a PNG or JPG.';}});
$('noLogo').addEventListener('click',()=>{F.logo=null;fillFaction();changedFac();});

// ---------- card list: every card shows its picture; the one being edited gets the live canvas and the editor ----------
const SNAP=new Map();   // card id -> object URL of a rendered JPEG
let OPEN=true;
function snap(c){return new Promise(ok=>{draw(c);cv.toBlob(b=>{const u=URL.createObjectURL(b),old=SNAP.get(c.id);if(old)URL.revokeObjectURL(old);SNAP.set(c.id,u);
  const im=document.querySelector(`.cblk[data-id="${c.id}"] .pv img`);if(im)im.src=u;ok();},'image/jpeg',.9);draw();});}
async function snapOthers(){for(const c of [...F.cards]){if(c===card()||!F.cards.includes(c))continue;await ready(c.img).catch(()=>{});await snap(c);}}
let resnapT;function changedFac(){changed();clearTimeout(resnapT);resnapT=setTimeout(snapOthers,400);}
const headHtml=c=>`<span class="nm">${esc(c.name||'Unnamed')} <small>${esc(c.type.replace('Standard Event','Event'))}</small></span><span class="ed">Edit</span>`;
function renderList(){
  document.body.append(cv,$('editor'));
  $('cardList').innerHTML=F.cards.map((c,i)=>{const u=SNAP.get(c.id);return `<article class="cblk" data-id="${c.id}" data-i="${i}"><div class="pv">${i===F.cur?'':`<img alt="${esc(c.name||'Card')}"${u?` src="${u}"`:''}>`}</div><details${i===F.cur&&OPEN?' open':''}><summary>${headHtml(c)}</summary></details></article>`;}).join('');
  const blk=$('cardList').querySelector(`.cblk[data-i="${F.cur}"]`);
  blk.querySelector('.pv').appendChild(cv);cv.hidden=false;blk.querySelector('details').appendChild($('editor'));$('editor').hidden=false;
  $('cardN').textContent=`(${F.cards.length})`;$('delCard').disabled=F.cards.length<2;
}
function updHead(){const s=$('cardList').querySelector(`.cblk[data-i="${F.cur}"] summary`);if(s)s.innerHTML=headHtml(card());}
async function switchTo(i){
  const prev=card();F.cur=i;OPEN=true;snap(prev);renderList();fillCard();changed();
  $('cardList').querySelector(`.cblk[data-i="${i}"]`).scrollIntoView({block:'start',behavior:'smooth'});
}
$('cardList').addEventListener('click',e=>{const s=e.target.closest('summary');if(!s)return;e.preventDefault();const i=+s.closest('.cblk').dataset.i;
  if(i===F.cur){const d=s.parentElement;d.open=!d.open;OPEN=d.open;}else switchTo(i);});
$('addCard').addEventListener('click',()=>{const prev=card();F.cards.push(newCard({sy:F.sy.slice(0,1)}));F.cur=F.cards.length-1;OPEN=true;snap(prev);renderList();fillCard();changed();
  $('cardList').querySelector(`.cblk[data-i="${F.cur}"]`).scrollIntoView({block:'start',behavior:'smooth'});});
$('dupCard').addEventListener('click',()=>{const prev=card(),c=structuredClone(prev);c.id=uid();c.name=(c.name||'Unnamed')+' (copy)';F.cards.splice(F.cur+1,0,c);F.cur++;snap(prev);renderList();fillCard();changed();
  $('cardList').querySelector(`.cblk[data-i="${F.cur}"]`).scrollIntoView({block:'start',behavior:'smooth'});});
$('delCard').addEventListener('click',()=>{if(F.cards.length<2)return;const c=card();if(!confirm(`Delete “${c.name||'Unnamed'}”?`))return;
  const u=SNAP.get(c.id);if(u){URL.revokeObjectURL(u);SNAP.delete(c.id);}F.cards.splice(F.cur,1);F.cur=Math.min(F.cur,F.cards.length-1);renderList();fillCard();changed();});

// ---------- card form ----------
function fillCardSy(){
  const c=card();$('cardSy').innerHTML=F.sy.map(symBtn).join('')||'<p class="hint">Pick the faction’s deck symbols above first.</p>';
  const on=cardSyms(c);$('cardSy').querySelectorAll('.sym').forEach(b=>b.setAttribute('aria-pressed',on.includes(b.dataset.s)));
}
function renderAbs(){
  const c=card();
  $('abs').innerHTML=c.abs.map((a,i)=>`<div class="ab" data-i="${i}"><div class="row"><input type="text" data-k="n" autocomplete="off" autocorrect="off" spellcheck="false" value="${esc(a.n)}" placeholder="${isUnit(c)?'Ability name':'Name (optional, e.g. ACTIVE)'}" aria-label="Ability ${i+1} name"><button type="button" data-del="${i}" aria-label="Remove ability ${i+1}">✕</button></div><div class="sugg" hidden></div><textarea data-k="t" rows="3" placeholder="Text" aria-label="Ability ${i+1} text">${esc(a.t)}</textarea><div class="dice"><span>Insert:</span>${['special','melee','ranged'].map(n=>`<button type="button" data-die="${n}" aria-label="Insert ${n} symbol" title="[${n}]"><img src="../img/icons/die_${n}.png" alt=""></button>`).join('')}</div></div>`).join('');
}
function fillCard(){
  const c=card();
  seg('type',c.type);seg('atk',c.atk);
  for(const k of ['name','cost','life','str','phase'])$(k).value=c[k]??'';
  $('struct').checked=!!c.struct;$('zoom').value=c.zoom;$('ox').value=c.ox;$('oy').value=c.oy;
  updHead();renderAbs();fillCardSy();showFields();
}
function showFields(){
  const c=card(),u=isUnit(c);
  document.querySelectorAll('[data-show]').forEach(el=>{const k=el.dataset.show;
    el.hidden=k==='unit'?!u:k==='event'?u:k==='cost'?c.type==='Summoner':k==='life'?!(u||c.struct):k==='cardsy'?c.type==='Summoner':k==='summsy'?c.type!=='Summoner':false;});
  $('abLbl').textContent=u?'Abilities':'Event text';
  $('abHint').textContent=u?'Start typing an ability name and pick an existing ability from the suggestions to insert its text. Leave the name empty for plain text. A line break starts a new paragraph. Dice symbols: use the buttons below the text, or type [special], [melee], [ranged].':'Start typing an event name in the name field and pick an existing event to insert its text (the name is then removed). Leave the name empty for plain text, or use e.g. ACTIVE. Dice symbols: use the buttons below the text, or type [special], [melee], [ranged].';
  $('imgCtl').hidden=!c.img;$('noImg').disabled=!c.img;
}
$('type').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;card().type=b.dataset.v;seg('type',b.dataset.v);updHead();showFields();renderAbs();fillCardSy();changed();});
$('atk').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;card().atk=b.dataset.v;seg('atk',b.dataset.v);changed();});
$('name').addEventListener('input',e=>{card().name=e.target.value;updHead();changed();});
$('phase').addEventListener('input',e=>{card().phase=e.target.value;changed();});
for(const k of ['cost','life','str'])$(k).addEventListener('input',e=>{card()[k]=e.target.value===''?'':Math.max(0,Math.min(99,parseInt(e.target.value,10)||0));changed();});
$('struct').addEventListener('change',e=>{card().struct=e.target.checked;showFields();changed();});
$('cardSy').addEventListener('click',e=>{const b=e.target.closest('.sym');if(!b)return;const c=card(),s=b.dataset.s,cur=cardSyms(c);
  c.sy=cur.includes(s)?cur.filter(x=>x!==s):F.sy.filter(x=>x===s||cur.includes(x));fillCardSy();changed();});
for(const k of ['zoom','ox','oy'])$(k).addEventListener('input',e=>{card()[k]=+e.target.value;changed();});
$('img').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const c=card();c.img=await readFile(f,1400,'image/jpeg');c.zoom=100;c.ox=0;c.oy=0;await ready(c.img);fillCard();changed();}
  catch(err){$('msg').textContent='This image could not be read. Try a JPG or PNG.';}});
$('noImg').addEventListener('click',()=>{card().img=null;showFields();changed();});

// abilities + suggestions (own list: the browser's datalist does not show on many phones)
let TX={abilities:{},events:{}};
fetch('texts.json?v=202611171733').then(r=>r.json()).then(j=>{TX=j;}).catch(()=>{});
const srcTx=()=>isUnit(card())?TX.abilities:TX.events;
function pick(box,key){
  const c=card(),a=c.abs[box.dataset.i];a.t=srcTx()[key];a.n=isUnit(c)?key:'';
  box.querySelector('input').value=a.n;box.querySelector('textarea').value=a.t;box.querySelector('.sugg').hidden=true;changed();
}
function suggest(box,q){
  const sg=box.querySelector('.sugg');q=q.trim().toLowerCase();
  if(q.length<2){sg.hidden=true;return;}
  const names=Object.keys(srcTx());
  const hit=[...names.filter(n=>n.toLowerCase().startsWith(q)),...names.filter(n=>!n.toLowerCase().startsWith(q)&&n.toLowerCase().includes(q))].slice(0,8);
  sg.innerHTML=hit.map(n=>`<button type="button" data-pick="${esc(n)}">${esc(n)}</button>`).join('');sg.hidden=!hit.length;
}
$('abs').addEventListener('input',e=>{
  const box=e.target.closest('.ab');if(!box)return;const a=card().abs[box.dataset.i];a[e.target.dataset.k]=e.target.value;
  if(e.target.dataset.k==='n'){const key=Object.keys(srcTx()).find(k=>k.toLowerCase()===e.target.value.trim().toLowerCase());if(key){pick(box,key);return;}suggest(box,e.target.value);}
  changed();});
$('abs').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-pick]');if(b){e.preventDefault();pick(b.closest('.ab'),b.dataset.pick);}});
// dice buttons: insert the token at the cursor (pointerdown keeps the textarea's selection)
$('abs').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-die]');if(!b)return;e.preventDefault();
  const box=b.closest('.ab'),ta=box.querySelector('textarea'),a=card().abs[box.dataset.i],tok=`[${b.dataset.die}]`;
  const s=ta.selectionStart??ta.value.length,en=ta.selectionEnd??s,before=ta.value.slice(0,s),sp=before&&!/\s$/.test(before)?' ':'';
  ta.value=before+sp+tok+ta.value.slice(en);a.t=ta.value;const pos=s+sp.length+tok.length;ta.focus();ta.setSelectionRange(pos,pos);changed();});
$('abs').addEventListener('focusout',e=>{const box=e.target.closest('.ab');if(box&&e.target.dataset.k==='n')setTimeout(()=>{const s=box.querySelector('.sugg');if(s)s.hidden=true;},150);});
$('abs').addEventListener('keydown',e=>{if(e.key==='Escape'){const s=e.target.closest('.ab')?.querySelector('.sugg');if(s)s.hidden=true;}});
$('abs').addEventListener('click',e=>{const b=e.target.closest('[data-del]');if(!b)return;card().abs.splice(+b.dataset.del,1);renderAbs();changed();});
$('addAb').addEventListener('click',()=>{card().abs.push({n:'',t:''});renderAbs();changed();const t=$('abs').querySelectorAll('.ab');t[t.length-1].querySelector('input').focus();});

// ---------- actions ----------
const slug=s=>(s||'card').trim().replace(/[^\w\- ]+/g,'').replace(/\s+/g,'-').toLowerCase()||'card';
function dl(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
const toBlob=()=>new Promise(ok=>cv.toBlob(ok,'image/png'));
$('png').addEventListener('click',async()=>{draw();dl(await toBlob(),slug(card().name)+'.png');});
$('zip').addEventListener('click',async()=>{
  const btn=$('zip');btn.disabled=true;$('msg').textContent='Building ZIP …';
  try{
    await ready(F.logo);const files=[],used=new Set();
    for(const c of F.cards){
      await ready(c.img);draw(c);
      let n=slug(c.name),k=n,i=2;while(used.has(k))k=`${n}-${i++}`;used.add(k);
      files.push({name:k+'.png',data:new Uint8Array(await (await toBlob()).arrayBuffer())});
    }
    dl(zip(files),slug(F.name||'faction')+'.zip');$('msg').textContent=`${files.length} cards in the ZIP.`;
  }catch(err){$('msg').textContent='Could not build the ZIP.';}
  finally{btn.disabled=false;draw();}
});
$('saveJson').addEventListener('click',()=>dl(new Blob([JSON.stringify({swFaction:1,...F})],{type:'application/json'}),slug(F.name||'faction')+'.json'));
$('loadJson').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const o=JSON.parse(await f.text());F=normalize(o);await Promise.all([F.logo,...F.cards.map(c=>c.img)].map(s=>ready(s).catch(()=>{})));fillAll();changed();snapOthers();$('msg').textContent='Faction loaded.';}
  catch(err){$('msg').textContent='This file is not a saved faction.';}});
$('newFac').addEventListener('click',()=>{if(!confirm('Start a new faction? All cards of the current faction will be replaced. Save it first if you want to keep it.'))return;
  F={name:'',sy:[],c1:PRESETS[2][0],c2:PRESETS[2][1],logo:null,cur:0,cards:[newCard({type:'Summoner',cost:'',life:6,str:2})]};fillAll();changed();});

// accepts saved factions and the older single-card designs
function normalize(o){
  if(o&&o.swFaction&&Array.isArray(o.cards)&&o.cards.length){const f=Object.assign(defFaction(),o);delete f.swFaction;f.cards=f.cards.map(c=>newCard(c));f.cur=Math.min(Math.max(0,f.cur|0),f.cards.length-1);return f;}
  if(o&&(o.swCardDesign||o.type)){const f=defFaction();f.name=o.faction||'';f.sy=(o.sy||[]).filter(s=>s!=='Mercenary').slice(0,2);f.c1=o.c1||f.c1;f.c2=o.c2||f.c2;
    f.cards=[newCard({type:o.type,name:o.name,cost:o.cost,life:o.life,str:o.str,atk:o.atk,phase:o.phase,struct:!!o.struct,abs:o.abs||[],img:o.img||null,zoom:o.zoom||100,ox:o.ox||0,oy:o.oy||0,sy:null})];f.cur=0;return f;}
  throw new Error('unknown format');
}
function fillAll(){for(const u of SNAP.values())URL.revokeObjectURL(u);SNAP.clear();OPEN=true;fillFaction();renderList();fillCard();}

// minimal ZIP writer (stored, no compression; PNGs are already compressed)
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(d){let c=0xFFFFFFFF;for(let i=0;i<d.length;i++)c=CRC[(c^d[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const d=new Date(),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  for(const f of files){
    const nm=enc.encode(f.name),crc=crc32(f.data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);
    parts.push(h,nm,f.data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(12,tm,true);c.setUint16(14,dt,true);c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cen.push(c,nm);off+=30+nm.length+f.data.length;
  }
  const size=cen.reduce((s,p)=>s+p.byteLength,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,e],{type:'application/zip'});
}

// ---------- drawing ----------
const DISPLAY='"Pirata One", Georgia, serif', BODY='Alegreya, Georgia, serif';
function rgb(h){const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];}
function mix(h,t,a){const c=rgb(h),d=t==='w'?[255,255,255]:[0,0,0];return `rgb(${c.map((v,i)=>Math.round(v+(d[i]-v)*a)).join(',')})`;}
function rgba(h,a){return `rgba(${rgb(h).join(',')},${a})`;}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
const symImg={};SYMS.forEach(s=>{const i=new Image();i.onload=()=>draw();i.src=`../img/symbols/${s}.png`;symImg[s]=i;});
const ICON={};['cost','life','melee','ranged'].forEach(n=>{const i=new Image();i.onload=()=>draw();i.src=`../img/icons/${n}.png`;ICON[n]=i;});
const iconW=(n,h)=>{const i=ICON[n];return i&&i.naturalWidth?i.naturalWidth/i.naturalHeight*h:h;};
function icon(n,x,cy,h){const i=ICON[n];if(i&&i.complete&&i.naturalWidth)ctx.drawImage(i,x,cy-h/2,iconW(n,h),h);}
function crown(cx,cy,s,col){ctx.beginPath();ctx.moveTo(cx-s,cy+s*.6);ctx.lineTo(cx-s,cy-s*.35);ctx.lineTo(cx-s*.5,cy+s*.1);ctx.lineTo(cx,cy-s*.75);ctx.lineTo(cx+s*.5,cy+s*.1);ctx.lineTo(cx+s,cy-s*.35);ctx.lineTo(cx+s,cy+s*.6);ctx.closePath();ctx.fillStyle=col;ctx.fill();}
function fitIn(img,cx,cy,mw,mh,alpha=1){const k=Math.min(mw/img.naturalWidth,mh/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,cx-w/2,cy-h/2,w,h);ctx.restore();}
// dice symbols inside ability text: [special] [melee] [ranged]
const DIE={};['special','melee','ranged'].forEach(n=>{const i=new Image();i.onload=()=>draw();i.src=`../img/icons/die_${n}.png`;DIE[n]=i;});
const DIE_RE=/(\[(?:special|melee|ranged)\])/i;
const fontPx=f=>parseFloat(f)||28;
function dieW(n,px){const i=DIE[n];return (i&&i.naturalWidth?i.naturalWidth/i.naturalHeight:0.6)*px*0.95+px*0.12;}
function measure(str){const px=fontPx(ctx.font);let w=0;for(const s of String(str).split(DIE_RE)){if(!s)continue;const m=s.match(/^\[(\w+)\]$/);w+=m&&DIE[m[1].toLowerCase()]?dieW(m[1].toLowerCase(),px):ctx.measureText(s).width;}return w;}
function drawRich(str,x,y){const px=fontPx(ctx.font);for(const s of String(str).split(DIE_RE)){if(!s)continue;const m=s.match(/^\[(\w+)\]$/),n=m&&m[1].toLowerCase();
  if(n&&DIE[n]){const i=DIE[n],h=px*0.95;if(i.complete&&i.naturalWidth)ctx.drawImage(i,x+px*0.06,y-px*0.8,i.naturalWidth/i.naturalHeight*h,h);x+=dieW(n,px);}
  else{ctx.fillText(s,x,y);x+=ctx.measureText(s).width;}}}
function wrap(text,font,maxW){
  ctx.font=font;const lines=[];
  for(const para of String(text).split(/\n/)){
    let line='';
    for(const w of para.split(/\s+/).filter(Boolean)){const t=line?line+' '+w:w;if(measure(t)>maxW&&line){lines.push(line);line=w;}else line=t;}
    lines.push(line);
  }
  return lines;
}
function fitText(t,font,size,maxW){ctx.font=`${size}px ${font}`;while(size>14&&ctx.measureText(t).width>maxW){size--;ctx.font=`${size}px ${font}`;}return size;}

function draw(C=card()){
  const c1=F.c1,c2=F.c2,INK='#2a1f19',U=isUnit(C),IMG=imgOf(C.img),LOGO=imgOf(F.logo);
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
    const k=Math.max(A.w/IMG.naturalWidth,A.h/IMG.naturalHeight)*C.zoom/100,w=IMG.naturalWidth*k,h=IMG.naturalHeight*k;
    const x=A.x+(A.w-w)/2-C.ox/100*Math.max(0,(w-A.w)/2+A.w*.25),y=A.y+(A.h-h)/2-C.oy/100*Math.max(0,(h-A.h)/2+A.h*.25);
    ctx.drawImage(IMG,x,y,w,h);
  }else{
    const g=ctx.createRadialGradient(A.x+A.w*.55,A.y+A.h*.45,20,A.x+A.w*.55,A.y+A.h*.45,A.w*.8);
    g.addColorStop(0,mix(c1,'w',.35));g.addColorStop(1,mix(c2,'k',.2));ctx.fillStyle=g;ctx.fillRect(IX,IY,IW,IH);
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.font=`34px ${BODY}`;ctx.textAlign='center';ctx.fillText('Upload artwork',A.x+A.w*.58,A.y+A.h*.48);ctx.textAlign='left';
  }
  // text panel (parchment), concave right edge
  const PX=600;
  const pg=ctx.createLinearGradient(0,IY,0,IY+IH);pg.addColorStop(0,'#f4ecdd');pg.addColorStop(1,'#e6dac4');
  const EY=IY+200,EB=IY+IH,ctrl=[PX-60,(EY+EB)/2];
  ctx.beginPath();ctx.moveTo(IX,IY);ctx.lineTo(PX-30,IY);ctx.lineTo(PX,EY);ctx.quadraticCurveTo(ctrl[0],ctrl[1],PX-14,EB);ctx.lineTo(IX,EB);ctx.closePath();
  ctx.fillStyle=pg;ctx.fill();
  // faded faction logo behind the text
  if(LOGO){ctx.save();ctx.clip();ctx.filter='grayscale(1)';fitIn(LOGO,(IX+PX-40)/2,(EY+70+EB)/2,380,380,.1);ctx.restore();}
  ctx.lineWidth=7;ctx.strokeStyle=c2;ctx.beginPath();ctx.moveTo(PX,EY);ctx.quadraticCurveTo(ctrl[0],ctrl[1],PX-14,EB);ctx.stroke();
  // header band over the art
  const hg=ctx.createLinearGradient(PX-60,0,PX+260,0);hg.addColorStop(0,'rgba(244,236,221,1)');hg.addColorStop(1,'rgba(244,236,221,0)');
  ctx.fillStyle=hg;ctx.fillRect(PX-60,IY,320,128);
  // class line band
  const cg=ctx.createLinearGradient(IX,0,PX+200,0);cg.addColorStop(0,c1);cg.addColorStop(.75,rgba(c1,.95));cg.addColorStop(1,rgba(c1,0));
  ctx.fillStyle=cg;ctx.fillRect(IX,112,PX+200-IX,36);
  // name
  const name=C.name||'Unnamed';const ns=fitText(name,DISPLAY,66,PX+180-50);
  ctx.fillStyle=INK;ctx.font=`${ns}px ${DISPLAY}`;ctx.textBaseline='alphabetic';ctx.fillText(name,48,98);
  // class line
  const st=C.struct?' • Structure':'';const cls=U?`${C.type} Unit${st} • ${F.name||'Faction'}`:`${C.type}${st} • ${C.phase}`;
  const cs=fitText(cls,`italic ${BODY}`,27,PX+150-50);ctx.font=`italic ${cs}px ${BODY}`;ctx.fillStyle='#fff4e8';ctx.fillText(cls,48,139);
  // stat row
  const RY=154,RH=66;
  const sg=ctx.createLinearGradient(IX,0,PX+40,0);sg.addColorStop(0,mix(c2,'k',.35));sg.addColorStop(.85,mix(c2,'k',.2));sg.addColorStop(1,rgba(c2,0));
  ctx.beginPath();ctx.moveTo(IX,RY);ctx.lineTo(PX+40,RY);ctx.lineTo(PX+10,RY+RH);ctx.lineTo(IX,RY+RH);ctx.closePath();ctx.fillStyle=sg;ctx.fill();
  let x=40;const box=(w,fn)=>{rr(x,RY+7,w,RH-14,6);ctx.fillStyle=mix(c1,'k',.25);ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=mix(c1,'w',.35);ctx.stroke();fn(x,RY+RH/2);x+=w+12;};
  const num=(v,bx,cy)=>{ctx.font=`50px ${DISPLAY}`;ctx.fillStyle='#fff6ec';ctx.textBaseline='middle';ctx.fillText(String(v),bx+16,cy+3);const w=ctx.measureText(String(v)).width;ctx.textBaseline='alphabetic';return bx+16+w;};
  if(hasEmblem(C))box(84,(bx,cy)=>LOGO?fitIn(LOGO,bx+42,cy,64,44):crown(bx+42,cy+2,24,'#fff1d6'));
  if(C.type!=='Summoner'){const v=C.cost===''?0:C.cost;ctx.font=`50px ${DISPLAY}`;const w=ctx.measureText(String(v)).width;box(w+16+6+iconW('cost',42)+14,(bx,cy)=>{const e=num(v,bx,cy);icon('cost',e+6,cy,42);});}
  if(U||C.struct){const v=C.life===''?0:C.life;ctx.font=`50px ${DISPLAY}`;const w=ctx.measureText(String(v)).width;box(w+16+6+iconW('life',40)+14,(bx,cy)=>{const e=num(v,bx,cy);icon('life',e+6,cy+1,40);});}
  // deck symbols, right-aligned in the stat row
  const sy=cardSyms(C),ss=46;let sx=Math.max(PX-12-sy.length*(ss+8),x);
  for(const s of sy){const im=symImg[s];if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,sx,RY+(RH-ss)/2,ss,ss);sx+=ss+8;}
  // abilities / event text, shrunk to fit
  const TX=48,TW=PX-48-62,TY=RY+RH+30,TH=IY+IH-24-TY;
  let k=1,layout;
  for(;k>.45;k-=.04){
    const nf=`${Math.round(36*k)}px ${DISPLAY}`,bf=`${Math.round(28*k)}px ${BODY}`,lh=Math.round(34*k),gap=Math.round(18*k);
    layout=[];let h=0;
    C.abs.forEach(a=>{
      if(!a.n.trim()&&!a.t.trim())return;
      if(layout.length)h+=gap;
      if(a.n.trim()){layout.push({t:a.n.trim(),f:nf,y:h+Math.round(36*k)});h+=Math.round(42*k);}
      for(const l of wrap(a.t,bf,TW)){layout.push({t:l,f:bf,y:h+Math.round(28*k)});h+=lh;}
    });
    if(h<=TH)break;
  }
  ctx.fillStyle=INK;ctx.textBaseline='alphabetic';
  for(const l of layout){ctx.font=l.f;drawRich(l.t,TX,TY+l.y-10);}
  // strength disc
  if(U){
    const cx=850,cy=600,r=74;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(cx,cy,r,0,7);
    const dg=ctx.createRadialGradient(cx-20,cy-24,8,cx,cy,r);dg.addColorStop(0,'#7a5236');dg.addColorStop(1,'#33200f');ctx.fillStyle=dg;ctx.fill();ctx.restore();
    ctx.lineWidth=6;ctx.strokeStyle=mix(c2,'w',.15);ctx.beginPath();ctx.arc(cx,cy,r-3,0,7);ctx.stroke();
    ctx.lineWidth=2;ctx.strokeStyle='rgba(255,236,210,.45)';ctx.beginPath();ctx.arc(cx,cy,r-12,0,7);ctx.stroke();
    const v=String(C.str===''?0:C.str);ctx.font=`76px ${DISPLAY}`;ctx.fillStyle='#fff6ec';ctx.textBaseline='middle';
    const n=C.atk==='Ranged'?'ranged':'melee',ih=n==='ranged'?64:70,gap=6;
    const w=ctx.measureText(v).width,tot=w+gap+iconW(n,ih);const x0=cx-tot/2;ctx.fillText(v,x0,cy+4);ctx.textBaseline='alphabetic';
    icon(n,x0+w+gap,cy+2,ih);
  }
  ctx.restore();
  // inner frame line
  ctx.lineWidth=4;ctx.strokeStyle=mix(c2,'w',.35);rr(IX-2,IY-2,IW+4,IH+4,24);ctx.stroke();
  ctx.restore();
}

// ---------- start ----------
(async()=>{
  let stored=null;try{stored=await DB.get('faction');}catch(e){}
  if(stored){try{F=normalize({...stored,swFaction:1});}catch(e){}}
  else{try{const old=localStorage.getItem('swd-card');if(old){F=normalize(JSON.parse(old));save();}}catch(e){}}
  fillAll();draw();
  await Promise.all([F.logo,...F.cards.map(c=>c.img)].map(s=>ready(s).catch(()=>{})));draw();
  try{await Promise.all([document.fonts.load(`66px "Pirata One"`),document.fonts.load('28px Alegreya'),document.fonts.load('italic 28px Alegreya')]);}catch(e){}
  draw();await Promise.all([...Object.values(symImg),...Object.values(ICON)].map(i=>i.complete?0:new Promise(r=>{i.addEventListener('load',r);i.addEventListener('error',r);})));snapOthers();
})();
})();
