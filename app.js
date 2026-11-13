(async function app(){
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.0');
  const db=createClient('https://xprobrrrpybmzbucakws.supabase.co','sb_publishable_UETDRxFcw79NwwBmvjI4sw_7F5y5B28');
  const $=(s)=>document.querySelector(s);
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const d0=()=>new Date().toLocaleDateString('sv-SE');
  const names={breakfast:'Завтрак',snack1:'Перекус',lunch:'Обед',snack2:'Полдник',dinner:'Ужин',other:'Другое'};
  const emo={breakfast:'☀️',snack1:'🍎',lunch:'🥗',snack2:'🥜',dinner:'🌙',other:'🍽️'};
  const status={good:'✅ Хорошо',improve:'✏️ Исправить'};
  const S={user:null,profile:null,view:'diary',mode:'client',date:d0(),links:[],linked:[],profiles:{},selected:null,day:null,meals:[],mealReviews:[],dayReviews:[],plans:[],planMeals:[],activePlan:null,foods:[],photo:{},pending:false,register:false,resetRequest:false,recovery:new URLSearchParams(location.hash.replace(/^#/, '')).get('type')==='recovery',loginEmail:''};
  const field=(name,label,value='',type='text',extra='')=>'<label class="field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
  const area=(name,label,value='',extra='')=>'<label class="field"><span>'+label+'</span><textarea name="'+name+'" '+extra+'>'+esc(value)+'</textarea></label>';
  const opts=(selected='breakfast')=>Object.entries(names).map(([v,n])=>'<option value="'+v+'"'+(v===selected?' selected':'')+'>'+n+'</option>').join('');
  const fmt=x=>x?x.slice(0,5):'';
  const val=(form,name)=>form.elements.namedItem(name)?.value?.trim()||'';
  const isoPlus=(dt,n)=>{const [y,m,d]=dt.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10);};
  const nameFor=id=>S.profiles[id]?.display_name||'Участник';
  const who=()=>S.mode==='client'?S.user.id:S.selected;
  const err=x=>{
    const message=x?.message||String(x)||'Неизвестная ошибка';
    if(/Invalid login credentials/i.test(message))return 'Неверная почта или пароль. Нажмите «Забыли пароль?», чтобы восстановить доступ.';
    if(/Email not confirmed/i.test(message))return 'Электронная почта ещё не подтверждена. Проверьте письмо о регистрации.';
    if(/rate limit|too many requests/i.test(message))return 'Слишком много попыток. Попробуйте немного позже.';
    return message;
  };
  let timer;
  function toast(text){const t=$('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>t.classList.remove('show'),4400);}
  async function check(p){const {data,error}=await p;if(error)throw error;return data;}
  async function run(fn){if(S.pending)return;S.pending=true;try{await fn();}catch(e){console.error(e);toast('Ошибка: '+err(e));}finally{S.pending=false;}}
  function mainView(){
    if(S.recovery){
      $('#app').innerHTML='<div class="auth"><div class="auth-card"><div class="symbol">🔐</div><h1>Новый пароль</h1><p>Создайте новый пароль для входа в дневник питания.</p><form id="newPasswordForm">'+field('newPassword','Новый пароль','','password','required minlength="8" autocomplete="new-password"')+field('confirmPassword','Повторите пароль','','password','required minlength="8" autocomplete="new-password"')+'<button class="btn primary fill">Сохранить пароль</button></form><p class="subtle">Используйте не менее 8 символов. Никому не отправляйте пароль.</p></div></div>';
      return;
    }
    if(!S.user){
      const forgot=S.resetRequest;
      $('#app').innerHTML='<div class="auth"><div class="auth-card"><div class="symbol">✳</div><h1>Дневник питания</h1><p>Заполняйте дневник, получайте рекомендации и следите за полезными привычками.</p><h2>'+(forgot?'Восстановление пароля':S.register?'Регистрация':'Вход')+'</h2>'+(forgot?'<p>Введите почту, на которую зарегистрирован аккаунт. Отправим ссылку для создания нового пароля.</p><form id="resetRequestForm">'+field('email','Электронная почта',S.loginEmail,'email','required autocomplete="email"')+'<button class="btn primary fill">Отправить ссылку</button></form><button class="link" data-action="resetBack">← Вернуться ко входу</button>':'<form id="authForm">'+(S.register?field('name','Ваше имя','','text','required maxlength="120"'):'')+field('email','Электронная почта',S.loginEmail,'email','required autocomplete="email"')+field('password','Пароль','','password','required minlength="6" autocomplete="'+(S.register?'new-password':'current-password')+'"')+'<button class="btn primary fill">'+(S.register?'Зарегистрироваться':'Войти')+'</button></form><button class="link" data-action="authToggle">'+(S.register?'Уже есть аккаунт? Войти':'Нет аккаунта? Зарегистрироваться')+'</button>'+(S.register?'':'<button class="link" data-action="forgotPassword">Забыли пароль?</button>'))+'<p class="subtle">Данные о питании доступны только вам и консультанту, которого вы подключите.</p></div></div>';
      return;
    }
    $('#app').innerHTML='<div class="layout"><header><div class="brand"><div class="symbol">✳</div><div><strong>ДНЕВНИК ПИТАНИЯ</strong><small>Nutrition Studio</small></div></div><button class="btn small" data-action="logout">Выход</button></header><section class="hero"><span>ВАШ ПУТЬ К ПОЛЕЗНЫМ ПРИВЫЧКАМ</span><h1>'+(S.mode==='client'?'Мой дневник питания':'Кабинет консультанта')+'</h1><p>'+(S.mode==='client'?'Записывайте, что едите, и получайте персональные рекомендации.':'Проверяйте дневники клиентов и отмечайте, что получается хорошо.')+'</p></section><div class="modebar"><button data-action="clientMode" class="mode '+(S.mode==='client'?'active':'')+'">📔 Мой дневник</button><button data-action="coachMode" class="mode '+(S.mode==='coach'?'active':'')+'">👩‍💼 Я консультант</button></div><div class="columns"><main><nav><button data-action="tab" data-tab="diary" class="'+(S.view==='diary'?'active':'')+'">Дневник</button><button data-action="tab" data-tab="plans" class="'+(S.view==='plans'?'active':'')+'">План питания</button><button data-action="tab" data-tab="foods" class="'+(S.view==='foods'?'active':'')+'">Продукты</button></nav>'+(S.view==='diary'?diaryView():S.view==='plans'?plansView():foodsView())+'</main><aside>'+sideView()+'</aside></div><footer>Дневник питания · Данные хранятся в защищённой базе</footer></div>';
  }
  function sideView(){
    let t='<section class="card"><h3>👤 Мой профиль</h3><form id="profileForm">'+field('name','Имя',S.profile?.display_name||'','text','required maxlength="120"')+'<button class="btn small">Сохранить имя</button></form></section>';
    if(S.mode==='client'){
      t+='<section class="card"><h3>🤝 Мой консультант</h3><p class="muted">Введите код консультанта, чтобы поделиться с ним дневником.</p><form id="linkForm">'+field('code','Код консультанта','','text','required')+'<button class="btn primary fill">Подключить</button></form>';
      S.linked.forEach(l=>{t+='<div class="client-line"><span>'+esc(nameFor(l.consultant_id))+'</span><button class="link" data-action="unlink" data-id="'+l.consultant_id+'">Отключить</button></div>';});
      t+='</section>';
    }else{
      t+='<section class="card"><h3>🔗 Мой код консультанта</h3><p class="muted">Отправьте этот код клиенту. Он подключит вас самостоятельно.</p><div class="code">'+esc(S.user.id)+'</div><button class="btn small" data-action="copyCode">Копировать код</button></section>';
      t+='<section class="card"><h3>👥 Мои клиенты</h3>';
      t+=S.links.length?S.links.map(l=>'<button class="client-line '+(S.selected===l.client_id?'selected':'')+'" data-action="selectClient" data-id="'+l.client_id+'">'+esc(nameFor(l.client_id))+' <span>→</span></button>').join(''):'<p class="muted">Пока никто не подключился. Поделитесь кодом выше.</p>';
      t+='</section>';
    }
    t+='<section class="card"><h3>🌿 Небольшие шаги каждый день</h3><p class="muted">Отмечайте питание без чувства вины. Главное — наблюдать за привычками и постепенно их улучшать.</p></section>';
    return t;
  }
  function diaryView(){
    if(S.mode==='coach'&&!S.selected)return '<section class="card empty">👥<h2>Выберите клиента</h2><p>Когда клиент подключит вас по коду, он появится в списке справа.</p></section>';
    const coach=S.mode==='coach';
    let t='<section class="card"><div class="head"><div><h2>'+(coach?'Дневник: '+esc(nameFor(S.selected)):'Мой дневник')+'</h2><p class="muted">Питание, вода, активность и самочувствие</p></div><div class="datebox"><button class="btn small" data-action="prevDate">←</button><input id="chosenDate" type="date" value="'+S.date+'"><button class="btn small" data-action="nextDate">→</button></div></div>';
    if(S.day){
      t+='<div class="stats"><div class="stat"><b>'+Number(S.day.water_ml||0)+' мл</b><small>Вода</small></div><div class="stat"><b>'+S.meals.reduce((a,m)=>a+Number(m.protein_g||0),0).toFixed(1)+' г</b><small>Белок (введён)</small></div><div class="stat"><b>'+Number(S.day.activity_minutes||0)+' мин</b><small>Движение</small></div></div>';
      if(S.day.wellbeing!==null)t+='<p class="muted">Самочувствие: '+esc(String(S.day.wellbeing))+' из −5 … +5</p>';
      if(S.day.notes)t+='<div class="remark"><strong>Заметка клиента</strong><p>'+esc(S.day.notes)+'</p></div>';
    }else t+='<p class="muted">На эту дату итогов дня ещё нет.</p>';
    t+='</section>';
    if(!coach){
      t+='<section class="card"><h2>🫗 Итоги дня</h2><form id="dayForm"><div class="grid">'+field('water','Выпито воды, мл',S.day?.water_ml??0,'number','min="0" max="15000" required')+field('activity','Активность, мин',S.day?.activity_minutes??0,'number','min="0" max="1440" required')+field('wake','Время подъёма',fmt(S.day?.wake_time),'time')+field('bedtime','Время сна',fmt(S.day?.bedtime),'time')+'</div><label class="field"><span>Самочувствие за день</span><select name="wellbeing"><option value="">Не выбрано</option>'+Array.from({length:11},(_,i)=>i-5).map(n=>'<option value="'+n+'"'+(S.day?.wellbeing===n?' selected':'')+'>'+n+(n===-5?' — Ужасно':n===5?' — Великолепно':n===0?' — Нейтрально':'')+'</option>').join('')+'</select></label>'+area('notes','Изменения в самочувствии и заметки',S.day?.notes||'')+'<button class="btn primary">Сохранить итоги</button></form></section>';
      t+='<section class="card"><h2>➕ Записать приём пищи</h2><form id="mealForm"><div class="grid"><label class="field"><span>Приём пищи</span><select name="mealType">'+opts()+'</select></label>'+field('mealTime','Время','','time')+'</div>'+area('description','Что вы ели и пили','','required placeholder="Например: гречка, курица, овощи"')+'<div class="grid">'+field('portion','Порция, г (если знаете)','','number','min="0.1" max="20000" step="0.1"')+field('protein','Белок, г (если знаете)','','number','min="0" max="3000" step="0.1"')+'</div><label class="field"><span>Фото еды (необязательно, до 5 МБ)</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label><button class="btn primary">Добавить запись</button></form></section>';
    }
    t+='<section class="card"><h2>🍽️ Приёмы пищи</h2>';
    t+=S.meals.length?S.meals.map(mealView).join(''):'<div class="empty">🥗<p>Пока нет записей о еде на выбранную дату.</p></div>';
    t+='</section>';
    if(coach&&S.day){
      const review=S.dayReviews.find(r=>r.consultant_id===S.user.id);
      t+='<section class="card"><h2>📝 Общая рекомендация за день</h2><form id="summaryForm">'+area('comment','Что получилось хорошо и что стоит улучшить',review?.comment||'','required')+'<button class="btn primary">Сохранить рекомендацию</button></form></section>';
    }else if(!coach&&S.dayReviews.length){
      t+='<section class="card"><h2>💬 Рекомендации за день</h2>';
      S.dayReviews.forEach(r=>{t+='<div class="remark"><strong>'+esc(nameFor(r.consultant_id))+'</strong><p>'+esc(r.comment)+'</p></div>';});
      t+='</section>';
    }
    return t;
  }
  function mealView(m){
    const reviews=S.mealReviews.filter(r=>r.meal_id===m.id);
    let t='<article class="meal"><div class="meal-header"><div><strong>'+emo[m.meal_type]+' '+(names[m.meal_type]||'Приём пищи')+'</strong><span>'+esc(fmt(m.eaten_at))+'</span></div>';
    if(S.mode==='client')t+='<button class="link" data-action="deleteMeal" data-id="'+m.id+'">Удалить</button>';
    t+='</div><div class="meal-name">'+esc(m.description)+'</div>';
    const details=[];if(m.portion_g!==null)details.push('Порция '+esc(m.portion_g)+' г');if(m.protein_g!==null)details.push('Белок '+esc(m.protein_g)+' г');
    if(details.length)t+='<p class="muted">'+details.join(' · ')+'</p>';
    if(S.photo[m.id])t+='<img class="food-photo" alt="Фото приёма пищи" src="'+esc(S.photo[m.id])+'">';
    reviews.forEach(r=>{t+='<div class="remark '+esc(r.rating)+'"><strong>'+status[r.rating]+' · '+esc(nameFor(r.consultant_id))+'</strong><p>'+esc(r.comment||'Без комментария')+'</p></div>';});
    if(S.mode==='coach'){
      const own=reviews.find(r=>r.consultant_id===S.user.id);
      const selected=S.ratingDraft?.[m.id]||own?.rating||'good';
      t+='<form class="ratingForm" data-meal="'+m.id+'"><div class="rating-controls"><label><input type="radio" name="rating" value="good" '+(selected==='good'?'checked':'')+'> ✅ Хорошо</label><label><input type="radio" name="rating" value="improve" '+(selected==='improve'?'checked':'')+'> ✏️ Исправить</label></div>'+area('comment','Комментарий консультанта',own?.comment||'','placeholder="Похвалите или подскажите, что изменить"')+'<button class="btn primary small">Сохранить оценку</button></form>';
    }
    return t+'</article>';
  }
  function plansView(){
    if(S.mode==='coach'&&!S.selected)return '<section class="card empty"><p>Выберите клиента для составления плана питания.</p></section>';
    let t='<section class="card"><h2>📅 Индивидуальные планы питания</h2>';
    if(S.mode==='coach')t+='<p class="muted">Создайте план для '+esc(nameFor(S.selected))+'</p><form id="planForm">'+field('title','Название плана','Мой план питания','','required maxlength="120"')+'<div class="grid">'+field('start','Дата начала',S.date,'date','required')+'<label class="field"><span>Продолжительность</span><select name="length"><option value="7">7 дней</option><option value="21">21 день</option><option value="30">30 дней</option></select></label></div>'+area('notes','Рекомендации к плану')+'<button class="btn primary">Создать план</button></form>';
    t+='</section>';
    if(!S.plans.length)return t+'<section class="card empty">📆<p>Планов пока нет.</p></section>';
    t+='<section class="card"><h2>Мои планы</h2><label class="field"><span>Выберите план</span><select id="selectedPlan">'+S.plans.map(p=>'<option value="'+p.id+'"'+(p.id===S.activePlan?' selected':'')+'>'+esc(p.title)+' · '+esc(p.start_date)+' — '+esc(p.end_date)+'</option>').join('')+'</select></label>';
    const p=S.plans.find(x=>x.id===S.activePlan);
    if(p){
      t+='<div class="remark"><p>'+esc(p.notes||'Индивидуальный план питания')+'</p></div>';
      if(S.mode==='coach')t+='<form id="planMealForm"><h3>Добавить блюдо в план</h3><div class="grid">'+field('plannedFor','Дата',p.start_date,'date','required min="'+p.start_date+'" max="'+p.end_date+'"')+'<label class="field"><span>Приём пищи</span><select name="mealType">'+opts()+'</select></label>'+field('atTime','Время','','time')+field('portionNote','Порция (описание)')+'</div>'+area('description','Что запланировано','','required')+'<button class="btn primary">Добавить блюдо</button></form>';
      const days={};S.planMeals.forEach(m=>{(days[m.planned_for]??=[]).push(m);});
      t+='<div class="plan-list">';
      for(const [date,arr] of Object.entries(days).sort())t+='<div class="plan-day"><strong>'+esc(date.split('-').reverse().join('.'))+'</strong>'+arr.map(m=>'<p>'+(names[m.meal_type]||'Приём пищи')+' '+esc(fmt(m.at_time))+' · '+esc(m.description)+(m.portion_note?' · '+esc(m.portion_note):'')+(S.mode==='coach'?' <button class="link" data-action="deletePlanMeal" data-id="'+m.id+'">Удалить</button>':'')+'</p>').join('')+'</div>';
      if(!Object.keys(days).length)t+='<p class="muted">Добавьте блюда в план, чтобы они появились по дням.</p>';
      t+='</div>';
    }
    return t+'</section>';
  }
  function foodsView(){
    let t='<section class="card"><h2>🥬 Моя база продуктов</h2><p class="muted">Введите значения КБЖУ на 100 г с этикетки продукта. Они не рассчитываются автоматически.</p><form id="foodForm">'+field('name','Название продукта','','text','required maxlength="160"')+'<div class="grid">'+field('kcal','Ккал','','number','step=".1" min="0"')+field('protein','Белки, г','','number','step=".1" min="0"')+field('fat','Жиры, г','','number','step=".1" min="0"')+field('carbs','Углеводы, г','','number','step=".1" min="0"')+'</div><button class="btn primary">Сохранить продукт</button></form></section>';
    t+='<section class="card"><h2>Сохранённые продукты</h2>';
    t+=S.foods.length?S.foods.map(f=>'<div class="client-line"><div><strong>'+esc(f.name)+'</strong><p class="muted">'+esc(f.kcal_per_100g??'—')+' ккал · Б '+esc(f.protein_per_100g??'—')+' · Ж '+esc(f.fat_per_100g??'—')+' · У '+esc(f.carbs_per_100g??'—')+'</p></div><button class="link" data-action="deleteFood" data-id="'+f.id+'">Удалить</button></div>').join(''):'<p class="muted">Добавьте первый продукт.</p>';
    return t+'</section>';
  }
  async function load(){
    if(!S.user){mainView();return;}
    const id=S.user.id;
    const [links,linked,foods]=await Promise.all([
      check(db.from('nd_links').select('*').eq('consultant_id',id)),
      check(db.from('nd_links').select('*').eq('client_id',id)),
      check(db.from('nd_foods').select('*').eq('owner_id',id).order('name'))
    ]);
    S.links=links;S.linked=linked;S.foods=foods;
    const ids=[...new Set([...links.map(x=>x.client_id),...linked.map(x=>x.consultant_id)])];
    const people=ids.length?await check(db.from('nd_profiles').select('id,display_name').in('id',ids)):[];
    S.profiles=Object.fromEntries(people.map(p=>[p.id,p]));
    if(!links.some(l=>l.client_id===S.selected))S.selected=links[0]?.client_id||null;
    await loadDay();
  }
  async function loadDay(){
    const id=who();S.day=null;S.meals=[];S.mealReviews=[];S.dayReviews=[];S.plans=[];S.planMeals=[];S.photo={};
    if(id){
      const [day,plans]=await Promise.all([
        check(db.from('nd_days').select('*').eq('client_id',id).eq('log_date',S.date).maybeSingle()),
        check(db.from('nd_plans').select('*').eq('client_id',id).order('start_date',{ascending:false}).limit(40))
      ]);
      S.day=day;S.plans=plans;
      if(day){
        S.meals=await check(db.from('nd_meals').select('*').eq('day_id',day.id).order('eaten_at',{ascending:true}));
        const ids=S.meals.map(m=>m.id);
        const [revs,dayRevs]=await Promise.all([
          ids.length?check(db.from('nd_meal_reviews').select('*').in('meal_id',ids)):Promise.resolve([]),
          check(db.from('nd_day_reviews').select('*').eq('day_id',day.id))
        ]);
        S.mealReviews=revs;S.dayReviews=dayRevs;
      }
      if(!plans.some(p=>p.id===S.activePlan))S.activePlan=plans[0]?.id||null;
      if(S.activePlan)S.planMeals=await check(db.from('nd_plan_meals').select('*').eq('plan_id',S.activePlan).order('planned_for').order('at_time'));
    }
    mainView();
    const pictured=S.meals.filter(m=>m.photo_path);
    if(pictured.length){
      const res=await Promise.all(pictured.map(async m=>{
        const {data,error}=await db.storage.from('nd-meal-photos').createSignedUrl(m.photo_path,1200);
        return [m.id,error?null:data.signedUrl];
      }));
      S.photo=Object.fromEntries(res.filter(([,url])=>url));mainView();
    }
  }
  async function enter(user){
    S.user=user;
    let p=await check(db.from('nd_profiles').select('*').eq('id',user.id).maybeSingle());
    if(!p){
      const n=String(user.user_metadata?.display_name||user.email?.split('@')[0]||'Участник').slice(0,120);
      p=await check(db.from('nd_profiles').insert({id:user.id,display_name:n}).select().single());
    }
    S.profile=p;await load();
  }
  document.addEventListener('submit',e=>{
    if(!(e.target instanceof HTMLFormElement))return;
    e.preventDefault();const f=e.target;
    run(async()=>{
      if(f.id==='resetRequestForm'){
        S.loginEmail=val(f,'email');
        const {error}=await db.auth.resetPasswordForEmail(S.loginEmail,{redirectTo:window.location.origin+window.location.pathname});
        if(error)throw error;
        S.resetRequest=false;S.register=false;mainView();
        toast('Если этот адрес зарегистрирован, письмо со ссылкой для сброса отправлено. Проверьте также папку «Спам».');
        return;
      }
      if(f.id==='newPasswordForm'){
        const password=val(f,'newPassword'),repeat=val(f,'confirmPassword');
        if(password.length<8)throw Error('Пароль должен содержать не менее 8 символов');
        if(password!==repeat)throw Error('Пароли не совпадают');
        const {data:{user},error:userError}=await db.auth.getUser();
        if(userError||!user)throw Error('Ссылка для восстановления недействительна или устарела. Запросите новую ссылку.');
        const {error}=await db.auth.updateUser({password});
        if(error)throw error;
        S.recovery=false;S.resetRequest=false;S.register=false;S.user=user;
        history.replaceState(null,'',window.location.pathname+window.location.search);
        await enter(user);toast('Пароль изменён. Вы вошли в дневник.');
        return;
      }
      if(f.id==='authForm'){
        const email=val(f,'email'),password=val(f,'password');S.loginEmail=email;
        if(S.register){
          const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:val(f,'name')},emailRedirectTo:window.location.origin+window.location.pathname}});
          if(error)throw error;
          if(data.session)await enter(data.user);else toast('Подтвердите регистрацию по ссылке в почте, затем войдите.');
        }else{
          const {data,error}=await db.auth.signInWithPassword({email,password});
          if(error)throw error;
          await enter(data.user);
        }return;
      }
      if(f.id==='profileForm'){S.profile=await check(db.from('nd_profiles').update({display_name:val(f,'name')}).eq('id',S.user.id).select().single());toast('Имя сохранено');mainView();return;}
      if(f.id==='linkForm'){
        const consultant_id=val(f,'code');
        if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultant_id))throw Error('Неверный формат кода');
        if(consultant_id===S.user.id)throw Error('Нельзя подключить себя');
        await check(db.from('nd_links').insert({client_id:S.user.id,consultant_id}));toast('Консультант подключён');await load();return;
      }
      if(f.id==='dayForm'){
        await check(db.from('nd_days').upsert({client_id:S.user.id,log_date:S.date,water_ml:Number(val(f,'water')),activity_minutes:Number(val(f,'activity')),wake_time:val(f,'wake')||null,bedtime:val(f,'bedtime')||null,wellbeing:val(f,'wellbeing')===''?null:Number(val(f,'wellbeing')),notes:val(f,'notes'),updated_at:new Date().toISOString()},{onConflict:'client_id,log_date'}));
        toast('Итоги сохранены');await loadDay();return;
      }
      if(f.id==='mealForm'){
        let day=S.day;
        if(!day)day=await check(db.from('nd_days').upsert({client_id:S.user.id,log_date:S.date},{onConflict:'client_id,log_date'}).select().single());
        const meal=await check(db.from('nd_meals').insert({day_id:day.id,meal_type:val(f,'mealType'),eaten_at:val(f,'mealTime')||null,description:val(f,'description'),portion_g:val(f,'portion')?Number(val(f,'portion')):null,protein_g:val(f,'protein')?Number(val(f,'protein')):null}).select().single());
        const file=f.elements.namedItem('photo')?.files?.[0];
        if(file){
          if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)toast('Запись сохранена, но фото должно быть JPG/PNG/WebP до 5 МБ');
          else{
            const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
            const path=S.user.id+'/'+S.date+'/'+crypto.randomUUID()+'.'+extension;
            const {error}=await db.storage.from('nd-meal-photos').upload(path,file,{contentType:file.type,upsert:false});
            if(error)toast('Запись сохранена, но фото не загрузилось');
            else await check(db.from('nd_meals').update({photo_path:path}).eq('id',meal.id));
          }
        }
        toast('Приём пищи сохранён');await loadDay();return;
      }
      if(f.classList.contains('ratingForm')){
        const meal_id=f.dataset.meal;
        await check(db.from('nd_meal_reviews').upsert({meal_id,consultant_id:S.user.id,rating:val(f,'rating')||'good',comment:val(f,'comment'),updated_at:new Date().toISOString()},{onConflict:'meal_id,consultant_id'}));
        toast('Оценка сохранена');await loadDay();return;
      }
      if(f.id==='summaryForm'){
        const comment=val(f,'comment');if(!comment)throw Error('Напишите рекомендацию');
        await check(db.from('nd_day_reviews').upsert({day_id:S.day.id,consultant_id:S.user.id,comment,updated_at:new Date().toISOString()},{onConflict:'day_id,consultant_id'}));
        toast('Рекомендация сохранена');await loadDay();return;
      }
      if(f.id==='planForm'){
        const length=Number(val(f,'length')),start_date=val(f,'start');
        const p=await check(db.from('nd_plans').insert({client_id:S.selected,consultant_id:S.user.id,title:val(f,'title'),start_date,end_date:isoPlus(start_date,length-1),notes:val(f,'notes')}).select().single());
        S.activePlan=p.id;toast('План создан');await loadDay();return;
      }
      if(f.id==='planMealForm'){
        const p=S.plans.find(x=>x.id===S.activePlan),date=val(f,'plannedFor');
        if(!p||date<p.start_date||date>p.end_date)throw Error('Дата не входит в план');
        await check(db.from('nd_plan_meals').insert({plan_id:p.id,planned_for:date,meal_type:val(f,'mealType'),at_time:val(f,'atTime')||null,description:val(f,'description'),portion_note:val(f,'portionNote')}));
        toast('Блюдо добавлено');await loadDay();return;
      }
      if(f.id==='foodForm'){
        const v=n=>val(f,n)?Number(val(f,n)):null;
        await check(db.from('nd_foods').insert({owner_id:S.user.id,name:val(f,'name'),kcal_per_100g:v('kcal'),protein_per_100g:v('protein'),fat_per_100g:v('fat'),carbs_per_100g:v('carbs')}));
        toast('Продукт сохранён');await load();return;
      }
    });
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='chosenDate')run(async()=>{S.date=e.target.value;await loadDay();});
    if(e.target.id==='selectedPlan')run(async()=>{S.activePlan=e.target.value;await loadDay();});
  });
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');if(!btn)return;
    const act=btn.dataset.action,id=btn.dataset.id;
    if(act==='authToggle'){S.register=!S.register;mainView();return;}
    if(act==='forgotPassword'){S.loginEmail=document.querySelector('input[name="email"]')?.value?.trim()||S.loginEmail;S.register=false;S.resetRequest=true;mainView();return;}
    if(act==='resetBack'){S.resetRequest=false;S.register=false;mainView();return;}
    if(act==='tab'){S.view=btn.dataset.tab;mainView();return;}
    run(async()=>{
      if(act==='logout'){await db.auth.signOut();S.user=null;mainView();}
      if(act==='clientMode'){S.mode='client';S.view='diary';await loadDay();}
      if(act==='coachMode'){S.mode='coach';S.view='diary';await loadDay();}
      if(act==='selectClient'){S.selected=id;S.view='diary';await loadDay();}
      if(act==='prevDate'){S.date=isoPlus(S.date,-1);await loadDay();}
      if(act==='nextDate'){S.date=isoPlus(S.date,1);await loadDay();}
      if(act==='copyCode'){try{await navigator.clipboard.writeText(S.user.id);toast('Код скопирован');}catch{toast('Выделите и скопируйте код вручную');}}
      if(act==='unlink'&&confirm('Отключить консультанта?')){await check(db.from('nd_links').delete().eq('client_id',S.user.id).eq('consultant_id',id));toast('Консультант отключён');await load();}
      if(act==='deleteMeal'&&confirm('Удалить запись о еде?')){
        const meal=S.meals.find(m=>m.id===id);await check(db.from('nd_meals').delete().eq('id',id));if(meal?.photo_path)await db.storage.from('nd-meal-photos').remove([meal.photo_path]);toast('Запись удалена');await loadDay();
      }
      if(act==='deletePlanMeal'&&confirm('Удалить блюдо из плана?')){await check(db.from('nd_plan_meals').delete().eq('id',id));await loadDay();}
      if(act==='deleteFood'&&confirm('Удалить продукт?')){await check(db.from('nd_foods').delete().eq('id',id));await load();}
    });
  });
  try{
    db.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){S.recovery=true;S.resetRequest=false;S.user=session?.user||S.user;mainView();}else if(event==='SIGNED_OUT'){S.user=null;S.recovery=false;mainView();}});
    const {data:{session},error}=await db.auth.getSession();if(error)throw error;
    if(session?.user){if(S.recovery){S.user=session.user;mainView();}else await enter(session.user);}else mainView();
  }catch(e){console.error(e);$('#app').innerHTML='<div class="auth"><div class="auth-card"><h2>Не удалось открыть приложение</h2><p>'+esc(err(e))+'</p><button class="btn primary" onclick="location.reload()">Повторить</button></div></div>';}
})();