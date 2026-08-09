const SAVE_KEY='slepicka_tamagotchi_02';
const LAT=50.7243, LON=15.1711;
const HATCH_TIME=8*60*60*1000;
const CHICK_TIME=3*24*60*60*1000;
const PULLET_TIME=7*24*60*60*1000;
const HEN_TIME=30*24*60*60*1000;
const MATRON_TIME=90*24*60*60*1000;
const colors=[
 {name:'ISA Brown',main:'#d98c3a',wing:'#b86c2b',tail:'#8b4f24',spot:'#fff1c7'},
 {name:'bílá',main:'#f6f0dc',wing:'#d8ccb1',tail:'#b9a888',spot:'#ffffff'},
 {name:'černá',main:'#34302d',wing:'#201d1b',tail:'#151312',spot:'#e6c16a'},
 {name:'Darkshell',main:'#8e5a35',wing:'#6f3f24',tail:'#442515',spot:'#e0b57b'},
 {name:'Dominant žíhaná',main:'#c08a50',wing:'#7b4b2c',tail:'#4e2b1b',spot:'#fff3d0'},
 {name:'Sussex',main:'#f1e6cc',wing:'#d9c6a0',tail:'#26231f',spot:'#ffffff'},
 {name:'modrá',main:'#8b9aa7',wing:'#647887',tail:'#485861',spot:'#dce7ed'},
 {name:'Trikolor',main:'#c8582a',wing:'#f1e6cc',tail:'#22201d',spot:'#ffe1ab'}
];
let preview=colors[Math.floor(Math.random()*colors.length)];
let state=null;
let miniGame=null;
const traits=[
 {id:'active',name:'aktivní',move:0.75,egg:1,desc:'více chodí po výběhu'},
 {id:'curious',name:'zvědavá',move:0.9,egg:1,desc:'častěji hrabe a zkoumá'},
 {id:'hungry',name:'žravá',move:1,egg:1,desc:'rychleji vyhládne, lépe hledá potravu'},
 {id:'calm',name:'klidná',move:1.35,egg:1,desc:'méně pobíhá a pomaleji ztrácí spokojenost'},
 {id:'motherly',name:'mateřská',move:1.15,egg:1.15,desc:'lepší snůška v dospělosti'}
];
const ACH=[
 ['hatched','První vylíhnutí','Kuřátko se poprvé vylíhne.'],
 ['firstWorm','První červík','Najdi prvního červíka v minihře.'],
 ['firstEgg','První vejce','Dospělá slepice snese první vejce.'],
 ['tenEggs','10 vajec','Nasbírej celkem 10 vajec.'],
 ['week','Týden života','Slepička se dožije 7 dní.'],
 ['goodCare','Dobrá péče','Udrž zdraví, hlad a žízeň nad 70 %.']
];
function now(){return Date.now()}
function clamp(v){return Math.max(0,Math.min(100,Math.round(v)))}
function fmtMs(ms){if(ms<=0)return 'hotovo';const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);if(h>24){const d=Math.floor(h/24);return d+' d '+(h%24)+' h'}return h+' h '+m+' min'}
function ageText(ms){const h=Math.floor(ms/3600000),d=Math.floor(h/24);if(d>0)return d+' d '+(h%24)+' h';return h+' h '+Math.floor(ms%3600000/60000)+' min'}
function phase(age){
 if(age<HATCH_TIME)return {id:'egg',name:'Vajíčko v hnízdě',next:HATCH_TIME,place:'hnízdo'};
 if(age<HATCH_TIME+CHICK_TIME)return {id:'chick',name:'Kuřátko pod lampou',next:HATCH_TIME+CHICK_TIME,place:'výhřevná lampa'};
 if(age<HATCH_TIME+CHICK_TIME+PULLET_TIME)return {id:'pullet',name:'Mladá slepička ve výběhu',next:HATCH_TIME+CHICK_TIME+PULLET_TIME,place:'výběh'};
 if(age<HATCH_TIME+CHICK_TIME+PULLET_TIME+HEN_TIME)return {id:'hen',name:'Dospělá slepice',next:HATCH_TIME+CHICK_TIME+PULLET_TIME+HEN_TIME,place:'bidlo'};
 return {id:'matron',name:'Matka hejna',next:null,place:'hlavní bidlo'};
}
function applyColor(c){document.documentElement.style.setProperty('--chicken-main',c.main);document.documentElement.style.setProperty('--chicken-wing',c.wing);document.documentElement.style.setProperty('--chicken-tail',c.tail);document.documentElement.style.setProperty('--chicken-spot',c.spot)}
function log(msg){state.log.unshift(new Date().toLocaleString('cs-CZ')+' — '+msg);state.log=state.log.slice(0,80);save();renderLog()}

