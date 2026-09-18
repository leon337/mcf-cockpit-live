(()=>{
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=(v,n=62)=>{const s=String(v||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s};
const ago=v=>{if(!v)return '—';const ms=Date.now()-new Date(v).getTime();if(!Number.isFinite(ms))return '—';const m=Math.max(0,Math.round(ms/60000));if(m<1)return 'agora';if(m<60)return 'há '+m+' min';const h=Math.round(m/60);if(h<24)return 'há '+h+' h';return 'há '+Math.round(h/24)+' d'};
const concept=Number(document.body.dataset.liveConcept||0);
const stage=document.getElementById('stage');
if(!stage||!concept)return;
const layer=document.createElement('div');layer.className='live-layer';stage.appendChild(layer);
const source=document.createElement('div');source.className='live-source'+(concept===3?' lightish':'');source.textContent='MCF LIVE · carregando dados reais…';stage.appendChild(source);
let DATA=null;
const drawer=document.getElementById('drawer'),drawerTitle=document.getElementById('drawerTitle'),drawerText=document.getElementById('drawerText');
function openDrawer(title,html){if(!drawer)return;drawerTitle.textContent=title;drawerText.innerHTML=html;drawer.classList.add('open')}
function zone(name,left,top,width,height,cls='',html=''){
 const el=document.createElement('section');el.className='live-zone '+cls;el.dataset.live=name;
 Object.assign(el.style,{left:left+'%',top:top+'%',width:width+'%',height:height+'%'});
 el.innerHTML=html;layer.appendChild(el);return el;
}
function badge(t,kind=''){return '<span class="live-badge '+kind+'">'+esc(t)+'</span>'}
function repoItem(r){return '<div class="live-item"><span class="live-dot"></span><strong>'+esc(r.name)+'</strong><small>'+ago(r.updatedAt)+'</small></div>'}
function issueItem(i){return '<div class="live-item"><span class="live-pill">#'+i.number+'</span><strong>'+esc(short(i.title,42))+'</strong><small>'+ago(i.updatedAt)+'</small></div>'}
function prItem(p){return '<div class="live-item"><span class="live-pill">#'+p.number+'</span><strong>'+esc(short(p.title,42))+'</strong><small>'+(p.draft?'draft':'open')+'</small></div>'}
function eventText(e){const p=e.payload||{};if(e.type==='IssuesEvent')return '#'+(p.issueNumber||'?')+' '+(p.issueTitle||'issue');if(e.type==='PullRequestEvent')return '#'+(p.pullNumber||'?')+' '+(p.pullTitle||'PR');if(e.type==='PushEvent')return 'push em '+String(p.ref||'branch').replace('refs/heads/','');if(e.type==='CreateEvent')return 'criou '+(p.ref||p.refType||'ref');return String(e.type||'evento').replace(/Event$/,'')}
function eventItem(e){return '<div class="live-item"><span class="live-dot"></span><strong>'+esc(short(eventText(e),46))+'</strong><small>'+ago(e.createdAt)+'</small></div>'}
function missionHTML(light=false){
 const m=DATA.mission;if(!m)return '<div class="live-empty">Nenhuma missão pública aberta.</div>';
 const progress=m.progress==null?0:m.progress;
 return '<div class="live-mission '+(light?'light':'')+'"><div class="live-row"><div class="live-title">Missão ativa</div>'+badge(m.state==='open'?'ATIVA':m.state,'')+'</div><h2>'+esc(m.title)+'</h2><p>'+esc(short(m.body,150)||'Issue MCF aberta no repositório canônico.')+'</p><div class="live-progress"><i style="width:'+progress+'%"></i></div><div class="live-mission-meta"><span>#'+m.number+'</span><span>'+progress+'% checklist</span><span>'+ago(m.updatedAt)+'</span></div></div>'
}
function localHTML(kind,light=false){
 const x=(DATA.localIntegrations||{})[kind]||{};
 return '<div class="live-local-card '+(light?'light':'')+'"><div class="live-row"><div class="live-title">'+esc(kind==='voiceHub'?'VoiceHub':kind==='augusto'?'AUGUSTO Reporter':'Ambiente Linux')+'</div>'+badge('LOCAL-ONLY','local')+'</div><p>'+esc(x.status||'Estado local não observável pela Vercel sem bridge autenticado.')+'</p><div class="live-sub">Cloud conectado: '+(x.cloudConnected?'sim':'não')+'</div></div>'
}
function details(label){
 const l=label.toLowerCase();
 if(l.includes('reposit'))return '<b>Repositórios públicos MCF</b><br><br>'+DATA.repos.map(r=>'• '+esc(r.name)+' — '+ago(r.updatedAt)).join('<br>');
 if(l.includes('pull')||l.includes('prs'))return '<b>Pull Requests abertos</b><br><br>'+(DATA.pulls.length?DATA.pulls.map(p=>'• #'+p.number+' '+esc(p.title)).join('<br>'):'Nenhum PR aberto.');
 if(l.includes('issue'))return '<b>Issues abertas</b><br><br>'+(DATA.issues.length?DATA.issues.map(i=>'• #'+i.number+' '+esc(i.title)).join('<br>'):'Nenhuma issue aberta.');
 if(l.includes('miss'))return DATA.mission?'<b>#'+DATA.mission.number+' '+esc(DATA.mission.title)+'</b><br><br>'+esc(short(DATA.mission.body,500)):'Sem missão pública.';
 if(l.includes('github')||l.includes('atividade')||l.includes('feed'))return '<b>Eventos GitHub públicos</b><br><br>'+DATA.events.slice(0,10).map(e=>'• '+esc(eventText(e))+' — '+ago(e.createdAt)).join('<br>');
 if(l.includes('agent'))return '<b>Agentes canônicos</b><br><br>'+DATA.agents.slice(0,20).map(a=>'• '+esc(a.name)+' — '+esc(a.role)).join('<br>');
 if(l.includes('voicehub'))return localHTML('voiceHub');
 if(l.includes('augusto'))return localHTML('augusto');
 if(l.includes('linux'))return localHTML('linux');
 return '<b>Dados LIVE</b><br><br>Fonte: '+esc(DATA.source)+'<br>Gerado: '+esc(DATA.generatedAt);
}
function wire(el,label){el.addEventListener('click',()=>openDrawer(label,details(label)))}
function render1(){
 zone('kpis',16.1,16.25,61.9,8.7,'live-tight','<div class="live-grid4">'+
  '<div class="live-kpi"><b>'+DATA.repos.length+'</b><span>Repositórios MCF</span></div>'+
  '<div class="live-kpi"><b>'+DATA.pulls.length+'</b><span>Pull Requests abertos</span></div>'+
  '<div class="live-kpi"><b>'+DATA.commits.length+'</b><span>Commits carregados</span></div>'+
  '<div class="live-kpi"><b>'+DATA.issues.length+'</b><span>Issues abertas</span></div></div>');
 let r=zone('repos',16.1,26.35,58.6,25.7,'live-pad','<div class="live-row"><div class="live-title">Repositórios MCF</div><span class="live-sub">GitHub público</span></div><div class="live-repo-grid">'+DATA.repos.slice(0,5).map(x=>'<div class="live-repo"><b>'+esc(x.name)+'</b><span>'+esc(x.defaultBranch||'main')+' · '+ago(x.updatedAt)+'</span><span>'+esc(short(x.description,42)||'Sem descrição')+'</span></div>').join('')+'</div>');wire(r,'Repositórios MCF');
 let m=zone('mission',16.1,54.5,38.45,33.0,'live-pad',missionHTML());wire(m,'Missão ativa');
 let a=zone('augusto',55.35,54.5,19.35,33.0,'live-pad',localHTML('augusto')+'<div style="margin-top:9px">'+badge('mission-aware')+' '+badge('fila anti-overlap')+'</div>');wire(a,'AUGUSTO');
 let e=zone('events',75.7,26.35,23.1,61.0,'live-pad','<div class="live-row"><div class="live-title">Atividade recente no GitHub</div><span class="live-sub">LIVE</span></div><div class="live-list">'+DATA.events.slice(0,7).map(eventItem).join('')+'</div>');wire(e,'Atividade GitHub');
 zone('linux',67.1,6.4,12.7,7.8,'live-tight',localHTML('linux'));
 zone('startup',81.4,6.4,16.8,7.8,'live-tight','<div class="live-title">Abrir ao iniciar</div><div class="live-sub" style="margin-top:6px">Preferência local do cockpit · não inferida pela nuvem.</div>');
}
function render2(){
 zone('status',35.0,9.35,63.1,7.4,'live-tight','<div class="live-grid4">'+
  '<div class="live-kpi"><b>Linux</b><span>LOCAL-ONLY</span></div><div class="live-kpi"><b>GitHub</b><span>conectado · público</span></div><div class="live-kpi"><b>VoiceHub</b><span>LOCAL-ONLY</span></div><div class="live-kpi"><b>Autoabrir</b><span>preferência local</span></div></div>');
 let r=zone('repos',.75,18.25,21.45,68.4,'live-pad','<div class="live-row"><div class="live-title">Repositórios MCF</div><span class="live-sub">'+DATA.repos.length+' públicos</span></div><div class="live-list">'+DATA.repos.slice(0,8).map(repoItem).join('')+'</div>');wire(r,'Repositórios MCF');
 let center=zone('mission',23.05,18.25,53.55,68.4,'live-pad',missionHTML()+
  '<div class="live-grid4" style="margin-top:3%"><div class="live-kpi"><b>'+DATA.issues.length+'</b><span>Issues</span></div><div class="live-kpi"><b>'+DATA.pulls.length+'</b><span>PRs</span></div><div class="live-kpi"><b>'+DATA.releases.length+'</b><span>Releases</span></div><div class="live-kpi"><b>'+DATA.events.length+'</b><span>Eventos</span></div></div>'+
  '<div class="live-grid2" style="margin-top:2%"><div><div class="live-title">PRs recentes</div><div class="live-list">'+DATA.pulls.slice(0,4).map(prItem).join('')+'</div></div><div><div class="live-title">Issues recentes</div><div class="live-list">'+DATA.issues.slice(0,4).map(issueItem).join('')+'</div></div></div>');wire(center,'Missão ativa');
 let e=zone('feed',77.9,18.25,21.3,68.4,'live-pad','<div class="live-row"><div class="live-title">Feed de eventos GitHub</div><span class="live-sub">REAL</span></div><div class="live-list">'+DATA.events.slice(0,9).map(eventItem).join('')+'</div>');wire(e,'Feed GitHub');
 let bottom=zone('augusto',.8,88.0,98.1,10.5,'live-tight','<div class="live-row"><div><div class="live-title">AUGUSTO · Mission-aware Voice Reporter</div><div class="live-sub">Fila central anti-overlap · status local não é inferido pela Vercel.</div></div><div>'+badge('LOCAL-ONLY','local')+' '+badge('queue-aware')+'</div></div>');wire(bottom,'AUGUSTO');
}
function render3(){
 let r=zone('repos',9.05,12.2,19.55,85.0,'light live-pad','<div class="live-row"><div class="live-title">Repositórios</div><span class="live-sub">'+DATA.repos.length+'</span></div><div class="live-list">'+DATA.repos.slice(0,9).map(repoItem).join('')+'</div>');wire(r,'Repositórios');
 let m=zone('mission',29.5,24.35,46.85,22.5,'light live-pad',missionHTML(true));wire(m,'Missão atual');
 let ck=zone('check',29.5,48.0,23.55,34.2,'light live-pad','<div class="live-title">Checklist da missão</div><div class="live-list">'+((DATA.mission&&DATA.mission.checklist&&DATA.mission.checklist.length)?DATA.mission.checklist.slice(0,8).map(x=>'<div class="live-item"><span>'+ (x.done?'☑':'☐') +'</span><strong>'+esc(short(x.text,46))+'</strong><small></small></div>').join(''):'<div class="live-empty">Sem checklist estruturado.</div>')+'</div>');wire(ck,'Checklist');
 let tl=zone('timeline',53.55,48.0,22.8,34.2,'light live-pad','<div class="live-title">Timeline</div><div class="live-list">'+DATA.events.slice(0,7).map(eventItem).join('')+'</div>');wire(tl,'Timeline');
 let n=zone('notifs',77.25,12.2,21.95,33.6,'light live-pad','<div class="live-title">Notificações GitHub</div><div class="live-list">'+DATA.issues.slice(0,5).map(issueItem).join('')+'</div>');wire(n,'Notificações GitHub');
 let ag=zone('agents',77.25,47.1,21.95,27.5,'light live-pad','<div class="live-row"><div class="live-title">Atividade dos agentes</div><span class="live-sub">'+DATA.agents.length+' canônicos</span></div><div class="live-list">'+DATA.agents.slice(0,5).map(a=>'<div class="live-item"><span>⚙</span><strong>'+esc(a.name)+'</strong><small>'+esc(short(a.role,22))+'</small></div>').join('')+'</div>');wire(ag,'Atividade agentes');
 let vh=zone('voicehub',77.25,75.6,21.95,21.8,'light live-pad',localHTML('voiceHub',true)+'<div style="margin-top:8px">'+badge('fila compartilhada','local')+'</div>');wire(vh,'VoiceHub');
 zone('controls',29.5,83.35,46.85,14.0,'light live-tight','<div class="live-row"><div><div class="live-title">Controles da missão</div><div class="live-sub">AUGUSTO só reporta com missão ACTIVE e status novo.</div></div><div>'+badge('mission-aware')+' '+badge('anti-overlap')+'</div></div>');
}
function render4(){
 let m=zone('mission',14.3,28.45,21.7,22.25,'green live-pad',missionHTML());wire(m,'Missão em andamento');
 let r=zone('repos',36.65,28.45,20.1,22.25,'blue live-pad','<div class="live-title">Repositórios críticos</div><div class="live-card-number">'+DATA.repos.length+'</div><div class="live-list">'+DATA.repos.slice(0,4).map(repoItem).join('')+'</div>');wire(r,'Repositórios críticos');
 let p=zone('prs',57.55,28.45,20.0,22.25,'purple live-pad','<div class="live-title">PRs aguardando gate</div><div class="live-card-number">'+DATA.pulls.length+'</div><div class="live-list">'+DATA.pulls.slice(0,3).map(prItem).join('')+'</div>');wire(p,'PRs aguardando gate');
 let i=zone('issues',78.35,28.45,20.45,22.25,'orange live-pad','<div class="live-title">Issues prioritárias</div><div class="live-card-number">'+DATA.issues.length+'</div><div class="live-list">'+DATA.issues.slice(0,3).map(issueItem).join('')+'</div>');wire(i,'Issues prioritárias');
 let vh=zone('voicehub',14.3,52.35,19.45,23.6,'magenta live-pad',localHTML('voiceHub'));wire(vh,'VoiceHub');
 let au=zone('augusto',34.45,52.35,20.4,23.6,'blue live-pad',localHTML('augusto')+'<div style="margin-top:8px">'+badge('queue-aware')+'</div>');wire(au,'AUGUSTO Reporter');
 let li=zone('linux',55.65,52.35,20.75,23.6,'green live-pad',localHTML('linux'));wire(li,'Ambiente Linux');
 let su=zone('summary',77.2,52.35,21.6,23.6,'gold live-pad','<div class="live-title">Resumo do dia</div><div class="live-list"><div class="live-item"><span>↻</span><strong>Commits carregados</strong><small>'+DATA.commits.length+'</small></div><div class="live-item"><span>⑂</span><strong>PRs abertos</strong><small>'+DATA.pulls.length+'</small></div><div class="live-item"><span>!</span><strong>Issues abertas</strong><small>'+DATA.issues.length+'</small></div><div class="live-item"><span>◉</span><strong>Eventos</strong><small>'+DATA.events.length+'</small></div></div>');wire(su,'Resumo do dia');
 let map=zone('map',14.3,77.7,84.5,14.9,'live-tight','<div class="live-row"><div><div class="live-title">Mapa do Ecossistema MCF</div><div class="live-sub">Repositórios públicos observados agora</div></div><div>'+DATA.repos.slice(0,7).map(x=>'<span class="live-pill" style="margin-left:4px">'+esc(x.name.replace('multiagent-collaboration-framework','MCF core'))+'</span>').join('')+'</div></div>');wire(map,'Mapa ecossistema');
}
async function boot(){
 try{
   const r=await fetch('/api/mcf',{headers:{Accept:'application/json'}});
   if(!r.ok)throw new Error('API '+r.status);
   DATA=await r.json();
   source.textContent='MCF LIVE · '+DATA.source+' · '+ago(DATA.generatedAt);
   ({1:render1,2:render2,3:render3,4:render4}[concept]||(()=>{}))();
   document.querySelectorAll('.hotspot').forEach(h=>h.addEventListener('click',()=>setTimeout(()=>{if(DATA&&h.dataset.label){drawerText.innerHTML=details(h.dataset.label)}},0)));
 }catch(err){
   source.textContent='MCF LIVE · falha ao carregar API';
   source.style.color='#ff9c9c';
 }
}
boot();
})();
