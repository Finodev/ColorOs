// ── MSK Clock ──
const DAYS=['вс','пн','вт','ср','чт','пт','сб'];
const MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function getMSK(){const n=new Date();return new Date(n.getTime()+(n.getTimezoneOffset()+180)*60000)}
function pad(n){return String(n).padStart(2,'0')}
function tick(){
  const t=getMSK(),h=pad(t.getHours()),m=pad(t.getMinutes());
  const ts=h+':'+m,ds=DAYS[t.getDay()]+', '+t.getDate()+' '+MONTHS[t.getMonth()];
  ['lock-time','sb-time','home-time'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=ts});
  ['lock-date','home-date'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=ds});
}
setInterval(tick,1000);tick();

// ── Lock / Unlock ──
let locked=true,currentApp=null,qsOpen=false;
const phone=document.getElementById('phone');
const lock=document.getElementById('lockscreen');
const home=document.getElementById('homescreen');

document.getElementById('fp-btn').onclick=unlock;
document.getElementById('fp-btn').ontouchend=e=>{e.preventDefault();unlock()};
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&locked)unlock();
  if(e.key==='Escape')closeApp();
});

function unlock(){
  if(!locked)return;
  const fp=document.getElementById('fp-btn');
  const rp=document.getElementById('fp-ripple');
  fp.classList.add('scanning');
  rp.classList.remove('go');void rp.offsetWidth;rp.classList.add('go');
  setTimeout(()=>{
    fp.classList.remove('scanning');
    locked=false;
    lock.style.cssText='transition:transform 0.5s ease,opacity 0.4s ease;transform:scale(0.88);opacity:0';
    home.style.cssText='opacity:0;transform:scale(1.06);transition:transform 0.5s var(--bounce),opacity 0.35s ease';
    home.classList.add('active');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{home.style.transform='scale(1)';home.style.opacity='1'}));
    setTimeout(()=>{
      lock.classList.remove('active');lock.style.cssText='';home.style.cssText='';
      document.querySelectorAll('.app-icon').forEach(ic=>{ic.style.animation='none';void ic.offsetWidth;ic.style.animation=''});
      showNotif('🔥','OnePlus','Never Settle — ColorOS 15');
    },520);
  },550);
}

// ── Apps ──
function openApp(id){
  if(qsOpen)closeQS();
  const el=document.getElementById('app-'+id);if(!el)return;
  if(currentApp&&currentApp!==el){currentApp.classList.remove('open');currentApp.classList.add('closing');const c=currentApp;setTimeout(()=>c.classList.remove('closing'),380)}
  currentApp=el;el.classList.remove('closing');el.classList.add('open');
  try{const f=el.querySelector('iframe');if(f&&f.contentWindow)f.contentWindow.postMessage({type:'app-open'},'*')}catch(e){}
}
function closeApp(){
  if(!currentApp)return;
  currentApp.classList.add('closing');const c=currentApp;currentApp=null;
  setTimeout(()=>c.classList.remove('open','closing'),360);
}

// Listen iframe messages
window.addEventListener('message',e=>{
  if(!e.data)return;
  if(e.data.type==='close-app')closeApp();
  if(e.data.type==='show-notif')showNotif(e.data.icon,e.data.app,e.data.body);
  if(e.data.type==='apply-theme')applyTheme(e.data.theme);
  if(e.data.type==='set-anim-speed')setSpeed(e.data.speed);
});

// ── Quick Settings ──
const qsPanel=document.getElementById('qs-panel');
const sb=document.getElementById('statusbar');
let swipeY=0;
sb.addEventListener('mousedown',e=>{swipeY=e.clientY});
sb.addEventListener('touchstart',e=>{swipeY=e.touches[0].clientY},{passive:true});
window.addEventListener('mousemove',e=>{if(swipeY&&e.clientY-swipeY>44&&!qsOpen){openQS();swipeY=0}});
window.addEventListener('touchmove',e=>{if(swipeY&&e.touches[0].clientY-swipeY>44&&!qsOpen){openQS();swipeY=0}},{passive:true});
window.addEventListener('mouseup',()=>{swipeY=0});
window.addEventListener('touchend',()=>{swipeY=0});
document.addEventListener('click',e=>{if(qsOpen&&!qsPanel.contains(e.target)&&e.target!==sb)closeQS()});
function openQS(){qsOpen=true;qsPanel.classList.add('open')}
function closeQS(){qsOpen=false;qsPanel.classList.remove('open')}