function getTrait(){return traits.find(t=>t.id===(state&&state.trait))||traits[0]}
function migrateState(){if(!state)return;state.trait=state.trait||traits[Math.floor(Math.random()*traits.length)].id;state.eggs=state.eggs||0;state.eggHistory=state.eggHistory||[];state.ai=state.ai||{x:50,y:36,action:'odpočívá',nextMove:0};state.stats=Object.assign({worms:0,grain:0,slugs:0,berries:0,stones:0,scratches:0,miniGames:0,sleepHours:0,outsideHours:0},state.stats||{});state.achievements=state.achievements||{};state.milestones=state.milestones||{};if(state.nextEggAt===undefined)state.nextEggAt=null;}
function award(id){if(!state||state.achievements[id])return;state.achievements[id]=now();const a=ACH.find(x=>x[0]===id);if(a)log('🏆 Ocenění: '+a[1]);}
function addChronicleOnce(key,msg){if(!state.milestones[key]){state.milestones[key]=now();log(msg)}}
function isRainy(){return state&&state.weather&&['déšť','bouřka'].includes(state.weather.text)}
function isHot(){return state&&state.weather&&state.weather.temp!=null&&state.weather.temp>=27}
function isCold(){return state&&state.weather&&state.weather.temp!=null&&state.weather.temp<=3}
function processMilestones(ph,age){if(ph.id!=='egg') {award('hatched');addChronicleOnce('hatched','🐣 '+state.name+' se vylíhla.')}if(ph.id==='pullet')addChronicleOnce('pullet','🐥 '+state.name+' vyrostla na mladou slepičku.');if(ph.id==='hen')addChronicleOnce('hen','🐔 '+state.name+' je dospělá slepice.');if(age>=7*24*3600000)award('week');if(state.health>=70&&state.hunger>=70&&state.thirst>=70)award('goodCare');}
function processEggs(t,ph){if(!(ph.id==='hen'||ph.id==='matron'))return;if(!state.nextEggAt)state.nextEggAt=t+Math.floor((20+Math.random()*10)*3600000);if(t>=state.nextEggAt){const trait=getTrait();let count=Math.random()<0.12*trait.egg?2:1;state.eggs+=count;state.eggHistory.unshift({time:t,count});state.eggHistory=state.eggHistory.slice(0,100);state.nextEggAt=t+Math.floor((22+Math.random()*10)*3600000);log('🥚 '+state.name+' snesla '+count+' vejce.');award('firstEgg');if(state.eggs>=10)award('tenEggs');}}
function updateAi(ph,part){
  if(!state.ai)state.ai={x:50,y:10,action:'odpočívá',nextMove:0,prevX:50};
  const t=now();const night=part==='night';
  if(ph.id==='egg'){
    state.ai={x:50,y:36,action:'vajíčko odpočívá v hnízdě',nextMove:t+60000,prevX:50};
    return;
  }
  if(night){
    state.ai.prevX=state.ai.x;
    state.ai.x=50;
    state.ai.y=(ph.id==='chick'?33:42);
    state.ai.action=(ph.id==='chick'?'spí pod lampou':'spí na bidle');
    state.ai.nextMove=t+60000;
    return;
  }
  if(t<state.ai.nextMove)return;
  const trait=getTrait();let choices=[];

  // Kuřátko zůstává uvnitř kurníku pod lampou. Nepohybuje se skrz střechu ani ven.
  if(ph.id==='chick'){
    choices=[
      ['zobe z malé misky',46,30],
      ['pije z malé napáječky',55,30],
      ['hřeje se pod lampou',50,34],
      ['poskakuje po podestýlce',52,28],
      ['odpočívá pod lampou',48,31]
    ];
  }else{
    // Dospělá slepice chodí pouze v předním výběhu. Souřadnice jsou nízko před kurníkem.
    choices=[
      ['hrabe v levé části výběhu',30,9],
      ['hrabe uprostřed výběhu',50,8],
      ['zobe trávu',61,9],
      ['jde ke krmítku',76,10],
      ['pije vodu',88,10],
      ['odpočívá před kurníkem',42,12],
      ['prochází se po výběhu',38+Math.random()*34,8+Math.random()*5]
    ];
  }
  if(isRainy() && ph.id!=='chick') choices=[
    ['schovává se pod přístřeškem',72,13],
    ['čeká u kurníku před deštěm',46,13],
    ['jde ke krmítku',76,10]
  ];
  if(isHot() && ph.id!=='egg') choices.push(['pije vodu',88,10]);
  if(isCold() && ph.id!=='chick') choices.push(['odpočívá před kurníkem',42,12]);
  if(trait.id==='curious' && ph.id!=='chick') choices.push(['zvědavě zkoumá plot',25+Math.random()*55,9+Math.random()*5]);
  if(trait.id==='hungry' && ph.id!=='chick') choices.push(['hledá něco k snědku',38+Math.random()*38,8+Math.random()*5]);
  if(trait.id==='calm' && ph.id!=='chick') choices.push(['klidně odpočívá ve výběhu',43,12]);

  const c=choices[Math.floor(Math.random()*choices.length)];
  state.ai.prevX=state.ai.x;
  state.ai.x=Math.max(22,Math.min(90,c[1]));
  state.ai.y=c[2];
  state.ai.action=c[0];
  state.ai.nextMove=t+(7000+Math.random()*11000)*trait.move;
}function actionClass(action){if(!action)return 'resting';if(action.includes('hrabe'))return 'scratching';if(action.includes('zobe')||action.includes('snědku'))return 'pecking';if(action.includes('pije'))return 'drinking';if(action.includes('spí')||action.includes('odpoč'))return 'resting';return 'walking';}
function actionFxHtml(action){
  if(!action)return '<div class="sleepNest">…</div>';
  if(action.includes('hrabe'))return '<div class="dirt"></div>';
  if(action.includes('zobe')||action.includes('snědku')||action.includes('krmítku')||action.includes('misce'))return '<div class="feedBits"></div>';
  if(action.includes('pije')||action.includes('vodě'))return '<div class="waterDrop">💧</div>';
  if(action.includes('spí')||action.includes('odpoč')||action.includes('hřeje'))return '<div class="sleepNest">💤</div>';
  return '<div class="footprints"></div>';
}
function facingClass(){
  if(!state || !state.ai)return '';
  const prev=state.ai.prevX===undefined?state.ai.x:state.ai.prevX;
  return state.ai.x < prev ? ' facingLeft' : '';
}


