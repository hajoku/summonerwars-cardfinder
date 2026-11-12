(async()=>{
const D=await fetch('data/cards.json?v=202611121049').then(r=>r.json());
const BY=Object.fromEntries(D.cards.map(c=>[c.n,c]));
let DECK={};
try{DECK=JSON.parse(localStorage.getItem('sw-deck')||'{}')||{};}catch(e){DECK={};}
const SP='start:';
for(const k of Object.keys(DECK)){
  if(k.startsWith(SP)&&BY[k.slice(SP.length)]&&DECK[k]>0){const n=k.slice(SP.length);DECK[n]=(DECK[n]||0)+DECK[k];}
  if(k.startsWith(SP)||!BY[k]||!(DECK[k]>0))delete DECK[k];
}
const saveDeck=()=>{try{localStorage.setItem('sw-deck',JSON.stringify(DECK));}catch(e){}};
saveDeck();
const cnt=name=>DECK[name]||0;
let mode='search';

const $=id=>document.getElementById(id);
const CLS={Unit:['Summoner Unit','Champion Unit','Common Unit'],Event:['Standard Event','Epic Event']};
const PH=['Summon Phase','Move Phase','Build Phase','Attack Phase','Magic Phase','Any Phase'];
const st={kind:'Unit',sy:new Set(),cls:new Set(),ph:new Set(),g:new Set(),struct:'',mr:''};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
$('symChips').innerHTML=D.syms.map(s=>`<button type="button" class="sym" data-s="${s}" aria-pressed="false" aria-label="${s}" title="${s}"><img src="img/symbols/${s}.png" alt=""></button>`).join('');
const chipHtml=a=>a.map(s=>`<button type="button" class="chip" data-s="${s}" aria-pressed="false">${s.replace(' Phase','')}</button>`).join('');
$('ph').innerHTML=chipHtml(PH);
function setKind(k){st.kind=k;st.cls.clear();st.ph.clear();st.g.clear();st.mr='';$('cls').innerHTML=chipHtml(CLS[k]);
  $('grps').innerHTML=D.gorder[k].map(g=>`<button type="button" class="chip" data-s="${g}" aria-pressed="false" title="${esc(D.groups[k][g].join(', '))}">${g}</button>`).join('');
  $('grpLbl').textContent=k==='Unit'?'Ability groups':'Effect groups';$('grpHint').textContent=k==='Unit'?'Hover a group to see its abilities.':'Hover a group to see its events.';$('grpN').textContent='';
  $('ph').querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed','false'));
  $('mr').querySelectorAll('button').forEach((x,i)=>x.setAttribute('aria-pressed',i===0));
  if(k==='Event'){$('strMin').value='';$('strMax').value='';if($('sort').value==='str')$('sort').value='n';}
  document.querySelectorAll('[data-for]').forEach(el=>el.hidden=el.dataset.for!==k);
  $('kind').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===k));
  $('q').placeholder=k==='Unit'?'Name, ability, text …':'Name, effect text …';}
setKind('Unit');
$('fac').insertAdjacentHTML('beforeend',D.facs.map(f=>`<option>${esc(f)}</option>`).join(''));
function toggle(set,btn){const v=btn.dataset.s;set.has(v)?set.delete(v):set.add(v);btn.setAttribute('aria-pressed',set.has(v));$('symChips').classList.toggle('none',st.sy.size===0);render();}
$('symChips').addEventListener('click',e=>{const b=e.target.closest('.sym');if(b)toggle(st.sy,b);});
$('cls').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b)toggle(st.cls,b);});
$('ph').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b)toggle(st.ph,b);});
$('grps').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){toggle(st.g,b);$('grpN').textContent=st.g.size?`(${st.g.size})`:'';}});
$('kind').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.v!==st.kind){setKind(b.dataset.v);render();}});
$('mr').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;st.mr=b.dataset.v;$('mr').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();});
$('struct').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;st.struct=b.dataset.v;$('struct').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();});
['q','fac','sort','costMin','costMax','strMin','strMax','hpMin','hpMax'].forEach(id=>$(id).addEventListener('input',()=>render()));
$('reset').addEventListener('click',()=>{st.sy.clear();st.struct='';setKind(st.kind);
  document.querySelectorAll('.sym,.chip').forEach(c=>c.setAttribute('aria-pressed','false'));$('symChips').classList.add('none');
  $('struct').querySelectorAll('button').forEach((x,i)=>x.setAttribute('aria-pressed',i===0));
  ['q','costMin','costMax','strMin','strMax','hpMin','hpMax'].forEach(id=>$(id).value='');$('fac').value='';render();});