// ── Notification ──
let notifT=null;
function showNotif(icon,app,body){
  const el=document.getElementById('notif');
  document.getElementById('notif-icon').textContent=icon;
  document.getElementById('notif-app').textContent=app;
  document.getElementById('notif-text').textContent=body;
  const t=getMSK();document.getElementById('notif-time').textContent=pad(t.getHours())+':'+pad(t.getMinutes());
  el.classList.add('show');if(notifT)clearTimeout(notifT);
  notifT=setTimeout(()=>el.classList.remove('show'),3400);
  el.onclick=()=>el.classList.remove('show');
}

// ── Recording ──
let recOn=false,recSec=0,recInt=null;
function startRec(){if(recOn){stopRec();return}
  recOn=true;recSec=0;
  document.getElementById('rec-bar').style.display='flex';
  document.getElementById('rec-qs-label').textContent='● Стоп';
  closeQS();
  recInt=setInterval(()=>{recSec++;const m=pad(Math.floor(recSec/60)),s=pad(recSec%60);document.getElementById('rec-time').textContent=m+':'+s},1000);
  showNotif('🔴','Система','Запись экрана началась');
}
function stopRec(){recOn=false;clearInterval(recInt);document.getElementById('rec-bar').style.display='none';document.getElementById('rec-qs-label').textContent='Запись';showNotif('✅','Система','Запись сохранена!')}

// ── Themes ──
const THEMES={
  cosmic:'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',
  aurora:'linear-gradient(160deg,#004d40,#1a237e,#006064)',
  sunset:'linear-gradient(160deg,#b71c1c,#e64a19,#f57f17)',
  ocean:'linear-gradient(160deg,#0d47a1,#01579b,#006064)',
  rose:'linear-gradient(160deg,#880e4f,#4a148c,#1a237e)',
  forest:'linear-gradient(160deg,#1b5e20,#2e7d32,#33691e)',
  oneplue:'linear-gradient(160deg,#1a0000,#3d0a00,#1a0000)',
  galaxy:'linear-gradient(160deg,#0d0221,#190940,#0d0221)'
};
function applyTheme(name){
  const bg=THEMES[name];if(!bg)return;
  document.documentElement.style.setProperty('--wp',bg);
  document.querySelectorAll('.lock-wallpaper,.home-wallpaper').forEach(e=>e.style.background=bg);
  localStorage.setItem('theme',name);
  showNotif('🎨','Темы','Тема применена!');
}
(function(){applyTheme(localStorage.getItem('theme')||'cosmic')})();

// ── Anim speed ──
function setSpeed(mode){
  phone.classList.remove('anim-fast','anim-slow','anim-none');
  if(mode==='fast')phone.classList.add('anim-fast');
  else if(mode==='slow')phone.classList.add('anim-slow');
  else if(mode==='none')phone.classList.add('anim-none');
  localStorage.setItem('animSpeed',mode);
}
(function(){setSpeed(localStorage.getItem('animSpeed')||'normal')})();

// ── Stub helpers ──
function dialAdd(c){const e=document.getElementById('dial-num');if(e)e.textContent+=c}
function onSearch(v){
  const apps=['Калькулятор','Настройки','Галерея','Часы','Музыка','Заметки','Погода','Браузер','Файлы','Карты'];
  const res=document.getElementById('search-res');const go=document.getElementById('search-go');
  if(!res)return;
  if(!v){res.innerHTML='';if(go)go.style.display='none';return}
  const m=apps.filter(a=>a.toLowerCase().includes(v.toLowerCase()));
  res.innerHTML=m.map(a=>`<div class="search-res-row" onclick="openApp('${a.toLowerCase()}')">📱 ${a}</div>`).join('');
  if(go){go.style.display='block';go.textContent='Поиск в Google: "'+v+'"';go.onclick=()=>window.open('https://google.com/search?q='+encodeURIComponent(v),'_blank')}
}
function doSearch(){const v=document.getElementById('search-inp')?.value;if(v)window.open('https://google.com/search?q='+encodeURIComponent(v),'_blank')}