function defaultState(name='Kokoška', color=preview){const tr=traits[Math.floor(Math.random()*traits.length)];return {name,created:now(),last:now(),hunger:88,thirst:88,health:100,happy:90,warmth:92,color,trait:tr.id,eggs:0,eggHistory:[],nextEggAt:null,weather:null,weatherAt:0,ai:{x:50,y:36,action:'odpočívá',nextMove:0},stats:{worms:0,grain:0,slugs:0,berries:0,stones:0,scratches:0,miniGames:0,sleepHours:0,outsideHours:0},achievements:{},milestones:{},log:['Začíná nový život. Vajíčko leží v měkkém hnízdě.']}}
function save(touch=true){if(state){if(touch)state.last=now();localStorage.setItem(SAVE_KEY,JSON.stringify(state))}}
function load(){try{state=JSON.parse(localStorage.getItem(SAVE_KEY));migrateState()}catch(e){state=null}if(!state){document.getElementById('newGame').style.display='block';document.getElementById('game').style.display='none';previewRandomColor()}else{document.getElementById('newGame').style.display='none';document.getElementById('game').style.display='grid';applyColor(state.color);tick(false);fetchWeather();}}
function startGame(){const name=document.getElementById('chickenName').value.trim()||'Kokoška';state=defaultState(name,preview);save();load()}
function resetGame(){if(confirm('Smazat uloženou hru a začít znovu?')){localStorage.removeItem(SAVE_KEY);state=null;load()}}
function previewRandomColor(){preview=colors[Math.floor(Math.random()*colors.length)];document.getElementById('previewColor').style.background=preview.main;document.getElementById('previewColor').title=preview.name}
function tick(first=false){
  if(!state)return;
  const t=now();
  const age=t-state.created;
  const ph=phase(age);
  const previousLast=state.last||t;
  const elapsed=Math.max(0,t-previousLast);
  if(elapsed>0){
    const hours=elapsed/3600000;
    const trait=getTrait();
    const hungerRate=trait.id==='hungry'?2.7:2.2;
    const happyRate=trait.id==='calm'?0.75:1.1;
    state.hunger=clamp(state.hunger-hours*hungerRate);
    state.thirst=clamp(state.thirst-hours*2.6);
    state.happy=clamp(state.happy-hours*happyRate);
    if(state.hunger<20||state.thirst<20)state.health=clamp(state.health-hours*4);
    else state.health=clamp(state.health+hours*.8);
    const part=dayPart();
    if(part==='night')state.stats.sleepHours+=(hours||0);
    else if(ph.id!=='egg')state.stats.outsideHours+=(hours||0);
  }
  processEggs(t,ph);
  processMilestones(ph,age);
  state.last=t;
  render();
  save(false);
}
function getSunTimes(){const d=new Date();const dayStart=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();const n=Math.floor((dayStart-Date.UTC(2000,0,1))/86400000)+2451545.0008;const Jstar=n-LON/360;const M=(357.5291+0.98560028*(Jstar-2451545))%360;const C=1.9148*Math.sin(M*Math.PI/180)+0.0200*Math.sin(2*M*Math.PI/180)+0.0003*Math.sin(3*M*Math.PI/180);const lambda=(M+C+180+102.9372)%360;const Jtransit=Jstar+0.0053*Math.sin(M*Math.PI/180)-0.0069*Math.sin(2*lambda*Math.PI/180);const delta=Math.asin(Math.sin(lambda*Math.PI/180)*Math.sin(23.44*Math.PI/180));const phi=LAT*Math.PI/180;const cosw=(Math.sin(-0.833*Math.PI/180)-Math.sin(phi)*Math.sin(delta))/(Math.cos(phi)*Math.cos(delta));const w=Math.acos(Math.max(-1,Math.min(1,cosw)))*180/Math.PI;const Jrise=Jtransit-w/360;const Jset=Jtransit+w/360;function jdToDate(J){return new Date((J-2440587.5)*86400000)}return {rise:jdToDate(Jrise),set:jdToDate(Jset)}}
function dayPart(){const {rise,set}=getSunTimes();const t=new Date();const mins=x=>x.getHours()*60+x.getMinutes();const m=mins(t),r=mins(rise),s=mins(set);if(m<r-35||m>s+40)return 'night';if(m<r+45)return 'dawn';if(m>s-55)return 'evening';return 'day'}
function weatherCode(c){if(c===0)return 'jasno';if([1,2].includes(c))return 'polojasno';if(c===3)return 'zataženo';if([45,48].includes(c))return 'mlha';if([51,53,55,61,63,65,80,81,82].includes(c))return 'déšť';if([71,73,75,77,85,86].includes(c))return 'sníh';if([95,96,99].includes(c))return 'bouřka';return 'počasí'}
function weatherClass(){if(!state||!state.weather)return 'weather-offline';const w=state.weather.text;if(w==='jasno')return 'weather-clear';if(w==='polojasno')return 'weather-partly';if(w==='zataženo')return 'weather-overcast';if(w==='mlha')return 'weather-fog';if(w==='déšť')return 'weather-rain';if(w==='sníh')return 'weather-snow';if(w==='bouřka')return 'weather-storm';return 'weather-offline'}
async function fetchWeather(){try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Europe%2FPrague`;const r=await fetch(url);const data=await r.json();state.weather={temp:data.current.temperature_2m,code:data.current.weather_code,text:weatherCode(data.current.weather_code)};state.weatherAt=now();save();render();}catch(e){state.weather=state.weather||{temp:null,code:null,text:'offline'}}}
function render(){const age=now()-state.created;const ph=phase(age);const part=dayPart();updateAi(ph,part);document.body.className=((part==='night'?'sky-night':part==='dawn'?'sky-dawn':part==='evening'?'sky-evening':'')+' '+weatherClass()+(isRainy()?' rainy':'')).trim();document.getElementById('clock').textContent=new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});document.getElementById('petName').textContent=state.name+' ('+state.color.name+')';document.getElementById('phaseName').textContent=ph.name;document.getElementById('ageText').textContent=ageText(age);const sun=getSunTimes();document.getElementById('sunText').textContent=sun.rise.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'})+' / '+sun.set.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});document.getElementById('weatherText').textContent=state.weather?(state.weather.text+(state.weather.temp!=null?' '+Math.round(state.weather.temp)+' °C':'')):'offline';document.getElementById('traitText').textContent=getTrait().name;document.getElementById('activityText').innerHTML='<span class="activityTextStrong">'+state.ai.action+'</span>';document.getElementById('eggsText').textContent=state.eggs+' ks';document.getElementById('eggCounter').textContent='🥚 '+state.eggs;['hunger','thirst','health','happy'].forEach(k=>{document.getElementById(k+'Num').textContent=state[k]+' %';document.getElementById(k+'Bar').style.width=state[k]+'%'});
const pct=ph.next?Math.min(100,Math.round(age/ph.next*100)):100;document.getElementById('lifeBadge').textContent=(ph.id==='egg'?'🥚 ':ph.id==='chick'?'🐣 ':ph.id==='pullet'?'🐥 ':ph.id==='hen'?'🐔 ':'👑 ')+pct+' %';
const night=part==='night';document.getElementById('sleepMarks').classList.toggle('hidden', !(night && ph.id!=='egg'));document.getElementById('nest').classList.toggle('hidden',!(ph.id==='egg'));document.getElementById('lamp').classList.toggle('hidden',ph.id!=='chick');document.getElementById('perch').classList.toggle('hidden',!(night && (ph.id==='hen'||ph.id==='matron')));
const hero=document.getElementById('hero');hero.style.removeProperty('left');hero.style.removeProperty('bottom');hero.className='hero '+(ph.id==='egg'?'eggPos':ph.id==='chick'?'chickPos movingPet '+actionClass(state.ai.action):(night&&(ph.id==='hen'||ph.id==='matron'))?'henNight movingPet resting':(ph.id==='hen'||ph.id==='matron'||ph.id==='pullet')?'henDay movingPet '+actionClass(state.ai.action):'')+facingClass();if(ph.id!=='egg'){hero.style.setProperty('left',state.ai.x+'%','important');hero.style.setProperty('bottom',state.ai.y+'%','important');}const bubble=document.getElementById('thoughtBubble');bubble.textContent='💭 '+state.ai.action;bubble.classList.toggle('hidden',ph.id==='egg');bubble.style.setProperty('left',state.ai.x+'%','important');bubble.style.setProperty('bottom',(ph.id==='chick'?'53%':(state.ai.y+29)+'%'),'important');
document.getElementById('actionFx').innerHTML=ph.id==='egg'?'':actionFxHtml(state.ai.action);let art='';if(ph.id==='egg')art=eggSvg(eggCrack(age/HATCH_TIME));else if(ph.id==='chick')art=chickSvg(night);else if(ph.id==='pullet')art=pulletSvg(night);else if(ph.id==='hen')art=henSvg(night,false);else art=henSvg(night,true);document.getElementById('petArt').innerHTML=art;
const rainOn=state.weather&&['déšť','bouřka'].includes(state.weather.text);let fx=document.getElementById('weatherEffects');fx.classList.toggle('rain',rainOn);if(rainOn && !fx.querySelector('.drop')){for(let i=0;i<8;i++){let d=document.createElement('div');d.className='drop';fx.appendChild(d)}} renderWeatherGraphics(); renderLog(); renderGallery(); renderMini(); renderStats(); renderAchievements();}

function renderWeatherGraphics(){
  const overlay=document.querySelector('.weatherOverlay');
  if(!overlay || !state)return;
  const w=(state.weather&&state.weather.text)||'';
  overlay.innerHTML='';
  const add=(cls)=>{const d=document.createElement('div');d.className=cls;overlay.appendChild(d);return d;};

  if(w==='jasno' || w==='polojasno'){
    add('sunRay');
  }

  if(w==='déšť' || w==='bouřka'){
    const rain=add('weatherLayer rainLayer');
    const count=w==='bouřka'?95:70;
    for(let i=0;i<count;i++){
      const d=document.createElement('i');
      const size=Math.random()<.18?'big':(Math.random()<.45?'small':'');
      d.className='drop '+size;
      d.style.left=(Math.random()*100).toFixed(2)+'%';
      d.style.animationDuration=(0.75+Math.random()*0.85).toFixed(2)+'s';
      d.style.animationDelay=(-Math.random()*2).toFixed(2)+'s';
      d.style.opacity=(0.55+Math.random()*0.45).toFixed(2);
      rain.appendChild(d);
    }
    const puddles=add('puddleLayer');
    ['p1','p2','p3'].forEach(c=>{
      const p=document.createElement('div');p.className='puddle '+c;puddles.appendChild(p);
    });
    ['r1','r2','r3'].forEach(c=>{
      const r=document.createElement('div');r.className='ripple '+c;puddles.appendChild(r);
    });
  }

  if(w==='sníh'){
    const cover=add('snowCover');
    const roof=add('snowRoof');
    const snow=add('weatherLayer snowLayer');
    for(let i=0;i<64;i++){
      const f=document.createElement('i');
      f.className='flake';
      f.textContent=Math.random()<.5?'✦':'❄';
      f.style.left=(Math.random()*100).toFixed(2)+'%';
      f.style.fontSize=(9+Math.random()*13).toFixed(1)+'px';
      f.style.animationDuration=(5+Math.random()*7).toFixed(2)+'s';
      f.style.animationDelay=(-Math.random()*8).toFixed(2)+'s';
      f.style.opacity=(0.55+Math.random()*0.45).toFixed(2);
      snow.appendChild(f);
    }
  }

  if(w==='bouřka'){
    add('lightningBolt');
  }

  if(w==='mlha'){
    add('fogBank f1');
    add('fogBank f2');
  }
}

function eggCrack(p){if(p<.25)return 0;if(p<.5)return 1;if(p<.75)return 2;if(p<1)return 3;return 4}
function eggSvg(cr){let cracks=['','<path class="crack" d="M108 80l-13 20 15 15-12 20"/>','<path class="crack" d="M106 66l-17 27 18 21-15 26 17 24"/>','<path class="crack" d="M101 58l-23 34 26 27-22 31 27 36"/><path class="crack" d="M130 88l18 22-14 22 17 18"/>','<path class="crack" d="M86 58l30 32-23 26 31 31-28 34"/><path class="crack" d="M137 67l-22 31 25 31-23 35"/>'][cr];return `<svg class="egg" viewBox="0 0 220 240" width="220" height="240"><defs><radialGradient id="eg" cx="35%" cy="25%"><stop offset="0" stop-color="#fff8dc"/><stop offset="1" stop-color="#e8c98d"/></radialGradient></defs><ellipse cx="110" cy="123" rx="58" ry="86" fill="url(#eg)" stroke="#9f7645" stroke-width="6"/>${cracks}</svg>`}
function chickSvg(sleep){return `<svg class="chick" viewBox="0 0 320 260" width="320" height="260"><circle cx="160" cy="132" r="72" fill="#ffd34d" stroke="#ad7b20" stroke-width="6"/><circle cx="132" cy="118" r="8" fill="#2a1c12"/><circle cx="188" cy="118" r="8" fill="#2a1c12"/>${sleep?'<path d="M124 118q8 8 17 0M181 118q8 8 17 0" fill="none" stroke="#2a1c12" stroke-width="5" stroke-linecap="round"/>':''}<path d="M154 132l27 10-27 14z" fill="#f28a25"/><ellipse cx="91" cy="145" rx="32" ry="18" fill="#f4b934" transform="rotate(-25 91 145)"/><ellipse cx="229" cy="145" rx="32" ry="18" fill="#f4b934" transform="rotate(25 229 145)"/><path d="M134 203l-15 20M142 204l3 24M186 204l-4 24M195 203l15 20" stroke="#9b5a21" stroke-width="7" stroke-linecap="round"/></svg>`}
function pulletSvg(sleep){return `<svg class="hen" viewBox="0 0 360 270" width="360" height="270"><ellipse cx="180" cy="152" rx="92" ry="70" fill="var(--chicken-main)" stroke="#5e361f" stroke-width="6"/><ellipse cx="130" cy="160" rx="38" ry="26" fill="var(--chicken-wing)"/><circle cx="238" cy="104" r="45" fill="var(--chicken-main)" stroke="#5e361f" stroke-width="6"/><path d="M226 65q15-35 34 0q-18-10-34 0z" fill="#e33b2f"/><circle cx="246" cy="95" r="6" fill="#1e1511"/>${sleep?'<path d="M238 95q8 8 17 0" fill="none" stroke="#1e1511" stroke-width="5" stroke-linecap="round"/>':''}<path d="M272 112l35 13-35 17z" fill="#f0a027"/><path d="M88 130q-48-25-64 22q42-4 64-22z" fill="var(--chicken-tail)"/><path d="M154 212l-14 32M196 212l14 32" stroke="#8b4d25" stroke-width="8" stroke-linecap="round"/></svg>`}
function henSvg(sleep,matron){return `<svg class="hen" viewBox="0 0 380 285" width="380" height="285"><path d="M89 142q-54-54-78 11q55 10 88-11z" fill="var(--chicken-tail)" stroke="#4a2a19" stroke-width="5"/><ellipse cx="178" cy="165" rx="108" ry="76" fill="var(--chicken-main)" stroke="#4a2a19" stroke-width="7"/><ellipse cx="135" cy="170" rx="47" ry="33" fill="var(--chicken-wing)"/><circle cx="260" cy="104" r="54" fill="var(--chicken-main)" stroke="#4a2a19" stroke-width="7"/><path d="M237 59q8-38 26-4q13-35 30 2q-24-8-56 2z" fill="#df3029"/><circle cx="275" cy="94" r="7" fill="#1e1511"/>${sleep?'<path d="M266 94q9 9 19 0" fill="none" stroke="#1e1511" stroke-width="5" stroke-linecap="round"/>':''}<path d="M306 113l42 16-42 21z" fill="#f0a027"/><circle cx="290" cy="126" r="12" fill="#d62926"/><ellipse cx="193" cy="143" rx="22" ry="14" fill="var(--chicken-spot)" opacity=".8"/><ellipse cx="152" cy="190" rx="18" ry="11" fill="var(--chicken-spot)" opacity=".7"/><path d="M150 231l-20 39M205 231l20 39" stroke="#8b4d25" stroke-width="9" stroke-linecap="round"/>${matron?'<path d="M247 35l13-24 13 24 25-9-12 27 20 18-31 1-15 24-14-24-31-1 20-18-12-27z" fill="#ffd34d" stroke="#8c6414" stroke-width="5"/>':''}</svg>`}
function feed(){if(phase(now()-state.created).id==='egg'){log('Vajíčko nejí. Jen potřebuje klid a teplo.');return}state.hunger=clamp(state.hunger+26);state.happy=clamp(state.happy+5);log('Dostala krmení.');render();save()}
function water(){if(phase(now()-state.created).id==='egg'){log('Vajíčko nepije, ale hnízdo je zkontrolované.');return}state.thirst=clamp(state.thirst+28);log('Voda je doplněná.');render();save()}
function clean(){state.happy=clamp(state.happy+10);state.health=clamp(state.health+5);log('Kurník a hnízdo jsou čisté.');render();save()}
function warm(){state.health=clamp(state.health+4);state.happy=clamp(state.happy+6);log('Teplota je zkontrolovaná.');render();save()}
function renderLog(){if(!state)return;document.getElementById('log').innerHTML=state.log.map(x=>'<div>'+x+'</div>').join('')}
function tab(id, el){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));if(el)el.classList.add('active');const panel=document.getElementById('panel-'+id);if(panel)panel.classList.add('active');if(id==='mini'){miniGame=null;renderMini();}}
function renderGallery(){const g=document.getElementById('gallery'); if(!g||g.dataset.done)return;g.innerHTML=[['Vejce 0 %',eggSvg(0)],['Prasklina',eggSvg(1)],['Velká prasklina',eggSvg(3)],['Kuřátko',chickSvg(false)],['Mladá',pulletSvg(false)],['Slepice',henSvg(false,false)],['Matka hejna',henSvg(false,true)]].map(p=>`<div class="phase">${p[1]}<div>${p[0]}</div></div>`).join('');g.dataset.done='1'}
function startMini(){const ph=phase(now()-state.created);if(ph.id==='egg')return null;const rainy=isRainy();let pool=['grain','grain','stone','stone','berry','worm','worm','slug'];if(rainy)pool.push('worm','worm','slug');if(ph.id==='chick')pool.push('worm','grain');if(ph.id==='matron')pool.push('berry','slug');let cells=[];for(let i=0;i<25;i++)cells.push(pool[Math.floor(Math.random()*pool.length)]);return {moves:8,found:{worm:0,grain:0,slug:0,berry:0,stone:0},cells,open:Array(25).fill(false),done:false};}
function itemEmoji(x){return {worm:'🪱',grain:'🌾',slug:'🐌',berry:'🍓',stone:'🪨'}[x]||'🌱'}
function itemName(x){return {worm:'červík',grain:'zrní',slug:'slimák',berry:'bobule',stone:'kámen'}[x]||x}
function applyMiniReward(item){if(item==='worm'){state.hunger=clamp(state.hunger+8);state.happy=clamp(state.happy+5);state.stats.worms++;award('firstWorm')}if(item==='grain'){state.hunger=clamp(state.hunger+5);state.stats.grain++}if(item==='slug'){state.hunger=clamp(state.hunger+10);state.happy=clamp(state.happy+8);state.stats.slugs++}if(item==='berry'){state.health=clamp(state.health+3);state.happy=clamp(state.happy+3);state.stats.berries++}if(item==='stone'){state.stats.stones++}state.stats.scratches++;}
function finishMini(){if(!miniGame||miniGame.done)return;miniGame.done=true;state.stats.miniGames++;const f=miniGame.found;const txt=`Výsledek: 🪱 ${f.worm}, 🌾 ${f.grain}, 🐌 ${f.slug}, 🍓 ${f.berry}, 🪨 ${f.stone}`;document.getElementById('miniResult').textContent=txt;document.getElementById('miniResult').classList.remove('hidden');log('🌱 Minihra dokončena. '+txt);save();renderStats();renderAchievements();}
function renderMini(){const m=document.getElementById('minigame');if(!m)return;const ph=phase(now()-state.created);const info=document.getElementById('miniInfo');const result=document.getElementById('miniResult');if(ph.id==='egg'){info.innerHTML='';result.classList.add('hidden');m.innerHTML='<div class="small" style="grid-column:1/-1;background:#fff8e7;border-radius:16px;padding:12px;font-weight:800">🥚 Vajíčko ještě minihru hrát nemůže. Počkej na vylíhnutí.</div>';return}if(!miniGame||miniGame.done){miniGame=startMini();result.classList.add('hidden');}info.innerHTML=`<div>Hrábnutí: ${miniGame.moves}</div><div>Počasí: ${isRainy()?'po dešti 🪱':'běžné 🌱'}</div><div>Nálezy: ${miniGame.found.worm+miniGame.found.grain+miniGame.found.slug+miniGame.found.berry}</div>`;m.innerHTML='';for(let i=0;i<25;i++){const b=document.createElement('button');b.type='button';b.className='tile'+(miniGame.open[i]?' revealed':'');b.textContent=miniGame.open[i]?itemEmoji(miniGame.cells[i]):'🌱';b.disabled=miniGame.open[i]||miniGame.moves<=0;b.addEventListener('click',()=>{if(miniGame.open[i]||miniGame.moves<=0)return;miniGame.open[i]=true;miniGame.moves--;const item=miniGame.cells[i];miniGame.found[item]++;applyMiniReward(item);b.textContent=itemEmoji(item);b.classList.add('revealed');if(item==='stone')state.happy=clamp(state.happy-1);if(miniGame.moves<=0)finishMini();save();render();});m.appendChild(b)}if(miniGame.moves<=0)finishMini();}
function renderStats(){if(!state)return;const box=document.getElementById('lifeStats');if(!box)return;const age=now()-state.created;const nextEgg=state.nextEggAt?fmtMs(state.nextEggAt-now()):'až bude dospělá';box.innerHTML=[['Věk',ageText(age)],['Povaha',getTrait().name+' – '+getTrait().desc],['Vejce celkem',state.eggs+' ks'],['Další vejce',nextEgg],['Nalezení červíci',Math.floor(state.stats.worms)],['Slimáci',Math.floor(state.stats.slugs)],['Zrní',Math.floor(state.stats.grain)],['Odehrané minihry',Math.floor(state.stats.miniGames)],['Čas spánku',Math.round(state.stats.sleepHours)+' h'],['Čas venku',Math.round(state.stats.outsideHours)+' h']].map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('');}
function renderAchievements(){if(!state)return;const box=document.getElementById('achievements');if(!box)return;box.innerHTML=ACH.map(a=>`<div class="badge ${state.achievements[a[0]]?'done':''}">${state.achievements[a[0]]?'🏆':'🔒'} ${a[1]}<div class="small">${a[2]}</div></div>`).join('');}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='slepicka-zaloha-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
function importSave(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();load();log('Záloha byla načtena.')}catch(err){alert('Soubor nejde načíst.')}};r.readAsText(file)}
setInterval(()=>tick(false),60000);setInterval(()=>{render();},3000);load();


/* === 0.4.1: jemnější kreslená zvířata === */
function chickSvg(sleep){return `<svg class="chick" viewBox="0 0 320 260" width="320" height="260"><defs><radialGradient id="chBody" cx="36%" cy="28%"><stop offset="0" stop-color="#fff6a2"/><stop offset="1" stop-color="#ffd34d"/></radialGradient></defs><ellipse cx="160" cy="145" rx="76" ry="68" fill="url(#chBody)" stroke="#9f6d1d" stroke-width="6"/><circle cx="184" cy="95" r="45" fill="url(#chBody)" stroke="#9f6d1d" stroke-width="6"/><path d="M174 57q9-24 22 0q-12-7-22 0z" fill="#e94c36"/><circle cx="196" cy="88" r="6" fill="#25170d"/>${sleep?'<path d="M187 88q8 7 17 0" fill="none" stroke="#25170d" stroke-width="5" stroke-linecap="round"/>':''}<path d="M218 102l30 11-30 16z" fill="#f28a25" stroke="#9f5d17" stroke-width="3"/><ellipse cx="119" cy="148" rx="32" ry="23" fill="#f4b934" opacity=".8" transform="rotate(-22 119 148)"/><path d="M130 203l-13 23M144 204l1 26M184 204l-2 26M196 203l14 23" stroke="#8a4a1e" stroke-width="7" stroke-linecap="round"/><ellipse cx="149" cy="132" rx="10" ry="7" fill="#fff2a0" opacity=".7"/><ellipse cx="105" cy="214" rx="86" ry="16" fill="#000" opacity=".08"/></svg>`}
function pulletSvg(sleep){return `<svg class="hen" viewBox="0 0 360 270" width="360" height="270"><defs><radialGradient id="pBody" cx="38%" cy="26%"><stop offset="0" stop-color="var(--chicken-spot)"/><stop offset="1" stop-color="var(--chicken-main)"/></radialGradient></defs><path d="M91 132q-48-26-69 20q43 3 73-18z" fill="var(--chicken-tail)" stroke="#4a2a19" stroke-width="5"/><ellipse cx="176" cy="156" rx="96" ry="70" fill="url(#pBody)" stroke="#4a2a19" stroke-width="6"/><ellipse cx="135" cy="164" rx="43" ry="31" fill="var(--chicken-wing)" opacity=".9"/><circle cx="242" cy="101" r="47" fill="var(--chicken-main)" stroke="#4a2a19" stroke-width="6"/><path d="M225 62q8-28 23-2q13-24 25 3q-22-7-48-1z" fill="#df3029"/><circle cx="254" cy="92" r="6" fill="#1e1511"/>${sleep?'<path d="M246 92q8 8 17 0" fill="none" stroke="#1e1511" stroke-width="5" stroke-linecap="round"/>':''}<path d="M276 111l34 13-34 17z" fill="#f0a027" stroke="#965b19" stroke-width="3"/><circle cx="263" cy="119" r="8" fill="#d62926"/><ellipse cx="183" cy="134" rx="19" ry="12" fill="var(--chicken-spot)" opacity=".75"/><path d="M154 212l-15 34M197 212l16 34" stroke="#7d431f" stroke-width="8" stroke-linecap="round"/><ellipse cx="170" cy="247" rx="92" ry="14" fill="#000" opacity=".08"/></svg>`}
function henSvg(sleep,matron){return `<svg class="hen" viewBox="0 0 380 285" width="380" height="285"><defs><radialGradient id="hBody" cx="38%" cy="25%"><stop offset="0" stop-color="var(--chicken-spot)"/><stop offset=".42" stop-color="var(--chicken-main)"/><stop offset="1" stop-color="var(--chicken-wing)"/></radialGradient></defs><path d="M90 145q-55-58-81 8q56 13 91-8z" fill="var(--chicken-tail)" stroke="#3f2415" stroke-width="5"/><ellipse cx="178" cy="166" rx="111" ry="78" fill="url(#hBody)" stroke="#3f2415" stroke-width="7"/><ellipse cx="134" cy="170" rx="48" ry="34" fill="var(--chicken-wing)" opacity=".9"/><path d="M113 162q24 27 64 30" fill="none" stroke="#ffffff45" stroke-width="5" stroke-linecap="round"/><circle cx="260" cy="103" r="55" fill="var(--chicken-main)" stroke="#3f2415" stroke-width="7"/><path d="M235 58q8-40 27-5q14-37 32 3q-25-9-59 2z" fill="#df3029" stroke="#8b1714" stroke-width="3"/><circle cx="276" cy="93" r="7" fill="#1e1511"/>${sleep?'<path d="M267 93q9 9 19 0" fill="none" stroke="#1e1511" stroke-width="5" stroke-linecap="round"/>':''}<path d="M306 112l43 17-43 22z" fill="#f0a027" stroke="#955b19" stroke-width="3"/><circle cx="290" cy="127" r="12" fill="#d62926"/><ellipse cx="198" cy="143" rx="23" ry="14" fill="var(--chicken-spot)" opacity=".78"/><ellipse cx="153" cy="190" rx="18" ry="11" fill="var(--chicken-spot)" opacity=".7"/><path d="M150 231l-20 39M205 231l20 39" stroke="#7d431f" stroke-width="9" stroke-linecap="round"/><path d="M130 270h-24M225 270h24" stroke="#7d431f" stroke-width="7" stroke-linecap="round"/>${matron?'<path d="M247 35l13-24 13 24 25-9-12 27 20 18-31 1-15 24-14-24-31-1 20-18-12-27z" fill="#ffd34d" stroke="#8c6414" stroke-width="5"/>':''}<ellipse cx="177" cy="274" rx="112" ry="13" fill="#000" opacity=".08"/></svg>`}


/* ==== 0.6.0 asset pack overrides ==== */

const ASSET_PATHS={
  coop:'assets/coop.png',chick:'assets/chick.png',hen:'assets/hen.png',
  egg0:'assets/egg0.png',egg1:'assets/egg1.png',egg2:'assets/egg2.png',
  feeder:'assets/feeder.png',waterer:'assets/waterer.png',nest:'assets/nest-prop.png',
  perch:'assets/perch.png',lamp:'assets/lamp.png',dustbath:'assets/dustbath.png'
};
function ensureAssetPack(){
  const stage=document.getElementById('stageCard');
  if(stage && !stage.querySelector('.dustbathAsset')){
    const d=document.createElement('div');
    d.className='dustbathAsset';
    stage.appendChild(d);
  }
  const newGame=document.getElementById('newGame');
  if(newGame && !newGame.querySelector('.previewAssetNote')){
    const p=document.createElement('div');
    p.className='previewAssetNote';
    p.textContent='Asset pack je teď vložený přímo do kódu hry.';
    newGame.appendChild(p);
  }
}
function eggAssetForCrack(cr){return cr<=0?ASSET_PATHS.egg0:(cr<=2?ASSET_PATHS.egg1:ASSET_PATHS.egg2)}
function eggSvg(cr){return `<img class="petSprite eggSprite" src="${eggAssetForCrack(cr)}" alt="Vajíčko">`}
function chickSvg(sleep){return `<img class="petSprite chickSprite ${sleep?'sleeping':''}" src="${ASSET_PATHS.chick}" alt="Kuřátko">`}
function pulletSvg(sleep){return `<img class="petSprite pulletSprite ${sleep?'sleeping':''}" src="${ASSET_PATHS.hen}" alt="Mladá slepička">`}
function henSvg(sleep,matron){return `<div class="petSpriteWrap"><img class="petSprite henSprite ${sleep?'sleeping':''}" src="${ASSET_PATHS.hen}" alt="Slepička">${matron?'<div class="petCrown">👑</div>':''}</div>`}
function renderGallery(){
  const g=document.getElementById('gallery');
  if(!g)return;
  g.innerHTML=[
    ['Vejce 0 %',eggSvg(0)],
    ['Prasklina',eggSvg(1)],
    ['Velká prasklina',eggSvg(3)],
    ['Kuřátko',chickSvg(false)],
    ['Mladá slepička',pulletSvg(false)],
    ['Slepice',henSvg(false,false)],
    ['Matka hejna',henSvg(false,true)]
  ].map(p=>`<div class="phase">${p[1]}<div>${p[0]}</div></div>`).join('');
}
function render(){
  ensureAssetPack();
  const age=now()-state.created;
  const ph=phase(age);
  const part=dayPart();
  updateAi(ph,part);
  document.body.className=((part==='night'?'sky-night':part==='dawn'?'sky-dawn':part==='evening'?'sky-evening':'')+' '+weatherClass()+(isRainy()?' rainy':'')).trim();
  document.getElementById('clock').textContent=new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('petName').textContent=state.name+' ('+state.color.name+')';
  document.getElementById('phaseName').textContent=ph.name;
  document.getElementById('ageText').textContent=ageText(age);
  const sun=getSunTimes();
  document.getElementById('sunText').textContent=sun.rise.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'})+' / '+sun.set.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('weatherText').textContent=state.weather?(state.weather.text+(state.weather.temp!=null?' '+Math.round(state.weather.temp)+' °C':'')):'offline';
  document.getElementById('traitText').textContent=getTrait().name;
  document.getElementById('activityText').innerHTML='<span class="activityTextStrong">'+state.ai.action+'</span>';
  document.getElementById('eggsText').textContent=state.eggs+' ks';
  document.getElementById('eggCounter').textContent='🥚 '+state.eggs;
  ['hunger','thirst','health','happy'].forEach(k=>{document.getElementById(k+'Num').textContent=state[k]+' %';document.getElementById(k+'Bar').style.width=state[k]+'%'});
  const pct=ph.next?Math.min(100,Math.round(age/ph.next*100)):100;
  document.getElementById('lifeBadge').textContent=(ph.id==='egg'?'🥚 ':ph.id==='chick'?'🐣 ':ph.id==='pullet'?'🐥 ':ph.id==='hen'?'🐔 ':'👑 ')+pct+' %';
  const night=part==='night';
  document.getElementById('sleepMarks').classList.toggle('hidden', !(night && ph.id!=='egg'));
  document.getElementById('nest').classList.toggle('hidden',!(ph.id==='egg'));
  document.getElementById('lamp').classList.toggle('hidden',ph.id!=='chick');
  document.getElementById('perch').classList.toggle('hidden',!(night && (ph.id==='hen'||ph.id==='matron')));
  const hero=document.getElementById('hero');
  hero.style.removeProperty('left');hero.style.removeProperty('bottom');
  hero.className='hero phase-'+ph.id+' '+(ph.id==='egg'?'eggPos':ph.id==='chick'?'chickPos movingPet '+actionClass(state.ai.action):(night&&(ph.id==='hen'||ph.id==='matron'))?'henNight movingPet resting':(ph.id==='hen'||ph.id==='matron'||ph.id==='pullet')?'henDay movingPet '+actionClass(state.ai.action):'')+facingClass();
  if(ph.id!=='egg'){hero.style.setProperty('left',state.ai.x+'%','important');hero.style.setProperty('bottom',state.ai.y+'%','important');}
  const bubble=document.getElementById('thoughtBubble');
  bubble.textContent='💭 '+state.ai.action;
  bubble.classList.toggle('hidden',ph.id==='egg');
  bubble.style.setProperty('left',state.ai.x+'%','important');
  bubble.style.setProperty('bottom',(ph.id==='chick'?'53%':(state.ai.y+29)+'%'),'important');
  document.getElementById('actionFx').innerHTML=ph.id==='egg'?'':actionFxHtml(state.ai.action);
  let art='';
  if(ph.id==='egg')art=eggSvg(eggCrack(age/HATCH_TIME));
  else if(ph.id==='chick')art=chickSvg(night);
  else if(ph.id==='pullet')art=pulletSvg(night);
  else if(ph.id==='hen')art=henSvg(night,false);
  else art=henSvg(night,true);
  document.getElementById('petArt').innerHTML=art;
  const rainOn=state.weather&&['déšť','bouřka'].includes(state.weather.text);
  let fx=document.getElementById('weatherEffects');
  fx.classList.toggle('rain',rainOn);
  if(rainOn && !fx.querySelector('.drop')){for(let i=0;i<8;i++){let d=document.createElement('div');d.className='drop';fx.appendChild(d)}}
  renderWeatherGraphics(); renderLog(); renderGallery(); renderMini(); renderStats(); renderAchievements();
}
setTimeout(()=>{try{ensureAssetPack();render();}catch(e){}},0);


/* 0.6.1 – pomocné přepnutí počasí pro testování vzhledu */
window.setDemoWeather = function(type){
  if(!state) return;
  const allowed=['jasno','polojasno','zataženo','mlha','déšť','sníh','bouřka'];
  if(!allowed.includes(type)) return;
  state.weather={temp: type==='sníh' ? -2 : (type==='déšť'||type==='bouřka' ? 12 : 22), code:null, text:type};
  state.weatherAt=now();
  render();
};
