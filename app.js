(async()=>{
const D=await fetch('data/cards.json?v=202611121049').then(r=>r.json());

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
function render(reset=true){
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
  const num=['cost','str','hp'].includes(key);
  r.sort((a,b)=>{if(num){const x=a[key]??-1,y=b[key]??-1;if(x!==y)return y-x;}else if(key==='f'&&a.f!==b.f)return a.f.localeCompare(b.f);return a.n.localeCompare(b.n);});
  const tot=D.cards.filter(c=>c.t===st.kind).length, word=st.kind==='Unit'?'units':'events';
  const txt=`${r.length} of ${tot} ${word}`;$('count').textContent=txt;$('count2').textContent=txt;
  const shown=r.slice(0,limit);
  $('list').innerHTML=shown.length?(view==='table'?table(shown):shown.map(card).join(''))+(r.length>limit?`<button class="more" type="button" id="more">Show ${r.length-limit} more</button>`:''):`<div class="empty">No card matches these filters. Loosen a filter or reset them.</div>`;
  const m=$('more');if(m)m.onclick=()=>{limit+=100;render(false);};
}
function fmt(c){return esc(c.tx).split(' // ').map(p=>{const m=p.match(/^([^.]{2,32})\. (.*)$/);return c.t==='Unit'&&m?`<span class="ab">${m[1]}.</span> ${m[2]}`:p;}).join('<br>');}
function abNames(c){return c.tx.split(' // ').map(p=>{const i=p.indexOf('. ');const nm=i>0&&i<34?p.slice(0,i):p;return `<span title="${esc(p)}">${esc(nm)}</span>`;}).join(', ');}
function table(rows){
  const U=st.kind==='Unit', key=$('sort').value;
  const cols=U?[['Name','n'],['Faction','f'],['Class'],['Struct.'],['Cost','cost'],['Life','hp'],['Str.','str'],['Attack'],['Symbols'],['Abilities']]
              :[['Name','n'],['Faction','f'],['Class'],['Struct.'],['Cost','cost'],['Life','hp'],['Phase'],['Symbols'],['Effect']];
  const head=cols.map(([l,k])=>k?`<th class="s${k===key?' on':''}" data-k="${k}" scope="col">${l}</th>`:`<th scope="col">${l}</th>`).join('');
  const v=x=>x===null||x===undefined?'':x;
  const body=rows.map(c=>{
    const sy=c.sy.map(s=>`<img src="img/symbols/${s}.png" alt="${s}" title="${s}">`).join('');
    const common=`<td class="nm">${esc(c.n)}</td><td class="fa">${esc(c.f)}</td><td class="cl">${c.c}</td><td class="ctr">${c.st?'<span class="yes">✓</span>':''}</td><td class="num">${v(c.cost)}</td><td class="num">${v(c.hp)}</td>`;
    return '<tr>'+common+(U?`<td class="num">${v(c.str)}</td><td>${c.mr}</td>`:`<td class="cl">${esc((c.ph||'').replace(' Phase',''))}</td>`)+`<td class="sy">${sy}</td>`+`<td class="tx">${fmt(c)}</td></tr>`;}).join('');
  return `<div class="tbl"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function card(c){
  const syms=c.sy.map(s=>`<img src="img/symbols/${s}.png" alt="${s}" title="${s}">`).join('');
  const stats=[];
  if(c.cost!==null)stats.push(`<span class="stat"><i>Cost</i>${c.cost}</span>`);
  if(c.hp!==null)stats.push(`<span class="stat"><i>Life</i>${c.hp}</span>`);
  if(c.str!==null)stats.push(`<span class="stat"><i>${c.mr==='Ranged'?'Ranged':'Melee'}</i>${c.str}</span>`);
  const tags=[];if(c.st)tags.push('Structure');if(c.lim)tags.push('Limited');if(c.ph)tags.push(c.ph);
  const tx=esc(c.tx).split(' // ').map(p=>{const m=p.match(/^([^.]{2,32})\. (.*)$/);return c.t==='Unit'&&m?`<span class="ab">${m[1]}.</span> ${m[2]}`:p;}).join('<br>');
  return `<article class="card"><div class="top"><div class="nm"><b>${esc(c.n)}</b><small>${esc(c.f)} · ${c.cls}</small></div><div class="syms">${syms}</div></div>
  <div class="stats">${stats.join('')}${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p class="tx">${tx}</p></article>`;
}
render();
})();