const n=id=>{const v=$(id).value.trim();return v===''?null:Number(v);};
function inRange(v,lo,hi){if(lo===null&&hi===null)return true;if(v===null||v===undefined)return false;return (lo===null||v>=lo)&&(hi===null||v<=hi);}
let limit=60, view='list';
try{view=localStorage.getItem('sw-view')||'list';}catch(e){}
function setView(v){view=v;$('view').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===v));try{localStorage.setItem('sw-view',v);}catch(e){}}
setView(view);
$('view').addEventListener('click',e=>{const b=e.target.closest('button');if(b){setView(b.dataset.v);render(false);}});
$('list').addEventListener('click',e=>{const h=e.target.closest('th[data-k]');if(h){$('sort').value=h.dataset.k;render(false);}});
function sortCards(r){const key=$('sort').value,num=['cost','str','hp'].includes(key);
  return r.sort((a,b)=>{if(num){const x=a[key]??-1,y=b[key]??-1;if(x!==y)return y-x;}else if(key==='f'&&a.f!==b.f)return a.f.localeCompare(b.f);return a.n.localeCompare(b.n);});}
function render(reset=true){
  if(mode==='deck'){renderDeck();return;}
  if(reset)limit=60;
  const q=$('q').value.trim().toLowerCase(), fac=$('fac').value, key=$('sort').value;
  const cm=n('costMin'),cM=n('costMax'),sm=n('strMin'),sM=n('strMax'),hm=n('hpMin'),hM=n('hpMax');
  const r=D.cards.filter(c=>{
    if(c.t!==st.kind)return false;
    if(st.cls.size&&!st.cls.has(c.cls))return false;
    if(st.ph.size&&!st.ph.has(c.ph))return false;
    if(st.mr&&c.mr!==st.mr)return false;
    if(st.g.size&&!c.g.some(x=>st.g.has(x)))return false;
    if(st.struct!==''&&c.st!==(st.struct==='1'))return false;
    if(fac&&c.f!==fac)return false;
    if(st.sy.size&&!c.sy.some(s=>st.sy.has(s)))return false;
    if(!inRange(c.cost,cm,cM)||!inRange(c.hp,hm,hM)||!inRange(c.str,sm,sM))return false;
    if(q&&!(c.n+' '+c.f+' '+c.tx+' '+c.cls+' '+(c.ph||'')).toLowerCase().includes(q))return false;
    return true;});
  sortCards(r);
  const tot=D.cards.filter(c=>c.t===st.kind).length, word=st.kind==='Unit'?'units':'events';
  const txt=`${r.length} of ${tot} ${word}`;$('count').textContent=txt;$('count2').textContent=txt;
  const shown=r.slice(0,limit);
  $('list').innerHTML=shown.length?(view==='table'?table(shown):shown.map(c=>card(c)).join(''))+(r.length>limit?`<button class="more" type="button" id="more">Show ${r.length-limit} more</button>`:''):`<div class="empty">No card matches these filters. Loosen a filter or reset them.</div>`;
  const m=$('more');if(m)m.onclick=()=>{limit+=100;render(false);};
}
function fmt(c){return esc(c.tx).split(' // ').map(p=>{const m=p.match(/^([^.]{2,32})\. (.*)$/);return c.t==='Unit'&&m?`<span class="ab">${m[1]}.</span> ${m[2]}`:p;}).join('<br>');}
function abNames(c){return c.tx.split(' // ').map(p=>{const i=p.indexOf('. ');const nm=i>0&&i<34?p.slice(0,i):p;return `<span title="${esc(p)}">${esc(nm)}</span>`;}).join(', ');}
function table(rows,kind=st.kind,pre=''){
  const U=kind==='Unit', key=$('sort').value;
  const cols=U?[['Name','n'],['Faction','f'],['Class'],['Struct.'],['Cost','cost'],['Life','hp'],['Str.','str'],['Attack'],['Symbols'],['Abilities']]
              :[['Name','n'],['Faction','f'],['Class'],['Struct.'],['Cost','cost'],['Life','hp'],['Phase'],['Symbols'],['Effect']];
  cols.unshift(['Deck']);
  const head=cols.map(([l,k])=>k?`<th class="s${k===key?' on':''}" data-k="${k}" scope="col">${l}</th>`:`<th scope="col">${l}</th>`).join('');
  const v=x=>x===null||x===undefined?'':x;
  const body=rows.map(c=>{
    const sy=c.sy.map(s=>`<img src="img/symbols/${s}.png" alt="${s}" title="${s}">`).join('');
    const common=`<td class="nm">${esc(c.n)}</td><td class="fa">${esc(c.f)}</td><td class="cl">${c.c}</td><td class="ctr">${c.st?'<span class="yes">✓</span>':''}</td><td class="num">${v(c.cost)}</td><td class="num">${v(c.hp)}</td>`;
    return `<tr data-card="${esc(pre+c.n)}"${cnt(pre+c.n)?' class="indeck"':''}><td class="dkc">${ctl(c,pre)}</td>`+common+(U?`<td class="num">${v(c.str)}</td><td>${c.mr}</td>`:`<td class="cl">${esc((c.ph||'').replace(' Phase',''))}</td>`)+`<td class="sy">${sy}</td>`+`<td class="tx">${fmt(c)}</td></tr>`;}).join('');
  return `<div class="tbl"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function ctl(c,pre=''){const key=pre+c.n,k=cnt(key);return `<div class="dk${k?' on':''}" data-n="${esc(key)}"><button type="button" class="dm" aria-label="Remove one ${esc(c.n)}"${k?'':' disabled'}>−</button><span class="dn" aria-live="polite">${k}</span><button type="button" class="dp" aria-label="Add one ${esc(c.n)}">+</button></div>`;}
function card(c,pre=''){
  const syms=c.sy.map(s=>`<img src="img/symbols/${s}.png" alt="${s}" title="${s}">`).join('');
  const stats=[];
  if(c.cost!==null)stats.push(`<span class="stat"><i>Cost</i>${c.cost}</span>`);
  if(c.hp!==null)stats.push(`<span class="stat"><i>Life</i>${c.hp}</span>`);
  if(c.str!==null)stats.push(`<span class="stat"><i>${c.mr==='Ranged'?'Ranged':'Melee'}</i>${c.str}</span>`);
  const tags=[];if(c.st)tags.push('Structure');if(c.lim)tags.push('Limited');if(c.ph)tags.push(c.ph);
  const tx=esc(c.tx).split(' // ').map(p=>{const m=p.match(/^([^.]{2,32})\. (.*)$/);return c.t==='Unit'&&m?`<span class="ab">${m[1]}.</span> ${m[2]}`:p;}).join('<br>');
  return `<article class="card${cnt(pre+c.n)?' indeck':''}" data-card="${esc(pre+c.n)}"><div class="top"><div class="nm"><b>${esc(c.n)}</b><small>${esc(c.f)} · ${c.cls}</small></div><div class="syms">${syms}</div>${ctl(c,pre)}</div>
  <div class="stats">${stats.join('')}${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p class="tx">${tx}</p></article>`;
}
// ---- deck ----
const ORDER=[['Summoner Unit','Summoner'],['Champion Unit','Champions'],['Common Unit','Commons'],['Epic Event','Epic Events'],['Standard Event','Standard Events']];
function change(key,d){
  const before=cnt(key), k=Math.max(0,before+d);
  setCount(key,k);
  // convenience: adding a summoner also adds its starting units and 2x its epic event (all removable)
  const c=BY[key];
  if(c.cls==='Summoner Unit'&&before===0&&k>0){
    const epic=D.cards.find(x=>x.cls==='Epic Event'&&x.f===c.f);
    if(epic&&!cnt(epic.n))setCount(epic.n,2);
    (D.start[c.f]||[]).forEach(n=>setCount(n,cnt(n)+1));
  }
  badge();
  if(mode==='deck')renderDeck();
}
function setCount(key,k){
  if(k)DECK[key]=k;else delete DECK[key];
  saveDeck();
  document.querySelectorAll(`.dk[data-n="${CSS.escape(key)}"]`).forEach(el=>{
    el.classList.toggle('on',k>0);el.querySelector('.dn').textContent=k;el.querySelector('.dm').disabled=!k;});
  document.querySelectorAll(`[data-card="${CSS.escape(key)}"]`).forEach(el=>el.classList.toggle('indeck',k>0));
}
function total(){return Object.values(DECK).reduce((a,b)=>a+b,0);}
function badge(){$('deckN').textContent=total();}
function checks(cards){
  const out=[];const add=(ok,txt)=>out.push({ok,txt});
  const of=cls=>cards.filter(c=>c.cls===cls);
  const sum=a=>a.reduce((x,c)=>x+DECK[c.n],0);
  const S=of('Summoner Unit'), CH=of('Champion Unit'), CO=of('Common Unit'), EP=of('Epic Event'), SE=of('Standard Event');
  const ns=sum(S);
  add(ns===1, ns===1?`1 summoner (${S[0].n})`:`Exactly 1 summoner needed (has ${ns})`);
  const summ=ns===1?S[0]:null;
  const start=summ&&D.start[summ.f]||[];
  const nc=sum(CH), dupC=CH.filter(c=>DECK[c.n]>1);
  add(nc===3, nc===3?'3 champions':`Exactly 3 champions needed (has ${nc})`);
  add(!dupC.length, dupC.length?`Each champion only once (${dupC.map(c=>c.n).join(', ')})`:'Each champion at most once');
  // starting units are ordinary commons; they come on top of the 16 and don't count toward the 4-copy limit
  if(summ){
    if(D.start[summ.f]){
      const miss=start.filter(n=>!cnt(n));
      add(!miss.length, miss.length?`Starting units missing: ${miss.join(', ')}`:`Starting units included: ${start.join(', ')}`);
    }else add(false,`Starting units for ${summ.f} are not in the data yet`);
  }
  const no=sum(CO), want=16+start.length;
  add(no===want, no===want?`${want} commons (16 + ${start.length} starting units)`:`Exactly ${want} commons needed${start.length?` (16 + ${start.length} starting units)`:''} (has ${no})`);
  const lim=c=>4+(start.includes(c.n)?1:0);
  const overC=CO.filter(c=>DECK[c.n]>lim(c));
  add(!overC.length, overC.length?`At most 4 copies per common, plus the starting unit (${overC.map(c=>c.n).join(', ')})`:'At most 4 copies per common (starting units extra)');
  const nst=sum(SE), overS=SE.filter(c=>DECK[c.n]>2);
  add(nst===6, nst===6?'6 standard events':`Exactly 6 standard events needed (has ${nst})`);
  add(!overS.length, overS.length?`At most 2 copies per standard event (${overS.map(c=>c.n).join(', ')})`:'At most 2 copies per standard event');
  const ne=sum(EP);
  if(summ){
    const own=D.cards.find(c=>c.cls==='Epic Event'&&c.f===summ.f);
    const ok=ne===2&&EP.length===1&&EP[0]===own;
    add(ok, ok?`2× ${own.n} (epic event of ${summ.n})`:`Epic events must be 2× ${own?own.n:'the summoner’s epic event'} (has ${ne}${EP.some(c=>c!==own)?', including another faction’s epic':''})`);
    const sy=new Set(summ.sy);
    const bad=cards.filter(c=>c.cls!=='Summoner Unit'&&c.cls!=='Epic Event'&&!c.sy.some(s=>sy.has(s)));
    add(!bad.length, bad.length?`Cards without a matching deck symbol: ${bad.map(c=>c.n).join(', ')}`:'All cards share a deck symbol with the summoner');
  }else{
    add(ne===2,`Exactly 2 epic events needed (has ${ne})`);
    add(false,'Deck symbols and starting units can only be checked once a summoner is chosen');
  }
  return {list:out,legal:out.every(x=>x.ok),summ};
}
function renderDeck(){
  const cards=Object.keys(DECK).map(k=>BY[k]);
  const tot=total();
  const chk=checks(cards);
  $('deckTot').innerHTML=`${tot} cards <span class="legal ${chk.legal?'ok':'bad'}">${chk.legal?'✓ Legal deck':'✗ Not legal yet'}</span>`;
  const per=ORDER.map(([cls,l])=>[l,cards.filter(c=>c.cls===cls).reduce((a,c)=>a+DECK[c.n],0)]);
  $('deckSum').innerHTML=per.map(([l,n])=>`<span class="pill">${l} <b>${n}</b></span>`).join('');
  $('deckChecks').innerHTML=chk.list.map(x=>`<li class="${x.ok?'ok':'bad'}"><span aria-hidden="true">${x.ok?'✓':'✗'}</span> ${esc(x.txt)}</li>`).join('')+`<li class="info"><span aria-hidden="true">ℹ</span> Gates (one 10-life, three 5-life) are part of every deck and not listed here.</li>`;
  $('count2').textContent=tot===1?'1 card in deck':`${tot} cards in deck`;
  if(!tot){$('list').innerHTML=`<div class="empty">Your deck is empty. Switch to Search and use the + buttons to add cards.</div>`;return;}
  const rank=c=>ORDER.findIndex(([cls])=>cls===c.cls);
  const sec=(l,n,body)=>`<section class="dsec"><h3 class="dgh"><span>${l}</span><span>${n}</span></h3>${body}</section>`;
  let html='';
  const units=sortCards(cards.filter(c=>c.t==='Unit')).sort((a,b)=>rank(a)-rank(b));
  if(units.length)html+=sec('Units',units.reduce((a,c)=>a+DECK[c.n],0),view==='table'?table(units,'Unit'):units.map(c=>card(c)).join(''));
  const evs=sortCards(cards.filter(c=>c.t==='Event')).sort((a,b)=>rank(a)-rank(b));
  if(evs.length)html+=sec('Events',evs.reduce((a,c)=>a+DECK[c.n],0),view==='table'?table(evs,'Event'):evs.map(c=>card(c)).join(''));
  $('list').innerHTML=html;
}
function setMode(m){mode=m;
  $('tabs').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===m));
  document.querySelector('.wrap').classList.toggle('deckmode',m==='deck');
  $('deckView').hidden=m!=='deck';
  document.querySelector('#sort option[value="str"]').hidden=m==='deck'?false:st.kind!=='Unit';
  render(false);
  try{localStorage.setItem('sw-mode',m);}catch(e){}
}
$('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.v!==mode)setMode(b.dataset.v);});
document.addEventListener('click',e=>{
  const p=e.target.closest('.dk .dp'),m=e.target.closest('.dk .dm');
  if(p||m){change((p||m).closest('.dk').dataset.n,p?1:-1);return;}
});
let armed=null;
$('clearDeck').addEventListener('click',()=>{
  const b=$('clearDeck');
  if(!total())return;
  if(!b.classList.contains('warn')){b.classList.add('warn');b.textContent='Tap again to clear';clearTimeout(armed);armed=setTimeout(()=>{b.classList.remove('warn');b.textContent='Clear deck';},3000);return;}
  clearTimeout(armed);b.classList.remove('warn');b.textContent='Clear deck';
  DECK={};saveDeck();badge();renderDeck();
});
badge();
render();
let m0='search';try{m0=localStorage.getItem('sw-mode')||'search';}catch(e){}
setMode(m0==='deck'?'deck':'search');
})();
