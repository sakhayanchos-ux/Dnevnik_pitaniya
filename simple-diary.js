(async function diaryApp(){
  // Read the callback URL BEFORE loading Supabase: its auth initializer may
  // consume/clear the fragment before application state is created.
  const callbackHash = new URLSearchParams(location.hash.slice(1));
  const callbackQuery = new URLSearchParams(location.search);
  const recoveryFromUrl = callbackHash.get("type")==="recovery" ||
    callbackQuery.get("type")==="recovery" ||
    (callbackHash.has("access_token") && callbackQuery.get("recovery")==="1");
  const recoveryErrorFromUrl = callbackHash.get("error_description") ||
    callbackQuery.get("error_description");
  const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2.57.0");
  const db=createClient("https://xprobrrrpybmzbucakws.supabase.co","sb_publishable_UETDRxFcw79NwwBmvjI4sw_7F5y5B28");
  const APP_URL="https://sakhayanchos-ux.github.io/Dnevnik_pitaniya/";
  const root=document.getElementById("app");
  const toastEl=document.getElementById("toast");
  const mealNames={breakfast:"Завтрак",snack1:"Первый перекус",lunch:"Обед",snack2:"Второй перекус",dinner:"Ужин",other:"Другое"};
  const slots=[["breakfast","01"],["snack1","02"],["lunch","03"],["snack2","04"],["dinner","05"]];
  const ratings={good:"Хорошо",improve:"Улучшить",attention:"Внимание"};
  const icon=(name)=>'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({
    book:'<rect x="4" y="3.8" width="16" height="16.4" rx="1.8"/><path d="M8.5 3.8v16.4M11.5 8h5M11.5 12h5M11.5 16h3"/>',
    chart:'<path d="M4 19.5h16M6.5 16V10M12 16V5M17.5 16V8"/><path d="M5 18h14"/>',
    user:'<circle cx="12" cy="8.3" r="3.3"/><path d="M5.3 20c.2-3.8 2.7-5.7 6.7-5.7s6.5 1.9 6.7 5.7"/>',
    drop:'<path d="M12 2.5C9.2 7 6.1 10 6.1 13.7a5.9 5.9 0 0 0 11.8 0C17.9 10 14.8 7 12 2.5Z"/>',
    leaf:'<path d="M20.2 3.8c-8.2-.1-14.5 3.5-14.5 10.1a6.1 6.1 0 0 0 6.1 6.1c6.7 0 9.1-7.1 8.4-16.2Z"/><path d="M4.3 20c3.5-6.3 7.5-8.8 12-11.4"/>',
    camera:'<path d="M3 8.2h4l1.8-2.5h6.4L17 8.2h4v11.2H3Z"/><circle cx="12" cy="13.9" r="3.25"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>'
  }[name]||'')+'</svg>';
  const S={user:null,profile:null,people:{},consultants:[],clients:[],mode:"client",tab:"diary",date:localDate(),selected:null,day:null,meals:[],mealReviews:[],dayReviews:[],weights:[],photo:{},openMeal:false,mealType:"breakfast",authMode:"login",recovery:recoveryFromUrl,busy:false};
  const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=x=>Number(x||0);
  const cleanName=x=>/^(?:phone[._ -]?[0-9+]+|[+0-9][0-9 .-]{7,})$/i.test(String(x||""))?"":String(x||"");
  const fmt=x=>x?String(x).slice(0,5):"";
  const v=(form,name)=>String(form.elements.namedItem(name)?.value??"").trim();
  const notify=m=>{toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toastEl.classList.remove("show"),4200)};
  const ok=async p=>{const {data,error}=await p;if(error)throw error;return data};
  const showError=e=>{console.error(e);const m=e?.message||String(e);notify(/Invalid login credentials/i.test(m)?"Неверная почта или пароль. Нажмите «Забыли пароль?»":/User already registered/i.test(m)?"Аккаунт уже есть. Выберите «Войти» или восстановите пароль.":/Email not confirmed/i.test(m)?"Подтвердите электронную почту":m)};
  async function guarded(fn){if(S.busy)return;S.busy=true;try{await fn()}catch(e){showError(e)}finally{S.busy=false}}
  function localDate(){return new Date().toLocaleDateString("sv-SE")}
  function dateAdd(date,n){const [y,m,d]=date.split("-").map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10)}
  const currentId=()=>S.mode==="coach"?S.selected:S.user?.id;
  const currentProfile=()=>S.mode==="coach"?S.people[S.selected]:S.profile;
  const who=id=>S.people[id]?.display_name||"Участник";
  const proteinGoal=p=>{const w=num(p?.weight_kg),factor={loss:1.4,maintain:1.2,gain:1.6}[p?.goal];return w&&factor?Math.round(w*factor):0};
  const waterGoal=p=>p?.weight_kg?Math.round(num(p.weight_kg)*35):0;
  const dayProtein=()=>Math.round(S.meals.reduce((a,m)=>a+num(m.protein_g),0)*10)/10;
  const reviewStatus=()=>{
    if(!S.meals.length&&!S.day)return "empty";
    const latest=[...S.dayReviews].sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))[0];
    const modified=Math.max(Date.parse(S.day?.updated_at||"")||0,...S.meals.map(m=>Date.parse(m.created_at||"")||0),0);
    return latest&&Date.parse(latest.updated_at)>=modified?"done":"waiting";
  };
  function formField(name,title,type="text",value="",attrs=""){
    return `<label class="field"><span>${title}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  }
  function authView(){
    if(S.recovery)return `<div class="auth-screen"><div class="auth-card"><div class="logo"><img src="./diary-icon.webp?v=1" alt="Дневник питания" class="app-logo" width="44" height="44"></div><h1>Новый пароль</h1><p>Придумайте пароль для входа в дневник.</p><form id="newPasswordForm">${formField("newPassword","Новый пароль","password","","required minlength=8 autocomplete=new-password")}${formField("againPassword","Повторите пароль","password","","required minlength=8 autocomplete=new-password")}<button class="primary full">Сохранить пароль</button></form></div></div>`;
    const isRegister=S.authMode==="register",isReset=S.authMode==="reset";
    return `<div class="auth-screen"><div class="auth-card"><div class="logo"><img src="./diary-icon.webp?v=1" alt="Дневник питания" class="app-logo" width="44" height="44"></div><h1>Дневник питания</h1><p>Открой, заполни и получи рекомендации консультанта.</p><h2>${isReset?"Восстановление пароля":isRegister?"Регистрация":"Вход"}</h2><form id="${isReset?"resetForm":"authForm"}">${isRegister?formField("name","Имя и фамилия","text","","required maxlength=120"):""}${formField("email","Электронная почта","email","","required autocomplete=email")}${isReset?"":formField("password","Пароль","password","","required minlength=6 autocomplete=current-password")}<button class="primary full">${isReset?"Отправить ссылку":isRegister?"Зарегистрироваться":"Войти"}</button></form>${isReset?`<details class="recovery-fallback"><summary>Ссылка ведёт на localhost? Войти по ссылке вручную</summary><p>Откройте новое письмо, зажмите кнопку восстановления и выберите «Скопировать ссылку». Не открывайте ссылку. Вставьте её сюда — это безопасный способ завершить восстановление на нашем сайте.</p><form id="linkRecoveryForm"><label class="field"><span>Ссылка из письма</span><textarea name="recoveryLink" rows="3" placeholder="Вставьте ссылку из письма" required autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label><button class="primary full">Продолжить восстановление</button></form><p class="secret-hint">Не отправляйте эту ссылку другим людям.</p></details>`:""}<div class="auth-links">${isReset?'<button data-action="login">← Назад ко входу</button>':`<button data-action="${isRegister?"login":"register"}">${isRegister?"Уже есть аккаунт? Войти":"Создать аккаунт"}</button>${isRegister?"":'<button data-action="reset">Забыли пароль?</button>'}`}</div></div></div>`;
  }
  function top(){
    const coach=S.mode==="coach";
    return `<header class="top"><div class="brand"><span class="logo-mini"><img src="./diary-icon.webp?v=1" alt="Дневник питания" class="app-logo" width="44" height="44"></span><div><strong>Дневник питания</strong><small>ЛИЧНЫЙ ЖУРНАЛ</small></div></div><button class="quiet" data-action="logout">Выйти</button></header>
    <div class="switch"><button class="${coach?"":"selected"}" data-action="clientMode">Мой дневник</button><button class="${coach?"selected":""}" data-action="coachMode">Консультант</button></div>`;
  }
  function coachPanel(){
    let h=`<section class="coach-panel"><div class="section-title"><h2>Мои клиенты</h2><span>${S.clients.length}</span></div>`;
    if(S.clients.length)h+=`<div class="clients-scroll">${S.clients.map(l=>`<button data-action="chooseClient" data-id="${esc(l.client_id)}" class="${S.selected===l.client_id?"chosen":""}">${esc(who(l.client_id))}</button>`).join("")}</div>`;
    else h+='<p class="subtle">Клиенты появятся здесь после подключения.</p>';
    h+=`<details><summary>Код для подключения клиента</summary><p class="subtle">Отправьте этот код клиенту.</p><div class="copy-code">${esc(S.user.id)}</div><button class="secondary" data-action="copyCode">Скопировать код</button></details></section>`;
    return h;
  }
  function bottom(){
    return `<nav class="bottom-nav" aria-label="Разделы"><button data-action="tab" data-tab="diary" class="${S.tab==="diary"?"selected":""}">${icon("book")}Дневник</button><button data-action="tab" data-tab="results" class="${S.tab==="results"?"selected":""}">${icon("chart")}Результаты</button><button data-action="tab" data-tab="profile" class="${S.tab==="profile"?"selected":""}">${icon("user")}Профиль</button></nav>`;
  }
  function photoItem(m){
    const reviews=S.mealReviews.filter(r=>r.meal_id===m.id);
    let h=`<div class="food-row">${S.photo[m.id]?`<img alt="Фото еды" loading="lazy" src="${esc(S.photo[m.id])}">`:'<div class="photo-none">Без фото</div>'}<div class="food-body"><small>${esc(fmt(m.eaten_at)||"—")}</small><strong>${esc(m.description)}</strong><span>${m.portion_g!=null?`${esc(m.portion_g)} г · `:""}${m.protein_g!=null?`${esc(m.protein_g)} г белка`:""}</span></div>${S.mode==="client"?`<button class="delete-meal" data-action="deleteMeal" data-id="${esc(m.id)}" aria-label="Удалить">×</button>`:""}</div>`;
    for(const r of reviews)h+=`<div class="review-label ${esc(r.rating)}"><b>${esc(ratings[r.rating]||"Оценка")}</b>${r.comment?`<span>${esc(r.comment)}</span>`:""}</div>`;
    if(S.mode==="coach"){
      const own=reviews.find(r=>r.consultant_id===S.user.id);
      h+=`<form class="mealReviewForm" data-id="${esc(m.id)}"><div class="rating-row">${Object.entries(ratings).map(([key,label])=>`<label class="${key}"><input type="radio" name="rating" value="${key}" ${(own?.rating||"good")===key?"checked":""}>${label}</label>`).join("")}</div><input name="comment" value="${esc(own?.comment||"")}" maxlength="3000" placeholder="Комментарий (необязательно)"><button class="secondary">Сохранить оценку</button></form>`;
    }
    return h;
  }
  function glassSvg(percent){
    const line=141-1.27*Math.max(0,Math.min(100,percent));
    return `<svg viewBox="0 0 120 145" role="img" aria-label="Вода ${percent}%"><defs><clipPath id="cup"><path d="M24 11 H96 L88 131 Q60 141 32 131 Z"/></clipPath></defs><path d="M24 11 H96 L88 131 Q60 141 32 131 Z" fill="#fff" stroke="#729CAA" stroke-width="3"/><g clip-path="url(#cup)"><rect x="20" y="${line}" width="80" height="145" fill="#729CAA"/><path d="M20 ${line} Q40 ${line-4} 60 ${line} T100 ${line}" fill="none" stroke="#0B4461" stroke-width="2"/></g></svg>`;
  }
  function proteinSvg(percent){
    const dash=(Math.min(100,percent)/100*276.46).toFixed(1);
    return `<svg viewBox="0 0 120 120" role="img" aria-label="Белок ${percent}%"><circle cx="60" cy="60" r="44" fill="none" stroke="#D7E5EB" stroke-width="8"/><circle cx="60" cy="60" r="44" fill="none" stroke="#0B4461" stroke-width="8" stroke-linecap="${percent?"round":"butt"}" stroke-dasharray="${dash} 276.46" transform="rotate(-90 60 60)"/><text x="60" y="67" font-size="23" font-weight="800" text-anchor="middle" fill="#0B4461">${percent}%</text></svg>`;
  }
  function diaryView(){
    const coach=S.mode==="coach",p=currentProfile(),wGoal=waterGoal(p),pGoal=proteinGoal(p),water=num(S.day?.water_ml),protein=dayProtein(),wp=wGoal?Math.min(100,Math.round(100*water/wGoal)):0,pp=pGoal?Math.min(100,Math.round(100*protein/pGoal)):0;
    const state=reviewStatus();
    let h=`<div class="page-heading"><div><div class="eyebrow">${coach?"ДНЕВНИК КЛИЕНТА":"МОЙ ДНЕВНИК"}</div><h1>${coach?esc(who(S.selected)):"Привет"+(cleanName(p?.display_name)?`, ${esc(cleanName(p.display_name).split(" ")[0])}`:"")+"!"}</h1><p>Питание, вода и самочувствие за день</p></div><span class="state ${state}">${state==="done"?"Проверено":state==="waiting"?"Ждёт проверки":"Нет записей"}</span></div>
      <div class="date-bar"><button data-action="prevDay">‹</button><label><span>Дата дневника</span><input type="date" id="diaryDate" value="${esc(S.date)}"></label><button data-action="nextDay">›</button></div>
      <div class="indicators">
        <section class="indicator"><div class="indicator-title"><strong>${icon("drop")} Вода</strong><span>${wp}%</span></div><div class="graphic">${glassSvg(wp)}<div><b>${water.toLocaleString("ru-RU")} мл</b><small>${wGoal?`из ${wGoal.toLocaleString("ru-RU")} мл`:"Укажите вес"}</small></div></div>
          ${coach?"":`<div class="water-buttons"><button data-action="waterQuick" data-ml="100">+100</button><button data-action="waterQuick" data-ml="200">+200</button><button data-action="waterQuick" data-ml="250">+250</button></div><form id="waterForm" class="water-form"><input type="number" name="water" aria-label="Миллилитры за день" min="0" max="15000" value="${water}"><button class="secondary">Записать</button></form>`}
        </section>
        <section class="indicator"><div class="indicator-title"><strong>${icon("leaf")} Белок</strong><span>${pp}%</span></div><div class="graphic">${proteinSvg(pp)}<div><b>${protein} г</b><small>${pGoal?`из ${pGoal} г`:"Нет цели"}</small>${pGoal?`<small>Осталось ${Math.max(0,Math.round((pGoal-protein)*10)/10)} г</small>`:""}</div></div><p class="explain">Белок из записей о еде</p></section>
      </div>`;
    if(!coach&&(!p?.weight_kg||!p?.goal))h+=`<div class="hint">Укажите вес и цель — рассчитаем воду и белок. <button data-action="tab" data-tab="profile">Открыть профиль →</button></div>`;
    h+=`<section class="meal-section"><div class="section-title"><div><h2>Моё питание</h2><p>Пять приёмов пищи</p></div>${coach?"":`<button class="primary compact" data-action="openMeal" data-type="breakfast">${icon("camera")} Добавить фото</button>`}</div>`;
    for(const [type,number] of slots){
      const entries=S.meals.filter(m=>m.meal_type===type);
      h+=`<article class="meal-slot"><div class="slot-header"><span class="slot-number">${number}</span><strong>${mealNames[type]}</strong>${entries.length?`<span class="count">${entries.length}</span>`:""}${coach?"":`<button data-action="openMeal" data-type="${type}" class="plus" aria-label="Добавить запись">${icon("plus")}</button>`}</div>`;
      h+=entries.length?entries.map(photoItem).join(""):`<p class="slot-empty">${coach?"Пока без записи":"Нажмите +, чтобы добавить фото"}</p>`;
      h+="</article>";
    }
    const others=S.meals.filter(m=>m.meal_type==="other");
    if(others.length)h+=`<article class="meal-slot"><div class="slot-header"><strong>Дополнительно</strong></div>${others.map(photoItem).join("")}</article>`;
    if(!coach){

      if(S.openMeal)h+=`<section class="new-entry" id="newEntry"><div class="section-title"><h2>Добавить питание</h2><button class="close" data-action="closeMeal">×</button></div><form id="mealForm">
        <label class="field"><span>Приём пищи</span><select name="type">${Object.entries(mealNames).map(([key,label])=>`<option value="${key}" ${key===S.mealType?"selected":""}>${label}</option>`).join("")}</select></label>
        <label class="field"><span>Фото еды *</span><input type="file" name="photo" accept="image/*" required></label><div id="photoPreview" class="photo-preview" hidden></div>
        <label class="field"><span>Что ели? *</span><textarea name="description" rows="2" maxlength="2000" placeholder="Например, омлет с овощами" required></textarea></label>
        <div class="two">${formField("time","Время *","time",new Date().toTimeString().slice(0,5),"required")}${formField("protein","Белок, г *","number","","min=0 max=3000 step=.1 required")}</div>
        ${formField("portion","Порция, г (по желанию)","number","","min=1 max=20000 step=.1")}
        <button class="primary full">Сохранить запись</button></form></section>`;
    }
    h+="</section>";
    h+=`<section class="card"><div class="section-title"><h2>Итоги дня</h2></div>`;
    if(coach){
      h+=`<div class="summary-list"><div><span>Упражнения</span><b>${num(S.day?.activity_minutes)} мин</b></div><div><span>Подъём</span><b>${fmt(S.day?.wake_time)||"—"}</b></div><div><span>Сон</span><b>${fmt(S.day?.bedtime)||"—"}</b></div><div><span>Самочувствие</span><b>${S.day?.wellbeing??"—"}</b></div></div>${S.day?.notes?`<p class="note">${esc(S.day.notes)}</p>`:""}`;
    }else{
      h+=`<form id="dayForm"><div class="two">${formField("activity","Упражнения, мин","number",S.day?.activity_minutes??0,"min=0 max=1440")}<label class="field"><span>Самочувствие</span><select name="wellbeing"><option value="">Выбрать</option>${Array.from({length:11},(_,i)=>i-5).map(n=>`<option value="${n}" ${S.day?.wellbeing===n?"selected":""}>${n===0?"0 — нормально":n>0?"+"+n:n}</option>`).join("")}</select></label></div><div class="two">${formField("wake","Время подъёма","time",fmt(S.day?.wake_time))}${formField("sleep","Время сна","time",fmt(S.day?.bedtime))}</div><label class="field"><span>Самочувствие и заметки</span><textarea name="notes" maxlength="3000" rows="2" placeholder="Как прошёл день?">${esc(S.day?.notes||"")}</textarea></label><button class="primary full">Сохранить итоги дня</button></form>`;
    }
    h+="</section>";
    if(coach&&S.day){
      const own=S.dayReviews.find(r=>r.consultant_id===S.user.id);
      h+=`<section class="card"><h2>Проверка консультанта</h2><form id="dayReviewForm"><div class="rating-row">${Object.entries(ratings).map(([key,label])=>`<label class="${key}"><input type="radio" name="rating" value="${key}" ${(own?.rating||"good")===key?"checked":""}>${label}</label>`).join("")}</div><label class="field"><span>Рекомендации (по желанию)</span><textarea name="comment" rows="3" maxlength="4000" placeholder="Что можно улучшить?">${esc(own?.comment==="Проверено"?"":own?.comment||"")}</textarea></label><button class="primary full">Завершить проверку</button></form></section>`;
    }
    if(S.dayReviews.length)h+=`<section class="card"><h2>Рекомендации консультанта</h2>${S.dayReviews.map(r=>`<div class="review-label ${esc(r.rating||"good")}"><b>${esc(who(r.consultant_id))} · ${esc(ratings[r.rating]||"Проверено")}</b>${r.comment&&r.comment!=="Проверено"?`<p>${esc(r.comment)}</p>`:""}</div>`).join("")}</section>`;
    return h;
  }
  function profileView(){
    const coach=S.mode==="coach",p=currentProfile();
    let h=`<div class="intro"><h1>${coach?"Профиль клиента":"Мой профиль"}</h1><p>Данные для автоматического расчёта воды и белка</p></div><section class="card"><form id="${coach?"coachProfileForm":"profileForm"}">`;
    if(!coach)h+=formField("name","Имя и фамилия","text",cleanName(p?.display_name)||"","required maxlength=120");
    h+=`${formField("weight","Текущий вес, кг","number",p?.weight_kg??"","min=20 max=500 step=.1")}<label class="field"><span>Моя цель</span><select name="goal"><option value="">Выбрать</option>${[["loss","Снижение веса"],["maintain","Поддержание веса"],["gain","Набор мышечной массы"]].map(([key,label])=>`<option value="${key}" ${p?.goal===key?"selected":""}>${label}</option>`).join("")}</select></label>${formField("target","Желаемый вес, кг (при снижении или наборе)","number",p?.target_weight_kg??"","min=20 max=500 step=.1")}<button class="primary full">Сохранить профиль</button></form></section>`;
    if(!coach)h+=`<section class="card"><h2>Мой консультант</h2><p class="subtle">Введите код консультанта, чтобы он мог проверять дневник.</p><form id="linkForm">${formField("code","Код консультанта","text","","required placeholder='Вставьте код'")}<button class="primary full">Подключить</button></form>${S.consultants.map(l=>`<div class="connected"><b>${esc(who(l.consultant_id))}</b><button data-action="unlink" data-id="${esc(l.consultant_id)}">Отключить</button></div>`).join("")}</section>`;
    return h;
  }
  function resultsView(){
    const p=currentProfile(),weights=[...S.weights].sort((a,b)=>a.log_date.localeCompare(b.log_date)),current=num(p?.weight_kg),initial=weights.length?num(weights[0].weight_kg):current,diff=Math.round((current-initial)*10)/10,target=num(p?.target_weight_kg);
    let h=`<div class="intro"><h1>Мои результаты</h1><p>Вес и динамика изменений</p></div>`;
    if(!current)return h+'<section class="card"><p>Укажите вес в профиле, чтобы увидеть результаты.</p><button data-action="tab" data-tab="profile" class="primary">Открыть профиль</button></section>';
    h+=`<section class="card"><div class="weight-stats"><div><small>Начало</small><b>${initial} кг</b></div><div><small>Сейчас</small><b>${current} кг</b></div><div><small>Изменение</small><b>${diff>0?"+":""}${diff} кг</b></div></div>`;
    if(target&&p?.goal&&p.goal!=="maintain"&&initial!==target){
      const percent=Math.max(0,Math.min(100,Math.round((initial-current)/(initial-target)*100)));
      h+=`<div class="target-progress"><div><strong>Мой путь к цели</strong><b>${percent}%</b></div><div class="progress"><span style="width:${percent}%"></span></div><small>Изменилось ${Math.abs(diff).toFixed(1)} кг · Осталось ${Math.abs(current-target).toFixed(1)} кг</small></div>`;
    }
    if(weights.length>1){
      const values=weights.map(x=>num(x.weight_kg)),min=Math.min(...values)-1,max=Math.max(...values)+1;
      const points=values.map((w,i)=>`${(16+i*288/(values.length-1)).toFixed(1)},${(110-(w-min)/(max-min)*92).toFixed(1)}`).join(" ");
      h+=`<div class="weight-chart"><h3>График веса</h3><svg viewBox="0 0 320 132" width="100%" aria-label="График изменения веса"><line x1="16" x2="304" y1="117" y2="117" stroke="#D5E3E9"/><polyline points="${points}" fill="none" stroke="#0B4461" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg><div class="chart-dates"><span>${esc(weights[0].log_date)}</span><span>${esc(weights[weights.length-1].log_date)}</span></div></div>`;
    }else h+='<p class="subtle">График появится после второго взвешивания.</p>';
    h+='</section>';
    h+=`<section class="card"><h2>Записать вес</h2><form id="weightForm"><div class="two">${formField("date","Дата","date",S.date,"required")}${formField("weight","Вес, кг","number",current,"min=20 max=500 step=.1 required")}</div><button class="primary full">Сохранить вес</button></form></section>`;
    return h;
  }
  function render(){
    if(!S.user||S.recovery){root.innerHTML=authView();return}
    let h=`<div class="container">${top()}`;
    if(S.mode==="coach")h+=coachPanel();
    if(S.mode==="coach"&&!S.selected)h+='<section class="card"><h2>Выберите клиента</h2><p class="subtle">Когда клиент подключится по вашему коду, его дневник появится здесь.</p></section>';
    else h+=S.tab==="profile"?profileView():S.tab==="results"?resultsView():diaryView();
    root.innerHTML=h+bottom()+"</div>";
  }
  async function enter(user){
    S.user=user;
    let p=await ok(db.from("nd_profiles").select("*").eq("id",user.id).maybeSingle());
    if(!p){
      const clean=String(user.user_metadata?.display_name||user.email?.split("@")[0]||"Участник").slice(0,120);
      p=await ok(db.from("nd_profiles").insert({id:user.id,display_name:clean}).select().single());
    }
    S.profile=p;await loadLinks();
  }
  async function loadLinks(){
    if(!S.user)return;
    const id=S.user.id;
    const [clients,consultants]=await Promise.all([ok(db.from("nd_links").select("*").eq("consultant_id",id)),ok(db.from("nd_links").select("*").eq("client_id",id))]);
    S.clients=clients;S.consultants=consultants;
    const ids=[...new Set([...clients.map(x=>x.client_id),...consultants.map(x=>x.consultant_id)])];
    const people=ids.length?await ok(db.from("nd_profiles").select("*").in("id",ids)):[];
    S.people=Object.fromEntries(people.map(p=>[p.id,p]));
    if(!clients.some(l=>l.client_id===S.selected))S.selected=clients[0]?.client_id||null;
    await loadDay();
  }
  async function loadDay(){
    S.day=null;S.meals=[];S.mealReviews=[];S.dayReviews=[];S.photo={};S.weights=[];
    const id=currentId();
    if(!id){render();return}
    const [day,weights]=await Promise.all([ok(db.from("nd_days").select("*").eq("client_id",id).eq("log_date",S.date).maybeSingle()),ok(db.from("nd_weights").select("*").eq("client_id",id).order("log_date",{ascending:true}).limit(120))]);
    S.day=day;S.weights=weights;
    if(day){
      S.meals=await ok(db.from("nd_meals").select("*").eq("day_id",day.id).order("eaten_at"));
      const ids=S.meals.map(m=>m.id);
      const [mr,dr]=await Promise.all([ids.length?ok(db.from("nd_meal_reviews").select("*").in("meal_id",ids)):Promise.resolve([]),ok(db.from("nd_day_reviews").select("*").eq("day_id",day.id))]);
      S.mealReviews=mr;S.dayReviews=dr;
    }
    render();
    const pictured=S.meals.filter(m=>m.photo_path);
    if(pictured.length){
      const signed=await Promise.all(pictured.map(async m=>{const {data}=await db.storage.from("nd-meal-photos").createSignedUrl(m.photo_path,1200);return [m.id,data?.signedUrl]}));
      S.photo=Object.fromEntries(signed.filter(x=>x[1]));
      render();
    }
  }
  async function saveWater(n){
    const water=Math.max(0,Math.min(15000,n));
    await ok(S.day?db.from("nd_days").update({water_ml:water,updated_at:new Date().toISOString()}).eq("id",S.day.id):db.from("nd_days").insert({client_id:S.user.id,log_date:S.date,water_ml:water}));
    await loadDay();
  }
  async function photoToJpeg(file){
    return new Promise((resolve,reject)=>{
      const u=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{
        URL.revokeObjectURL(u);
        const scale=Math.min(1,1280/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const context=canvas.getContext("2d");if(!context){reject(Error("Не удалось обработать фото"));return}
        context.drawImage(img,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob=>blob?resolve(blob):reject(Error("Ошибка обработки фото")),"image/jpeg",.82);
      };
      img.onerror=()=>{URL.revokeObjectURL(u);reject(Error("Фото не открылось. Выберите другое изображение."))};
      img.src=u;
    });
  }
  async function saveProfile(form){
    const coach=form.id==="coachProfileForm",id=coach?S.selected:S.user.id;
    const previous=coach?S.people[id]:S.profile;
    const weight=v(form,"weight")?Number(v(form,"weight")):null,goal=v(form,"goal")||null,target=v(form,"target")?Number(v(form,"target")):null;
    if(goal&&goal!=="maintain"&&!target)throw Error("Для снижения или набора укажите желаемый вес.");
    if(weight!==null&&(weight<20||weight>500))throw Error("Проверьте текущий вес.");
    const record={weight_kg:weight,goal,target_weight_kg:target};
    if(!coach)record.display_name=v(form,"name");
    const p=await ok(db.from("nd_profiles").update(record).eq("id",id).select().single());
    if(coach)S.people[id]=p;else S.profile=p;
    if(weight&&weight!==num(previous?.weight_kg))await ok(db.from("nd_weights").upsert({client_id:id,recorded_by:S.user.id,log_date:localDate(),weight_kg:weight},{onConflict:"client_id,log_date"}));
    notify("Профиль сохранён");await loadDay();
  }
  async function saveWeight(form){
    const id=currentId(),weight=Number(v(form,"weight")),date=v(form,"date");
    if(!(weight>=20&&weight<=500))throw Error("Проверьте вес.");
    await ok(db.from("nd_weights").upsert({client_id:id,recorded_by:S.user.id,log_date:date,weight_kg:weight},{onConflict:"client_id,log_date"}));
    const last=await ok(db.from("nd_weights").select("weight_kg").eq("client_id",id).order("log_date",{ascending:false}).limit(1));
    const p=await ok(db.from("nd_profiles").update({weight_kg:last[0]?.weight_kg??weight}).eq("id",id).select().single());
    if(S.mode==="coach")S.people[id]=p;else S.profile=p;
    notify("Вес сохранён");await loadDay();
  }
  document.addEventListener("submit",e=>{
    const f=e.target;if(!(f instanceof HTMLFormElement))return;
    e.preventDefault();
    guarded(async()=>{
      if(f.id==="authForm"){
        const email=v(f,"email"),password=v(f,"password");
        if(S.authMode==="register"){
          const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:v(f,"name")},emailRedirectTo:APP_URL}});
          if(error)throw error;
          if(data.session)await enter(data.user);else notify("Проверьте почту и подтвердите регистрацию");
        }else{const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;await enter(data.user)}
        return;
      }
      if(f.id==="resetForm"){
        await ok(db.auth.resetPasswordForEmail(v(f,"email"),{redirectTo:APP_URL}));
        S.authMode="reset";render();notify("Письмо отправлено. Если ссылка ведёт на localhost, используйте способ ниже.");return;
      }
      if(f.id==="linkRecoveryForm"){
        const raw=v(f,"recoveryLink");
        let link=raw;
        let tokenHash=null;
        try {
          for(let i=0;i<3;i++){
            const parsed=new URL(link);
            if(parsed.hostname==="xprobrrrpybmzbucakws.supabase.co"&&parsed.pathname==="/auth/v1/verify"){
              if(parsed.searchParams.get("type")!=="recovery")throw Error("Это не ссылка для восстановления пароля");
              tokenHash=parsed.searchParams.get("token")||parsed.searchParams.get("token_hash");
              break;
            }
            const nested=parsed.searchParams.get("url")||parsed.searchParams.get("u")||parsed.searchParams.get("q");
            if(!nested||!nested.startsWith("https://"))break;
            link=nested;
          }
        }catch(e){if(e?.message==="Это не ссылка для восстановления пароля")throw e}
        if(!tokenHash||! /^[a-zA-Z0-9._-]{10,512}$/.test(tokenHash))throw Error("Скопируйте полную ссылку из нового письма о восстановлении.");
        const {data,error}=await db.auth.verifyOtp({token_hash:tokenHash,type:"recovery"});
        if(error)throw Error("Ссылка уже использована или истекла. Запросите новое письмо и скопируйте ссылку, не открывая её.");
        if(!data?.session||!data?.user)throw Error("Не удалось подтвердить ссылку. Запросите новое письмо.");
        S.user=data.user;S.recovery=true;
        render();notify("Ссылка подтверждена. Теперь придумайте новый пароль.");
        return;
      }
      if(f.id==="newPasswordForm"){
        const a=v(f,"newPassword"),b=v(f,"againPassword");
        if(a!==b||a.length<8)throw Error("Пароли не совпадают или слишком короткие");
        await ok(db.auth.updateUser({password:a}));S.recovery=false;history.replaceState(null,"",location.pathname);const {data:{user}}=await db.auth.getUser();if(user)await enter(user);notify("Пароль обновлён");return;
      }
      if(f.id==="profileForm"||f.id==="coachProfileForm"){await saveProfile(f);return}
      if(f.id==="weightForm"){await saveWeight(f);return}
      if(f.id==="linkForm"){
        const consultant_id=v(f,"code");
        if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultant_id))throw Error("Проверьте код консультанта");
        if(consultant_id===S.user.id)throw Error("Нельзя подключить себя");
        await ok(db.from("nd_links").insert({client_id:S.user.id,consultant_id}));
        notify("Консультант подключён");await loadLinks();return;
      }
      if(f.id==="waterForm"){const water=Number(v(f,"water"));if(!Number.isInteger(water)||water<0||water>15000)throw Error("Проверьте количество воды");await saveWater(water);notify("Вода сохранена");return}
      if(f.id==="dayForm"){
        await ok(db.from("nd_days").upsert({client_id:S.user.id,log_date:S.date,water_ml:num(S.day?.water_ml),activity_minutes:Number(v(f,"activity")||0),wake_time:v(f,"wake")||null,bedtime:v(f,"sleep")||null,wellbeing:v(f,"wellbeing")===""?null:Number(v(f,"wellbeing")),notes:v(f,"notes"),updated_at:new Date().toISOString()},{onConflict:"client_id,log_date"}));
        notify("Итоги дня сохранены");await loadDay();return;
      }
      if(f.id==="mealForm"){
        const file=f.elements.namedItem("photo")?.files?.[0];
        if(!file)throw Error("Добавьте фото питания");
        if(file.size>24*1024*1024)throw Error("Фото слишком большое. Выберите другое.");
        const processed=await photoToJpeg(file);
        const day=S.day||await ok(db.from("nd_days").insert({client_id:S.user.id,log_date:S.date}).select().single());
        const path=`${S.user.id}/${S.date}/${crypto.randomUUID()}.jpg`;
        const {error:uploadError}=await db.storage.from("nd-meal-photos").upload(path,processed,{contentType:"image/jpeg",upsert:false});
        if(uploadError)throw uploadError;
        try{
          await ok(db.from("nd_meals").insert({day_id:day.id,meal_type:v(f,"type"),eaten_at:v(f,"time")||null,description:v(f,"description"),portion_g:v(f,"portion")?Number(v(f,"portion")):null,protein_g:Number(v(f,"protein")),photo_path:path}));
        }catch(e){await db.storage.from("nd-meal-photos").remove([path]);throw e}
        S.openMeal=false;notify("Запись сохранена");await loadDay();return;
      }
      if(f.classList.contains("mealReviewForm")){
        await ok(db.from("nd_meal_reviews").upsert({meal_id:f.dataset.id,consultant_id:S.user.id,rating:v(f,"rating")||"good",comment:v(f,"comment"),updated_at:new Date().toISOString()},{onConflict:"meal_id,consultant_id"}));
        notify("Оценка сохранена");await loadDay();return;
      }
      if(f.id==="dayReviewForm"){
        await ok(db.from("nd_day_reviews").upsert({day_id:S.day.id,consultant_id:S.user.id,rating:v(f,"rating")||"good",comment:v(f,"comment")||"Проверено",updated_at:new Date().toISOString()},{onConflict:"day_id,consultant_id"}));
        notify("Проверка завершена");await loadDay();return;
      }
    });
  });
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-action]");if(!b)return;
    const action=b.dataset.action;
    if(["login","register","reset"].includes(action)){S.authMode=action;render();return}
    if(action==="tab"){S.tab=b.dataset.tab;S.openMeal=false;render();return}
    if(action==="openMeal"){S.mealType=b.dataset.type||"breakfast";S.openMeal=true;render();document.getElementById("newEntry")?.scrollIntoView({behavior:"smooth",block:"start"});return}
    if(action==="closeMeal"){S.openMeal=false;render();return}
    guarded(async()=>{
      if(action==="logout"){await db.auth.signOut();S.user=null;render();return}
      if(action==="clientMode"){S.mode="client";S.tab="diary";S.openMeal=false;await loadDay();return}
      if(action==="coachMode"){S.mode="coach";S.tab="diary";S.openMeal=false;await loadDay();return}
      if(action==="chooseClient"){S.selected=b.dataset.id;S.tab="diary";await loadDay();return}
      if(action==="prevDay"||action==="nextDay"){S.date=dateAdd(S.date,action==="prevDay"?-1:1);S.openMeal=false;await loadDay();return}
      if(action==="waterQuick"){await saveWater(num(S.day?.water_ml)+Number(b.dataset.ml));return}
      if(action==="copyCode"){try{await navigator.clipboard.writeText(S.user.id);notify("Код скопирован")}catch{notify("Скопируйте код вручную")}return}
      if(action==="unlink"){
        if(!confirm("Отключить консультанта?"))return;
        await ok(db.from("nd_links").delete().eq("client_id",S.user.id).eq("consultant_id",b.dataset.id));
        notify("Консультант отключён");await loadLinks();return;
      }
      if(action==="deleteMeal"){
        if(!confirm("Удалить запись о питании?"))return;
        const meal=S.meals.find(m=>m.id===b.dataset.id);
        await ok(db.from("nd_meals").delete().eq("id",b.dataset.id));
        if(meal?.photo_path)await db.storage.from("nd-meal-photos").remove([meal.photo_path]);
        notify("Запись удалена");await loadDay();return;
      }
    });
  });
  document.addEventListener("change",e=>{
    if(e.target.id==="diaryDate"&&e.target.value)guarded(async()=>{S.date=e.target.value;S.openMeal=false;await loadDay()});
    if(e.target.matches('input[name="photo"]')){
      const file=e.target.files?.[0],preview=document.getElementById("photoPreview");
      if(preview){preview.replaceChildren();if(file){const img=document.createElement("img");const u=URL.createObjectURL(file);img.src=u;img.alt="Выбранное фото";img.onload=()=>URL.revokeObjectURL(u);preview.append(img);preview.hidden=false}else preview.hidden=true}
    }
  });
  try{
    db.auth.onAuthStateChange((event,session)=>{
      if(event==="PASSWORD_RECOVERY"){S.recovery=true;S.user=session?.user||S.user;render()}
      else if(event==="SIGNED_OUT"){S.user=null;S.recovery=false;render()}
    });
    const {data:{session},error}=await db.auth.getSession();if(error)throw error;
    if(recoveryErrorFromUrl){
      S.recovery=false;S.authMode="reset";
      history.replaceState(null,"",location.pathname);
      render();
      notify("Ссылка восстановления недействительна или устарела. Запросите новое письмо.");
    }else if(S.recovery){
      if(session?.user){
        S.user=session.user;render();
      }else{
        S.recovery=false;S.authMode="reset";render();
        notify("Не удалось подтвердить ссылку. Запросите новое письмо и откройте его только один раз.");
      }
    }else if(session?.user){
      await enter(session.user);
    }else{
      render();
    }
  }catch(e){showError(e);root.innerHTML=`<div class="auth-screen"><div class="auth-card"><h1>Не удалось открыть дневник</h1><p>${esc(e.message||String(e))}</p><button class="primary" onclick="location.reload()">Повторить</button></div></div>`}
})();