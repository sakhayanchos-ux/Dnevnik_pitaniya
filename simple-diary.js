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
  const COACH_URL=APP_URL+"consultant/";
  const isCoachApp=/\/consultant(?:\/|\/index\.html)?$/.test(location.pathname);
  const assetRoot=isCoachApp?"../":"./";
  const PUSH_PUBLIC="BIvUd8m3MabngQ6DcST3cq3HuJeeIWnw0r-nQEB0JnYytcU7yHDhBWez9iYn1KW2O_qlHuVueNXRF9y8OAUbBYc";
  const SW_PATH=new URL("./sw.js",location.href).href;
  const pathDate=callbackQuery.get("date");
  const initialDate=/^\d{4}-\d{2}-\d{2}$/.test(pathDate||"")?pathDate:null;
  const root=document.getElementById("app");
  const toastEl=document.getElementById("toast");
  const mealNames={breakfast:"Завтрак",snack1:"Первый перекус",lunch:"Обед",snack2:"Второй перекус",dinner:"Ужин",snack3:"Вечерний перекус",other:"Другое"};
  const slots=[["breakfast","01"],["snack1","02"],["lunch","03"],["snack2","04"],["dinner","05"],["snack3","06"]];

  // Reference values are approximate grams of protein per 100 g of the named
  // food in the stated prepared form. Recipes and brand labels can differ.
  const commonFoods=[
    ["macaroni","Макароны отварные",5.8,"Готовый продукт"],
    ["meat-cutlet","Котлета мясная домашняя",16,"Зависит от рецепта"],
    ["chicken-cutlet","Котлета куриная домашняя",18,"Зависит от рецепта"],
    ["chicken","Куриная грудка готовая",31,"После приготовления"],
    ["buckwheat","Гречка отварная",3.4,"На воде"],
    ["rice","Рис отварной",2.7,"Готовый продукт"],
    ["egg","Яйцо варёное",12.6,"Без скорлупы"],
    ["cottage","Творог 5%",17,"Уточните по этикетке"],
    ["milk","Молоко",3.2,"Уточните по этикетке"],
    ["kefir","Кефир",3.0,"Уточните по этикетке"],
    ["yogurt","Йогурт натуральный",3.5,"Без добавок"],
    ["cheese","Сыр твёрдый",25,"Зависит от сорта"],
    ["beef","Говядина готовая",26,"Без добавок"],
    ["fish","Рыба запечённая",21,"Зависит от вида"],
    ["salmon","Лосось запечённый",22,"Готовый продукт"],
    ["potato","Картофель отварной",2,"Без добавок"],
    ["broccoli","Брокколи отварная",2.4,"Готовый продукт"],
    ["porridge","Овсяная каша на воде",2.4,"Готовый продукт"],
    ["beans","Фасоль варёная",8.7,"Готовый продукт"],
    ["lentils","Чечевица варёная",9,"Готовый продукт"],
    ["bread","Хлеб пшеничный",8.5,"Зависит от марки"],
    ["banana","Банан",1.1,"Съедобная часть"],
    ["apple","Яблоко",0.3,"Съедобная часть"],
    ["chicken-soup","Суп куриный домашний",3,"Зависит от рецепта"]
  ].map(([id,name,protein,note])=>({id:"ref:"+id,name,protein:Number(protein),source:"Ориентир",note}));


  // Source: user's saved "Конструктор наборов — КБЖУ и цена" (Sep 2026).
  // Row schema: id, title, category, serving unit, kcal, protein, fat, carbs, quality.
  // quality "i" means incomplete; "d" means estimated/derived in source.
  const herbalifeReference=[["f1-chicken","Коктейль Формула 1 — Куриный крем-суп","Питание","1 порция",90,9.5,2,8.6,""],["f1-vanilla","Коктейль Формула 1 — Ваниль","Питание","1 порция",90,10,1.5,9,""],["f1-coconut","Коктейль Формула 1 — Кокос","Питание","1 порция",95,10,2,8.5,""],["f1-banana","Коктейль Формула 1 — Банан в карамели","Питание","1 порция",90,10,1.5,9,""],["f1-mango","Коктейль Формула 1 — Манго","Питание","1 порция",90,10,1.5,9,""],["f1-melon","Коктейль Формула 1 — Дыня","Питание","1 порция",90,9.5,1.5,9,""],["f1-strawberry","Коктейль Формула 1 — Клубника","Питание","1 порция",90,10,1.5,9,""],["f1-chocolate","Коктейль Формула 1 — Нежный шоколад","Питание","1 порция",100,9,2.5,8.5,""],["f1-cookie","Коктейль Формула 1 — Хрустящее печенье","Питание","1 порция",100,9,2.5,8.5,""],["coffee","Протеиновый кофе Латте Макиато","Питание","1 порция",80,15,1,3,""],["evening","Вечерний коктейль Формула 1","Питание","1 порция",93,10,0.6,10.6,""],["f3","Формула 3 — протеиновая смесь","Питание","1 порция",25,5,0.3,0.2,""],["bake","Протеиновая смесь для выпечки","Питание","1 ложка",44.5,5.3,0.9,3.7,"d"],["tea-classic","Травяной напиток — Классический, 51 г","Напитки","1 порция",6,0,0,0,""],["tea-lemon","Травяной напиток — Лимон, 51 г","Напитки","1 порция",6,0,0,0,""],["tea-rasp","Травяной напиток — Малина, 51 г","Напитки","1 порция",6,0,0,0,""],["tea-mango","Травяной напиток — Манго-питахайя, 51 г","Напитки","1 порция",6,0,0,0,""],["tea-classic102","Травяной напиток Классический, 102 г","Напитки","1 порция",6,0,0,0,""],["aloe-mango","Растительный напиток Алоэ — Манго","Напитки","1 порция",4,0.1,0.2,0.5,""],["aloe-classic","Растительный напиток Алоэ — Классика","Напитки","1 порция",4,0.1,0.2,0.5,""],["aloe-cran","Растительный напиток Алоэ — Клюква","Напитки","1 порция",4,0.1,0.2,0.5,""],["oat-apple","Овсяно-яблочный напиток","Напитки","1 порция",15,0.1,0,0.5,""],["fiber","Комплекс пищевых волокон","Напитки","1 порция",16,0,0,0,"i"],["bar-lemon","Протеиновый батончик «Лимонный»","Перекусы","1 шт.",140,10,4,15,""],["bites-vanilla","Bites — Ваниль в хрустящей карамели","Перекусы","1 шт.",60,4,2.5,6.5,""],["bites-lemon","Bites — Лимон в хрустящей карамели","Перекусы","1 шт.",65,4,2.5,6.5,""],["express-dark","Батончик Формула 1 Экспресс — Тёмный шоколад","Перекусы","1 шт.",207,14,6,21,""],["express-cran","Батончик Формула 1 Экспресс — Клюква и белый шоколад","Перекусы","1 шт.",210,16,6.5,21,""],["chips-bbq","Протеиновые чипсы — Барбекю","Перекусы","1 пакетик",130,11,4.5,11,""],["chips-onion","Протеиновые чипсы — Сметана и лук","Перекусы","1 пакетик",130,12,5,11,""],["thermo","Термо Комплит","БАД","1 таблетка",0,0,0,0,"i"],["phyto","Фито Комплит","БАД","1 капсула",0,0,0,0,"i"],["cell-act","Клеточный Активатор","БАД","1 капсула",2,0,0,0,"i"],["celluloss","Cell-u-loss","БАД","1 таблетка",5,0,0,0,""],["niteworks","Найтворкс","БАД","1 порция",27,5.1,0.3,0.5,"d"],["greenmax","Грин Макс Селект","БАД","1 порция",50,3,0.4,6.3,""],["nightmode","Найт Мод","БАД","1 порция",10,0,0,0,"i"],["collagen","Коллаген Бьюти Комплекс","БАД","1 порция",20.4,2.25,0,0,""],["collagen-bovine","Коллаген Бьюти Комплекс (говяжий)","БАД","1 порция",20.4,2.25,0,0,""],["microbiotic","Микробиотик Макс","БАД","1 пакетик",0,0,0,0,"d"],["herbalifeline","Гербалайфлайн Макс","БАД","1 капсула",10,0,0,0,"i"],["liftoff","Лифтофф — Апельсин","БАД","1 таблетка",9,0,0,0,"i"],["schizandra","Шизандра Эдванс","БАД","1 порция",5,0,0,0,"i"],["nrg","Чай N-R-G","БАД","1 порция",4,0,0,0,"i"],["f2-men","Формула 2 — для мужчин","БАД","1 таблетка",0,0,0,0,"i"],["f2-women","Формула 2 — для женщин","БАД","1 таблетка",0,0,0,0,"i"],["xtracal","ЭкстраКаль Эдванс","БАД","1 порция",6,0,0,0,"i"],["immune","Иммьюн Бустер","БАД","1 пакетик",0,0,0,0,"d"],["h24-cookie","Протеиновый батончик H24 — Печенье","H24","1 шт.",200,21,6,24,""],["h24-dark","Протеиновый батончик H24 — Тёмный шоколад","H24","1 шт.",210,21,7.5,22,""],["cr7","CR7 Drive","H24","1 порция",95,0,0,23,""],["rebuild","H24 Восстановление силы","H24","1 порция",190,25,1.5,18,""]].map(([id,name,cat,unit,kcal,protein,fat,carbs,quality])=>
    ({id,name,cat,unit,kcal,protein,fat,carbs,quality}));
  const herbalifeRefById=Object.fromEntries(herbalifeReference.map(row=>[row.id,row]));
  const featuredReferences=["f1-vanilla","f1-chocolate","f1-strawberry","f1-cookie","f1-melon","f1-coconut","f1-mango","f1-banana",null,"f1-chicken",null,"evening","f3","coffee",null,"aloe-classic","aloe-mango","aloe-cran","tea-classic","tea-lemon",null,"tea-rasp","tea-mango","nrg","collagen","niteworks","nightmode","cr7","liftoff","greenmax","immune","oat-apple","microbiotic","rebuild","bar-lemon","h24-cookie","express-cran"];
  const makeBrand=(id,name,group,aliases,ref)=>{
    const hasMacros=!!ref&&ref.quality!=="i";
    return {id:"hl:"+id,name,group,aliases,source:"Herbalife",unit:"serving",
      servingUnit:ref?.unit||"1 порция",referenceId:ref?.id||null,
      sourceQuality:ref?ref.quality||"saved":'missing',
      protein:hasMacros?ref.protein:null,
      proteinPerServing:hasMacros?ref.protein:null,
      fatPerServing:hasMacros?ref.fat:null,
      carbsPerServing:hasMacros?ref.carbs:null,
      kcalPerServing:ref?ref.kcal:null,
      note:hasMacros?"Данные из вашего справочника КБЖУ":"Значения по этикетке"
    };
  };
  const featuredHerbalife=[["1","Формула 1 — ваниль","shake","ф1 кпв"],["2","Формула 1 — нежный шоколад","shake","ф1 кпв"],["3","Формула 1 — клубника","shake","ф1 кпв"],["4","Формула 1 — хрустящее печенье","shake","ф1 кпв"],["5","Формула 1 — дыня","shake","ф1 кпв"],["6","Формула 1 — кокос","shake","ф1 кпв"],["7","Формула 1 — манго","shake","ф1 кпв"],["8","Формула 1 — банан в карамели","shake","ф1 кпв"],["9","Формула 1 — кофе латте","shake","ф1 кпв"],["10","Формула 1 — куриный крем-суп","savory","ф1"],["11","Формула 1 — грибной крем-суп","savory","ф1"],["12","Формула 1 — вечерний коктейль","evening","ф1"],["13","Формула 3 — протеиновая смесь","shake","ф3 f3 протеин"],["14","Протеиновый кофе — Латте Макиато","shake","кофе"],["15","Томатный суп с базиликом","savory","суп"],["16","Растительный напиток Алоэ — классический","drink","aloe"],["17","Растительный напиток Алоэ — манго","drink","aloe"],["18","Растительный напиток Алоэ — клюква","drink","aloe"],["19","Травяной напиток — классический","drink","чай"],["20","Травяной напиток — лимон","drink","чай"],["21","Травяной напиток — персик","drink","чай"],["22","Травяной напиток — малина","drink","чай"],["23","Травяной напиток — манго-питахайя","drink","чай"],["24","Напиток N-R-G","drink","nrg"],["25","Collagen Beauty Complex — коллаген","evening","collagen"],["26","Найтворкс / Niteworks","evening","night works"],["27","Найт Мод","evening","ночной"],["28","CR7 DRIVE / СиАр","drink","cr7"],["29","LIFTOFF — напиток","drink","лифтофф"],["30","Грин Макс Select","drink","greenmax"],["31","Иммьюн Бустер","drink","иммун"],["32","Овсяно-яблочный напиток","drink","оян"],["33","Микробиотик Макс","other","микробиотик"],["34","H24 — Восстановление силы","shake","спортивный"],["35","Протеиновый батончик — лимонный","snack","батончик"],["36","Протеиновый батончик H24 — печенье","snack","батончик"],["37","Батончик Формула 1 Экспресс — клюква и белый шоколад","snack","батончик"]].map(([id,name,group,aliases],index)=>
    makeBrand(id,name,group,aliases,herbalifeRefById[featuredReferences[index]]));
  const sourceOnlyHerbalife=herbalifeReference.filter(item=>!featuredReferences.includes(item.id)).map(item=>{
    const group=item.cat==="Перекусы"?"snack":item.cat==="Напитки"?"drink":item.cat==="H24"?"shake":item.cat==="Питание"?"shake":"other";
    return makeBrand("source-"+item.id,item.name,group,"",item);
  });
  const herbalifeFoods=[...featuredHerbalife,...sourceOnlyHerbalife];
  const extraOrdinaryFoods=[["1","Омлет из 2 яиц",12,"breakfast"],["2","Яичница",12.5,"breakfast"],["3","Омлет с молоком",10,"breakfast"],["4","Белок яичный готовый",11,"breakfast"],["5","Творог 0–2%",18,"breakfast"],["6","Творог 9%",16,"breakfast"],["7","Творожная запеканка",11,"breakfast"],["8","Сырники",12,"breakfast"],["9","Сыр плавленый",13,"breakfast"],["10","Сыр моцарелла",22,"breakfast"],["11","Греческий йогурт",9,"breakfast"],["12","Скир",11,"breakfast"],["13","Йогурт питьевой",3,"breakfast"],["14","Ряженка",3,"breakfast"],["15","Молоко 1,5%",3,"breakfast"],["16","Молоко 2,5%",3,"breakfast"],["17","Соевый напиток",3.3,"breakfast"],["18","Хлеб цельнозерновой",9,"breakfast"],["19","Хлеб ржаной",6.6,"breakfast"],["20","Лаваш",8,"breakfast"],["21","Мюсли без добавок",10,"breakfast"],["22","Овсяные хлопья сухие",12,"breakfast"],["23","Овсяная каша на молоке",3.5,"breakfast"],["24","Гречневая каша на молоке",3.8,"breakfast"],["25","Пшённая каша на молоке",3.4,"breakfast"],["26","Рисовая каша на молоке",3,"breakfast"],["27","Блинчики",6,"breakfast"],["28","Оладьи",6,"breakfast"],["29","Арахисовая паста",25,"breakfast"],["30","Авокадо",2,"breakfast"],["31","Котлета из индейки",18,"lunch"],["32","Котлета из говядины",17,"lunch"],["33","Котлета из свинины",16,"lunch"],["34","Куриное филе отварное",29,"lunch"],["35","Куриное бедро запечённое",25,"lunch"],["36","Индейка запечённая",29,"lunch"],["37","Говядина тушёная",25,"lunch"],["38","Свинина тушёная",24,"lunch"],["39","Печень куриная готовая",23,"lunch"],["40","Печень говяжья готовая",26,"lunch"],["41","Фрикадельки мясные",15,"lunch"],["42","Тефтели с рисом",13,"lunch"],["43","Гуляш мясной",18,"lunch"],["44","Плов с курицей",8,"lunch"],["45","Плов с говядиной",8,"lunch"],["46","Пельмени отварные",10,"lunch"],["47","Вареники с творогом",9,"lunch"],["48","Вареники с картофелем",4,"lunch"],["49","Спагетти отварные",5.5,"lunch"],["50","Булгур отварной",3.1,"lunch"],["51","Кускус отварной",3.8,"lunch"],["52","Перловка отварная",2.5,"lunch"],["53","Пшено отварное",3.5,"lunch"],["54","Картофельное пюре",2,"lunch"],["55","Картофель запечённый",2.5,"lunch"],["56","Картофель жареный",3,"lunch"],["57","Рис бурый отварной",2.6,"lunch"],["58","Гречка зелёная отварная",3.4,"lunch"],["59","Суп овощной",1.5,"lunch"],["60","Куриный суп с лапшой",3.8,"lunch"],["61","Борщ с мясом",4,"lunch"],["62","Щи с капустой",2,"lunch"],["63","Суп с фрикадельками",4.5,"lunch"],["64","Чечевичный суп",5,"lunch"],["65","Суп-пюре из тыквы",1.2,"lunch"],["66","Салат из свежих овощей",1.2,"lunch"],["67","Салат с курицей",8,"lunch"],["68","Оливье",5,"lunch"],["69","Винегрет",1.4,"lunch"],["70","Треска запечённая",23,"dinner"],["71","Минтай запечённый",19,"dinner"],["72","Хек запечённый",19,"dinner"],["73","Горбуша запечённая",24,"dinner"],["74","Форель запечённая",24,"dinner"],["75","Тунец консервированный в собственном соку",25,"dinner"],["76","Сардины консервированные",23,"dinner"],["77","Креветки отварные",24,"dinner"],["78","Кальмар отварной",18,"dinner"],["79","Мидии готовые",20,"dinner"],["80","Тофу",8,"dinner"],["81","Темпе",19,"dinner"],["82","Нут отварной",8.9,"dinner"],["83","Горох отварной",5.4,"dinner"],["84","Фасоль красная отварная",8.7,"dinner"],["85","Фасоль белая отварная",9,"dinner"],["86","Стручковая фасоль",2,"dinner"],["87","Цветная капуста",2,"dinner"],["88","Кабачки тушёные",1.2,"dinner"],["89","Баклажан запечённый",1.2,"dinner"],["90","Шпинат готовый",3,"dinner"],["91","Морковь варёная",0.8,"dinner"],["92","Свёкла варёная",1.6,"dinner"],["93","Шампиньоны готовые",3,"dinner"],["94","Горошек зелёный",5.4,"dinner"],["95","Кукуруза варёная",3.4,"dinner"],["96","Помидоры",0.9,"dinner"],["97","Огурцы",0.7,"dinner"],["98","Сладкий перец",1,"dinner"],["99","Листья салата",1.3,"dinner"],["100","Орехи миндаль",21,"snack"],["101","Орехи грецкие",15,"snack"],["102","Фундук",15,"snack"],["103","Кешью",18,"snack"],["104","Семечки тыквенные",30,"snack"],["105","Семечки подсолнечные",21,"snack"],["106","Арахис",26,"snack"],["107","Финики",2,"snack"],["108","Изюм",3.1,"snack"],["109","Курага",3.4,"snack"],["110","Груша",0.4,"snack"],["111","Апельсин",0.9,"snack"],["112","Мандарин",0.8,"snack"],["113","Киви",1.1,"snack"],["114","Ягоды клубники",0.7,"snack"],["115","Малина",1.2,"snack"],["116","Черника",0.7,"snack"],["117","Смузи фруктовый",0.8,"snack"],["118","Кефир 1%",3,"snack"],["119","Творожный десерт",8,"snack"]].map(([id,name,protein,group])=>({
    id:"ref:extra-"+id,name,protein:Number(protein),group,source:"Ориентир",
    unit:"g",note:"Примерно; уточните по рецепту/упаковке"
  }));

  const eveningOptions=["Коллаген","Вечерний коктейль","СиАр","Nightworks"];
  const foodKey=x=>String(x||"").toLocaleLowerCase("ru-RU").replace(/ё/g,"е").trim();
  const foodDefaultCategory=meal=>["breakfast","snack1","snack2","snack3"].includes(meal)?"herbalife":"ordinary";
  const foodCatalog=()=>[
    ...herbalifeFoods,
    ...commonFoods.map(f=>({...f,unit:"g",group:/яйц|омлет|каша|творог|молок|сыр|йогурт|кефир|хлеб/i.test(f.name)?"breakfast":/суп|котлет|макарон|гречка|рис|говядина|куриная грудка/i.test(f.name)?"lunch":"snack"})),
    ...extraOrdinaryFoods,
    ...S.foods.map(f=>({id:"mine:"+f.id,name:f.name,protein:Number(f.protein_per_100g),source:"Мой продукт",unit:"g",group:"other",note:"По данным пользователя"}))
  ];
  const foodById=id=>foodCatalog().find(f=>f.id===id);

  const macro2=n=>Math.round(n*100)/100;
  const macroText=n=>Number(n).toLocaleString("ru-RU",{maximumFractionDigits:2});
  const foodMacroValue=(food,metric)=>{
    if(food.unit==="serving"){
      const prop={protein:"proteinPerServing",fat:"fatPerServing",carbs:"carbsPerServing",kcal:"kcalPerServing"}[metric];
      const per=food[prop];
      return Number.isFinite(per)&&Number.isFinite(food.servings)?macro2(per*food.servings):null;
    }
    if(metric==="protein")return macro2(food.protein*food.grams/100);
    return null;
  };
  const foodProteinValue=food=>foodMacroValue(food,"protein");
  const foodMacroTotal=metric=>{
    if(!S.foodSelection.length||S.foodSelection.some(food=>foodMacroValue(food,metric)===null))return null;
    return macro2(S.foodSelection.reduce((sum,food)=>sum+foodMacroValue(food,metric),0));
  };
  const brandMacrosHTML=food=>{
    const kcal=foodMacroValue(food,"kcal"),fat=foodMacroValue(food,"fat"),carbs=foodMacroValue(food,"carbs"),protein=foodMacroValue(food,"protein");
    if(kcal===null&&fat===null&&carbs===null&&protein===null)return '<span class="macro-missing">БЖУ не заполнены в справочнике — проверьте упаковку.</span>';
    return '<span class="macro-pill">Б '+(protein===null?"—":macroText(protein))+' г</span>'+
      '<span class="macro-pill">Ж '+(fat===null?"—":macroText(fat))+' г</span>'+
      '<span class="macro-pill">У '+(carbs===null?"—":macroText(carbs))+' г</span>'+
      '<span class="macro-pill">'+(kcal===null?"—":macroText(kcal))+' ккал</span>';
  };

  const missingBrandProteins=()=>S.foodSelection.filter(f=>f.unit==="serving"&&!Number.isFinite(f.proteinPerServing));
  const proteinFromSelection=()=>Math.round(S.foodSelection.reduce((sum,f)=>sum+(foodProteinValue(f)||0),0)*10)/10;
  const mealFoodMatch=food=>{
    const group=food.group||"other";
    if(S.mealType==="breakfast")return group==="shake"||group==="breakfast"?0:group==="drink"?1:group==="snack"?2:4;
    if(S.mealType==="snack3")return group==="evening"?0:group==="drink"?1:group==="shake"?2:3;
    if(S.mealType==="snack1"||S.mealType==="snack2")return group==="snack"?0:group==="shake"?1:group==="drink"?2:3;
    return ["lunch","dinner","savory"].includes(group)?0:group==="shake"?2:3;
  };

  function foodSearchItems(query=""){
  const term=foodKey(query);
  const tokens=term.split(/\s+/).filter(Boolean);
  const items=foodCatalog().filter(food=>{
    if(!term&&S.foodFilter==="herbalife")return food.source==="Herbalife";
    if(!term&&S.foodFilter==="ordinary")return food.source==="Ориентир";
    if(!term&&S.foodFilter==="mine")return food.source==="Мой продукт";
    const hay=foodKey(food.name+" "+(food.aliases||"")+" "+(food.note||"")+" "+food.source+(food.source==="Herbalife"?" гербалайф":""));
    return tokens.every(t=>hay.includes(t));
  });
  items.sort((a,b)=>{
    if(term){
      const prefix=food=>foodKey(food.name).startsWith(term)?-5:0;
      return prefix(a)-prefix(b)||Number(a.source!=="Herbalife")-Number(b.source!=="Herbalife")||a.name.localeCompare(b.name,"ru");
    }
    if(S.foodFilter==="all"&&["breakfast","snack1","snack2","snack3"].includes(S.mealType)){
      const d=Number(a.source!=="Herbalife")-Number(b.source!=="Herbalife");
      if(d)return d;
    }
    return mealFoodMatch(a)-mealFoodMatch(b)||a.name.localeCompare(b.name,"ru");
  });
  const shown=items.slice(0,40);
  if(!shown.length)return '<p class="food-empty">Не нашли продукт? Добавьте свой по этикетке ниже.</p>';
  return shown.map(food=>{
    const brand=food.source==="Herbalife";
    return `<button type="button" class="food-option ${brand?"is-herbalife":""}" data-action="chooseFood" data-food="${esc(food.id)}"><span>${esc(food.name)}<small>${brand?(food.sourceQuality==="missing"||food.sourceQuality==="i"?"Herbalife · уточните по упаковке":"Herbalife · "+macroText(food.proteinPerServing)+" г белка на порцию"):food.source==="Мой продукт"?"Мой справочник":food.note}</small></span><b>${brand?(food.kcalPerServing===null?"По упаковке":macroText(food.kcalPerServing)+" ккал"):(Number(food.protein).toLocaleString("ru-RU")+" г / 100 г")}</b></button>`;
  }).join("")+(items.length>shown.length?`<p class="food-more">Найдено ${items.length}. Введите название для точного поиска.</p>`:"");
}
  function foodCategoryButtons(){
  const cats=[["herbalife","Herbalife"],["ordinary","Обычные"],["all","Все"],["mine","Мои"]];
  return cats.map(([key,label])=>`<button type="button" data-action="foodCategory" data-category="${key}" class="${S.foodFilter===key?"active":""}" aria-pressed="${S.foodFilter===key}">${label}</button>`).join("");
}
  function foodPicker(){
  const hint=S.mealType==="breakfast"?"Формула 1, Формула 3, алоэ, чай…":S.mealType==="snack3"?"Коллаген, вечерний коктейль, Nightworks…":"Продукт Herbalife или обычная еда…";
  return `<div class="food-picker">
    <span class="food-picker-label">Выбрать продукт или блюдо</span>
    <button type="button" class="food-picker-trigger" data-action="toggleFoodSearch" aria-controls="foodPickerDropdown" aria-expanded="${S.foodOpen}"><span>${hint}</span><span class="food-picker-arrow">${S.foodOpen?"⌃":"⌄"}</span></button>
    <div class="food-picker-dropdown" id="foodPickerDropdown" ${S.foodOpen?"":"hidden"}>
      <div class="field food-search-field"><label for="foodSearch">Напишите название продукта</label><span class="food-search-control"><input id="foodSearch" type="text" inputmode="search" enterkeyhint="search" placeholder="Например: Формула 1 или котлета" autocomplete="off" value="${esc(S.foodTerm)}"><button type="button" class="food-search-clear" data-action="clearFoodSearch" aria-label="Очистить поиск" title="Очистить поиск" ${S.foodTerm?"":"hidden"}>×</button></span></div>
      <div class="food-category-tabs" id="foodCategories">${foodCategoryButtons()}</div>
      <div class="food-search-items" id="foodSearchResults">${foodSearchItems(S.foodTerm)}</div>
    </div>
  </div>`;
}
  function foodSelectedItems(){
  return S.foodSelection.map((food,index)=>{
    if(food.unit==="serving"){
      const amount=foodProteinValue(food);
      const known=Number.isFinite(food.proteinPerServing)&&food.sourceQuality!=="missing"&&food.sourceQuality!=="i";
      const quality=food.sourceQuality==="d"?"Расчётные значения из сохранённого справочника":food.sourceQuality==="i"?"В справочнике неполные БЖУ":known?"Данные из вашего справочника КБЖУ":"Данные с упаковки";
      return `<div class="food-selected-row food-selected-serving">
        <div class="food-selected-head"><strong>${esc(food.name)}</strong><button type="button" class="food-remove" data-action="removeFood" data-index="${index}" aria-label="Убрать ${esc(food.name)}">×</button></div>
        <div class="food-serving-controls">
          <label><span>Порций</span><input class="food-serving-count" data-index="${index}" type="number" min=".1" max="100" step="any" inputmode="decimal" value="${food.servings}"></label>
          ${known?`<div class="food-serving-known"><span>Белок на 1 порцию</span><b>${macroText(food.proteinPerServing)} г</b></div>`:
            `<label><span>Белок на 1 порцию, г</span><input class="food-serving-protein" data-index="${index}" type="number" min="0" max="300" step="any" inputmode="decimal" placeholder="С упаковки" value="${Number.isFinite(food.proteinPerServing)?food.proteinPerServing:""}"></label>`}
          <div class="food-serving-result"><span>Всего белка</span><b class="food-amount-protein">${amount===null?"—":macroText(amount)+" г"}</b></div>
        </div>
        <div class="food-macro-pills">${brandMacrosHTML(food)}</div>
        <p class="food-source-quality">${esc(quality)}. ${food.sourceQuality==="d"?"Уточните значения по этикетке.":food.referenceId?"Без молока и других добавок; их учитывайте отдельно.":""}</p>
      </div>`;
    }
    return `<div class="food-selected-row">
      <span class="food-name">${esc(food.name)}<small>${macroText(food.protein)} г белка / 100 г</small></span>
      <label><span>Граммы</span><input class="food-weight" type="number" inputmode="decimal" min="1" max="20000" step="any" value="${food.grams}" data-index="${index}" aria-label="Масса продукта ${esc(food.name)}"></label>
      <b class="food-amount-protein">${macroText(foodProteinValue(food)||0)} г</b>
      <button type="button" class="food-remove" data-action="removeFood" data-index="${index}" aria-label="Убрать ${esc(food.name)}">×</button>
    </div>`;
  }).join("");
}
  function refreshFoodCalculator(keepInputs=false){
  const selected=document.getElementById("foodSelected");
  if(selected&&!keepInputs)selected.innerHTML=foodSelectedItems();
  if(selected&&keepInputs)selected.querySelectorAll(".food-selected-row").forEach((row,index)=>{
    const item=S.foodSelection[index];
    if(!item)return;
    const value=foodProteinValue(item);
    const total=row.querySelector(".food-amount-protein");
    if(total)total.textContent=value===null?"—":macroText(value)+" г";
    const pills=row.querySelector(".food-macro-pills");
    if(pills&&item.unit==="serving")pills.innerHTML=brandMacrosHTML(item);
  });
  const form=document.getElementById("mealForm");
  const protein=form?.elements.namedItem("protein");
  const result=document.getElementById("foodProteinTotal");
  const missing=missingBrandProteins();
  if(result){
    if(missing.length)result.textContent=`Для ${missing.length} продукта(ов) нет точного белка в справочнике: заполните по упаковке`;
    else if(S.foodSelection.length)result.textContent=`Белок: ${macroText(proteinFromSelection())} г`;
    else result.textContent="Выберите продукт через поиск выше";
  }
  const summary=document.getElementById("foodMacroTotals");
  if(summary){
    const fat=foodMacroTotal("fat"),carbs=foodMacroTotal("carbs"),kcal=foodMacroTotal("kcal");
    summary.textContent=S.foodSelection.length?
      (fat!==null&&carbs!==null&&kcal!==null
        ? `Жиры ${macroText(fat)} г · Углеводы ${macroText(carbs)} г · ${macroText(kcal)} ккал`
        : "Жиры, углеводы и калории будут показаны, когда для всех продуктов есть данные."):"";
  }
  if(protein&&!missing.length){
    if(S.foodSelection.length){protein.value=String(proteinFromSelection());protein.dataset.foodAuto="1";}
    else if(protein.dataset.foodAuto==="1"){protein.value="";protein.dataset.foodAuto="0";}
  }
  const description=form?.elements.namedItem("description");
  if(description&&(!description.value.trim()||description.dataset.foodAuto==="1")){
    description.value=S.foodSelection.map(food=>food.unit==="serving"?`${food.name} — ${food.servings} порц.`:`${food.name} — ${food.grams} г`).join("; ");
    description.dataset.foodAuto="1";
  }
}
  function refreshFoodDropdown(){
  const items=document.getElementById("foodSearchResults");
  if(items)items.innerHTML=foodSearchItems(S.foodTerm);
  const tabs=document.getElementById("foodCategories");
  if(tabs)tabs.innerHTML=foodCategoryButtons();
}
  async function loadPersonalFoods(){
  if(!S.user||isCoachApp)return;
  try{
    const rows=await ok(db.from("nd_foods").select("id,name,protein_per_100g").eq("owner_id",S.user.id).order("name").limit(300));
    S.foods=(rows||[]).filter(row=>row.protein_per_100g!=null);
  }catch(error){console.warn("Личные продукты пока недоступны",error);S.foods=[];}
}
  const ratings={good:"Хорошо",improve:"Улучшить",attention:"Внимание"};
  const icon=(name)=>'<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({
    book:'<rect x="4" y="3.8" width="16" height="16.4" rx="1.8"/><path d="M8.5 3.8v16.4M11.5 8h5M11.5 12h5M11.5 16h3"/>',
    chart:'<path d="M4 19.5h16M6.5 16V10M12 16V5M17.5 16V8"/><path d="M5 18h14"/>',
    user:'<circle cx="12" cy="8.3" r="3.3"/><path d="M5.3 20c.2-3.8 2.7-5.7 6.7-5.7s6.5 1.9 6.7 5.7"/>',
    userMinus:'<circle cx="9" cy="8.1" r="3"/><path d="M2.7 19.3c.2-3.8 2.5-5.6 6.3-5.6 2.1 0 3.8.6 4.8 2"/><path d="M15 12h7"/>',
    drop:'<path d="M12 2.5C9.2 7 6.1 10 6.1 13.7a5.9 5.9 0 0 0 11.8 0C17.9 10 14.8 7 12 2.5Z"/>',
    leaf:'<path d="M20.2 3.8c-8.2-.1-14.5 3.5-14.5 10.1a6.1 6.1 0 0 0 6.1 6.1c6.7 0 9.1-7.1 8.4-16.2Z"/><path d="M4.3 20c3.5-6.3 7.5-8.8 12-11.4"/>',
    camera:'<path d="M3 8.2h4l1.8-2.5h6.4L17 8.2h4v11.2H3Z"/><circle cx="12" cy="13.9" r="3.25"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    send:'<path d="m21 3-8.5 18-2.8-7.7L2 10.5 21 3Z"/><path d="m9.7 13.3 4.8-4.8"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"/>',
    eye:'<path d="M2.3 12s3.5-6.2 9.7-6.2 9.7 6.2 9.7 6.2-3.5 6.2-9.7 6.2S2.3 12 2.3 12Z"/><circle cx="12" cy="12" r="2.7"/>',
    eyeOff:'<path d="M3 3l18 18"/><path d="M10.6 5.9c.5-.1 1-.1 1.4-.1 6.2 0 9.7 6.2 9.7 6.2a16.9 16.9 0 0 1-3 3.6M6.2 7.6A17.2 17.2 0 0 0 2.3 12s3.5 6.2 9.7 6.2c1.1 0 2.1-.2 3-.5"/><path d="M10.5 10.5a2.7 2.7 0 0 0 3 3"/>',
    inbox:'<path d="M4 4h16v15H4V4Z"/><path d="M4 14h5l2 3h2l2-3h5"/>',
    refresh:'<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.5 9a7.2 7.2 0 0 1 12.6-2L20 12M4 12l1.9 5a7.2 7.2 0 0 0 12.6-2"/>'
  }[name]||'')+'</svg>';
  const S={user:null,profile:null,people:{},consultants:[],clients:[],foods:[],foodSelection:[],foodOpen:false,foodFilter:"herbalife",foodTerm:"",mode:isCoachApp?"coach":"client",denied:false,deniedReason:"",consultantCode:null,signupPending:false,pushEnabled:false,tab:isCoachApp?"inbox":"diary",inboxFilter:"pending",inbox:[],submission:null,clientRequest:null,clientRequests:[],clientWeights:{},viewingClient:false,receivedDiary:false,receivedDiaryLoading:false,date:initialDate||localDate(),selected:null,day:null,meals:[],mealReviews:[],dayReviews:[],weights:[],photo:{},openMeal:false,mealType:"breakfast",authMode:"login",recovery:recoveryFromUrl,busy:false,navSeq:0};
  const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=x=>Number(x||0);
  const cleanName=x=>/^(?:phone[._ -]?[0-9+]+|[+0-9][0-9 .-]{7,})$/i.test(String(x||""))?"":String(x||"");
  const fmt=x=>x?String(x).slice(0,5):"";
  const v=(form,name)=>String(form.elements.namedItem(name)?.value??"").trim();
  const notify=m=>{toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>toastEl.classList.remove("show"),4200)};
  const ok=async p=>{const {data,error}=await p;if(error)throw error;return data};
  const showError=e=>{console.error(e);const m=e?.message||String(e);notify(/Invalid login credentials/i.test(m)?"Неверная почта или пароль. Нажмите «Забыли пароль?»":/User already registered/i.test(m)?"Аккаунт уже есть. Выберите «Войти» или восстановите пароль.":/Email not confirmed/i.test(m)?"Подтвердите электронную почту":m)};
  async function guarded(fn){if(S.busy)return;S.busy=true;try{await fn()}catch(e){showError(e)}finally{S.busy=false}}
  function localDate(){return new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Yakutsk"})}
  function dateAdd(date,n){const [y,m,d]=date.split("-").map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10)}
  const currentId=()=>S.mode==="coach"?S.selected:S.user?.id;
  const currentProfile=()=>S.mode==="coach"?S.people[S.selected]:S.profile;
  const who=id=>cleanName(S.people[id]?.display_name)?.trim()||"Имя не указано";
  const proteinGoal=p=>{const w=num(p?.weight_kg),factor={loss:1.4,maintain:1.2,gain:1.6}[p?.goal];return w&&factor?Math.round(w*factor):0};
  const waterGoal=p=>p?.weight_kg?Math.round(num(p.weight_kg)*35):0;
  const dayProtein=()=>Math.round(S.meals.reduce((a,m)=>a+num(m.protein_g),0)*10)/10;
  const reviewStatus=()=>{
    if(!S.meals.length&&!S.day)return "empty";
    if(!S.submission)return "draft";
    const latest=[...S.dayReviews].sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))[0];
    const modified=Math.max(Date.parse(S.day?.updated_at||"")||0,...S.meals.map(m=>Date.parse(m.created_at||"")||0),0);
    return latest&&Date.parse(latest.updated_at)>=modified?"done":"waiting";
  };
  function formField(name,title,type="text",value="",attrs=""){
    if(type==="password"){
      const inputId="auth-password-"+name;
      return `<div class="field password-field"><label class="password-label" for="${inputId}">${esc(title)}</label><div class="password-control"><input id="${inputId}" name="${name}" type="password" value="${esc(value)}" ${attrs}><button class="password-visibility" type="button" data-action="togglePassword" aria-controls="${inputId}" aria-label="Показать пароль" aria-pressed="false">${icon("eye")}<span>Показать</span></button></div></div>`;
    }
    return `<label class="field"><span>${title}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  }
  function authView(){
    if(S.recovery)return `<div class="auth-screen"><div class="auth-card"><div class="logo"><img src="${assetRoot}diary-icon.webp?v=1" alt="Дневник питания" class="app-logo" width="44" height="44"></div><h1>Новый пароль</h1><p>Придумайте пароль для входа в дневник.</p><form id="newPasswordForm">${formField("newPassword","Новый пароль","password","","required minlength=8 autocomplete=new-password")}${formField("againPassword","Повторите пароль","password","","required minlength=8 autocomplete=new-password")}<button class="primary full">Сохранить пароль</button></form></div></div>`;
    const isRegister=S.authMode==="register",isReset=S.authMode==="reset";
    return `<div class="auth-screen"><div class="auth-card"><div class="logo"><img src="${assetRoot}diary-icon.webp?v=1" alt="Дневник питания" class="app-logo" width="44" height="44"></div><h1>${isCoachApp?"Кабинет консультанта":"Дневник питания"}</h1><p>${isCoachApp?"Просматривайте дневники клиентов и оставляйте рекомендации.":"Открой, заполни и получи рекомендации консультанта."}</p><h2>${isReset?"Восстановление пароля":isRegister?isCoachApp?"Регистрация консультанта":"Регистрация":"Вход"}</h2><form id="${isReset?"resetForm":"authForm"}">${isRegister?formField("name","Имя и фамилия","text","","required maxlength=120"):""}${S.signupPending&&!isRegister?'<p class="auth-success-note">Проверьте электронную почту и подтвердите регистрацию. Затем войдите в кабинет консультанта. У вас появится личный код подключения клиентов.</p>':""}${formField("email","Электронная почта","email","","required autocomplete=email")}${isReset?"":formField("password","Пароль","password","","required minlength=6 autocomplete=current-password")}<button class="primary full">${isReset?"Отправить ссылку":isRegister?isCoachApp?"Создать кабинет консультанта":"Зарегистрироваться":"Войти"}</button></form>${isReset?`<details class="recovery-fallback"><summary>Ссылка ведёт на localhost? Войти по ссылке вручную</summary><p>Откройте новое письмо, зажмите кнопку восстановления и выберите «Скопировать ссылку». Не открывайте ссылку. Вставьте её сюда — это безопасный способ завершить восстановление на нашем сайте.</p><form id="linkRecoveryForm"><label class="field"><span>Ссылка из письма</span><textarea name="recoveryLink" rows="3" placeholder="Вставьте ссылку из письма" required autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label><button class="primary full">Продолжить восстановление</button></form><p class="secret-hint">Не отправляйте эту ссылку другим людям.</p></details>`:""}<div class="auth-links">${isReset?'<button data-action="login">← Назад ко входу</button>':`<button data-action="${isRegister?"login":"register"}">${isRegister?"Уже есть аккаунт? Войти":isCoachApp?"Зарегистрироваться":"Создать аккаунт"}</button>${isRegister?"":'<button data-action="reset">Забыли пароль?</button>'}`}</div></div></div>`;
  }
  function top(){
    return `<header class="top"><div class="brand"><span class="logo-mini"><img src="${assetRoot}diary-icon.webp?v=1" alt="Дневник питания" class="app-logo" width="44" height="44"></span><div><strong>${isCoachApp?"Кабинет консультанта":"Дневник питания"}</strong><small>${isCoachApp?"ПРОВЕРКА ПИТАНИЯ":"ЛИЧНЫЙ ЖУРНАЛ"}</small></div></div><button class="quiet" data-action="logout">Выйти</button></header>`;
  }
  function coachPanel(){
    let h=`<section class="coach-panel"><div class="section-title"><h2>Мои клиенты</h2><span>${S.clients.length}</span></div>`;
    if(S.clients.length)h+=`<div class="clients-scroll">${S.clients.map(l=>`<button data-action="chooseClient" data-id="${esc(l.client_id)}" class="${S.selected===l.client_id?"chosen":""}">${esc(who(l.client_id))}</button>`).join("")}</div>`;
    else h+='<p class="subtle">Клиенты появятся здесь после подключения.</p>';
    h+=`<details><summary>Код для подключения клиента</summary><p class="subtle">Отправьте этот код клиенту.</p><div class="copy-code">${esc(S.user.id)}</div><button class="secondary" data-action="copyCode">Скопировать код</button></details></section>`;
    return h;
  }
  function bottom(){
    if(isCoachApp)return `<nav class="bottom-nav coach-nav" aria-label="Разделы"><button data-action="tab" data-tab="inbox" class="${S.tab==="inbox"?"selected":""}">${icon("inbox")}Входящие${S.inbox.filter(x=>x.status==="pending").length?`<span class="nav-count">${S.inbox.filter(x=>x.status==="pending").length}</span>`:""}</button><button data-action="tab" data-tab="diary" class="${S.tab==="diary"?"selected":""}">${icon("book")}Клиенты</button><button data-action="tab" data-tab="results" class="${S.tab==="results"?"selected":""}">${icon("chart")}Прогресс</button><button data-action="tab" data-tab="profile" class="${S.tab==="profile"?"selected":""}">${icon("user")}Мой профиль</button></nav>`;
    return `<nav class="bottom-nav" aria-label="Разделы"><button data-action="tab" data-tab="diary" class="${S.tab==="diary"?"selected":""}">${icon("book")}Дневник</button><button data-action="tab" data-tab="results" class="${S.tab==="results"?"selected":""}">${icon("chart")}Результаты</button><button data-action="tab" data-tab="profile" class="${S.tab==="profile"?"selected":""}">${icon("user")}Профиль</button></nav>`;
  }
  function inboxView(){
  const pending=S.inbox.filter(x=>x.status==="pending").length;
  const done=S.inbox.length-pending;
  const filters=[["pending","Ожидают проверки",pending],["done","Проверенные",done],["all","Все",S.inbox.length]];
  const filtered=S.inbox.filter(x=>S.inboxFilter==="all"||(S.inboxFilter==="pending"?x.status==="pending":x.status==="done"));
  let h=`<section class="inbox-page">
    <div class="inbox-heading"><div><div class="eyebrow">КОНСУЛЬТАНТ</div><h1>Входящие</h1><p>Дневники клиентов для проверки</p></div><button class="inbox-refresh" data-action="refreshInbox" title="Обновить входящие" aria-label="Обновить входящие">${icon("refresh")}</button></div>
    <div class="inbox-stats">
      <div><strong>${pending}</strong><span>Ожидают проверки</span></div>
      <div><strong>${done}</strong><span>Проверенные</span></div>
    </div>
    <div class="inbox-filters" role="group" aria-label="Фильтр дневников">
      ${filters.map(([key,label,count])=>`<button data-action="inboxFilter" data-filter="${key}" class="${S.inboxFilter===key?"selected":""}">${label}<span>${count}</span></button>`).join("")}
    </div>
    <div class="inbox-items">`;
  if(!filtered.length){
    h+=`<div class="inbox-empty">${icon("inbox")}<h2>${S.inboxFilter==="done"?"Пока нет проверенных дневников":S.inboxFilter==="pending"?"Пока нет дневников для проверки":"Здесь появятся дневники клиентов"}</h2><p>${S.clients.length?"Когда клиент отправит дневник или он поступит автоматически в 22:00, запись появится здесь.":"Когда клиент подключится по вашему коду и начнёт заполнять питание, записи появятся здесь."}</p></div>`;
  }else{
    h+=filtered.map(x=>{
      const date=new Date(x.log_date+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});
      const isPending=x.status==="pending";
      return `<button class="inbox-entry" data-action="openInboxDay" data-client="${esc(x.client_id)}" data-date="${esc(x.log_date)}">
        <span class="inbox-entry-mark ${isPending?"unreviewed":"reviewed"}"></span>
        <span class="inbox-entry-copy"><strong>${esc(who(x.client_id))}</strong><span>Дневник питания за ${esc(date)}</span><small>${x.mealCount?`${x.mealCount} ${x.mealCount===1?"приём пищи":"записей о питании"}`:"Записаны итоги дня"}</small></span>
        <span class="inbox-entry-status ${isPending?"pending":"done"}">${isPending?"Ожидает проверки":"Проверено"}${icon("chevron")}</span>
      </button>`;
    }).join("");
  }
  h+=`</div><div class="inbox-footer"><p>Здесь только отправленные дневники: вручную или автоматически в 22:00. Показаны последние 300 записей.</p></div></section>`;
  return h;
}
  function coachClientsView(){
  const clients=[...S.clients].sort((a,b)=>who(a.client_id).localeCompare(who(b.client_id),"ru"));
  let h='<section class="coach-list-page"><div class="eyebrow">КОНСУЛЬТАНТ</div><div class="clients-header"><h1>Мои клиенты</h1><button class="inbox-refresh" data-action="refreshClients" title="Обновить имена клиентов" aria-label="Обновить список клиентов">'+icon("refresh")+'</button></div><p class="subtle">Нажми на имя, чтобы посмотреть клиента или попросить отправить дневник.</p><div class="simple-list">';
  if(!clients.length)h+='<div class="simple-list-empty"><h2>Пока нет клиентов</h2><p>Пригласи их по коду в разделе «Мой профиль».</p></div>';
  else h+=clients.map(l=>{
    const last=S.inbox.find(d=>d.client_id===l.client_id&&d.log_date===localDate());
    const status=!last?"За сегодня не отправлен":last.status==="pending"?"Ожидает проверки":"Проверено";
    return `<button class="simple-client-row" data-action="chooseClient" data-id="${esc(l.client_id)}"><span class="client-monogram">${esc(who(l.client_id).trim().slice(0,1).toLocaleUpperCase("ru"))}</span><span class="client-copy"><strong>${esc(who(l.client_id))}</strong><small>${esc(status)}</small></span>${icon("chevron")}</button>`;
  }).join("");
  return h+"</div></section>";
}

  function coachProgressView(){
  const clients=[...S.clients].sort((a,b)=>who(a.client_id).localeCompare(who(b.client_id),"ru"));
  let h='<section class="coach-list-page"><div class="eyebrow">КОНСУЛЬТАНТ</div><h1>Прогресс клиентов</h1><p class="subtle">Изменения веса каждого клиента. Нажми на имя, чтобы увидеть график.</p><div class="simple-list">';
  if(!clients.length)h+='<div class="simple-list-empty"><h2>Клиенты ещё не подключены</h2><p>Результаты появятся, когда клиенты начнут записывать вес.</p></div>';
  else h+=clients.map(l=>{
    const id=l.client_id,weights=S.clientWeights[id]||[];
    const current=weights.length?Number(weights[weights.length-1].weight_kg):Number(S.people[id]?.weight_kg||0);
    const initial=weights.length?Number(weights[0].weight_kg):current;
    const delta=weights.length>=2?Math.round((current-initial)*10)/10:null;
    const changeText=delta===null?"Нет динамики":`${delta>0?"+":delta<0?"−":""}${Math.abs(delta).toLocaleString("ru-RU")} кг`;
    return `<button class="progress-client-row" data-action="openProgressClient" data-id="${esc(id)}"><span class="progress-client-copy"><strong>${esc(who(id))}</strong><small>${weights.length>1?`Было ${initial.toLocaleString("ru-RU")} кг · сейчас ${current.toLocaleString("ru-RU")} кг`:"Для динамики нужно два взвешивания"}</small></span><span class="progress-client-numbers"><b>${current?current.toLocaleString("ru-RU")+" кг":"Нет веса"}</b><small class="${delta===null?"":delta<0?"weight-lower":delta>0?"weight-higher":""}">${changeText}</small></span>${icon("chevron")}</button>`;
  }).join("");
  return h+"</div></section>";
}

  function coachProfileView(){
  const p=S.profile||{};
  return `<section class="coach-list-page consultant-profile"><div class="eyebrow">КОНСУЛЬТАНТ</div><h1>Мой профиль</h1><p class="subtle">Это имя увидят твои подключённые клиенты.</p><div class="card"><h2>Мои данные</h2><form id="consultantOwnProfileForm">${formField("name","Имя и фамилия","text",cleanName(p.display_name)||"","required maxlength=120")}<label class="field"><span>Электронная почта</span><input type="email" value="${esc(S.user.email||"")}" disabled></label><button class="primary full">Сохранить имя</button></form></div><div class="card"><h2>Код для подключения</h2><p class="subtle">Отправь этот код клиенту. Он введёт его в своём профиле.</p><div class="copy-code coach-invite-code">${esc(S.consultantCode||"Код создаётся…")}</div><button class="primary full" data-action="copyCode">${icon("copy")} Скопировать код</button></div>${pushPanel()}</section>`;
}

  function coachDetailBack(){
  return `<button class="coach-back" data-action="backToList">${icon("chevron")} ${S.receivedDiary?"Ко входящим":S.tab==="results"?"Все результаты":"Все клиенты"}</button>`;
}

  function photoItem(m){
    const reviews=S.mealReviews.filter(r=>r.meal_id===m.id);
    let h=`<div class="food-row">${S.photo[m.id]?`<img alt="Фото еды" loading="lazy" src="${esc(S.photo[m.id])}">`:'<div class="photo-none">Без фото</div>'}<div class="food-body"><small>${esc(fmt(m.eaten_at)||"—")}</small><strong>${esc(m.description)}</strong><span>${m.portion_g!=null?`${esc(m.portion_g)} г · `:""}${m.protein_g!=null?`${esc(m.protein_g)} г белка`:""}</span></div>${S.mode==="client"?`<button class="delete-meal" data-action="deleteMeal" data-id="${esc(m.id)}" aria-label="Удалить">×</button>`:""}</div>`;
    const extraMacros=[m.fat_g!=null?"Ж "+macroText(m.fat_g)+" г":null,m.carbs_g!=null?"У "+macroText(m.carbs_g)+" г":null,m.kcal!=null?macroText(m.kcal)+" ккал":null].filter(Boolean);
    if(extraMacros.length)h+=`<div class="meal-macro-totals">${extraMacros.join(" · ")}</div>`;
    const ingredients=Array.isArray(m.food_breakdown)?m.food_breakdown:[];
    if(ingredients.length)h+=`<div class="meal-ingredients"><span>Из чего рассчитан белок:</span>${ingredients.map(food=>`<span>${esc(food.name)} · ${food.portions!=null?esc(food.portions)+" порц.":esc(food.grams)+" г"} · Б ${food.protein_g==null?"—":macroText(food.protein_g)} г${food.fat_g!=null?" · Ж "+macroText(food.fat_g)+" г":""}${food.carbs_g!=null?" · У "+macroText(food.carbs_g)+" г":""}${food.kcal!=null?" · "+macroText(food.kcal)+" ккал":""}</span>`).join("")}</div>`;
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
  function sendPanel(){
  const sent=!!S.submission,hasMeals=S.meals.length>0,linked=S.consultants.length>0;
  let h='<section class="card send-diary-card"><h2>Отправить дневник</h2>';
  if(sent){
    const method=S.submission.mode==="auto"?"Автоматически в 22:00":"Вручную";
    const when=new Date(S.submission.submitted_at).toLocaleString("ru-RU",{timeZone:"Asia/Yakutsk",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    h+=`<p class="sent-success">${icon("check")} Дневник отправлен консультанту</p><p class="subtle">${method} · ${esc(when)} (Якутск). Если дополнить дневник, консультант увидит новые записи.</p>`;
  }else if(!linked){
    h+='<p class="subtle">Сначала подключи консультанта в своём профиле.</p><button class="primary full" data-action="tab" data-tab="profile">Подключить консультанта</button>';
  }else if(!hasMeals){
    h+='<p class="subtle">Добавь хотя бы один приём пищи с фотографией.</p><button class="primary full" data-action="openMeal" data-type="breakfast">Добавить питание</button>';
  }else{
    h+='<p class="subtle">Дневник сохранён, но ещё не отправлен консультанту.</p><button class="primary full" data-action="sendDiary">'+icon("send")+' Отправить консультанту</button>';
    if(S.date===localDate())h+='<p class="auto-note">Если не отправишь сама, заполненный дневник отправится автоматически в 22:00 по Якутску.</p>';
  }
  return h+'</section>';
}
  function coachClientCard(){
  const id=S.selected,p=S.people[id]||{},today=localDate(),entry=S.inbox.find(x=>x.client_id===id&&x.log_date===today);
  const requested=S.clientRequests.some(x=>x.client_id===id&&x.log_date===today);
  const weight=Number(p.weight_kg)||null,goal={loss:"Снижение веса",maintain:"Поддержание веса",gain:"Набор мышечной массы"}[p.goal]||"Не указана";
  let h=`<section class="client-detail"><div class="eyebrow">МОЙ КЛИЕНТ</div><h1>${esc(who(id))}</h1>
   <div class="card client-contact"><div class="client-facts">
     <div><small>Цель</small><b>${esc(goal)}</b></div>
     <div><small>Текущий вес</small><b>${weight?`${weight.toLocaleString("ru-RU")} кг`:"Не указан"}</b></div>
   </div><div class="request-diary-area"><h2>Дневник за сегодня</h2>
   ${entry?`<p class="sent-success">${icon("check")} ${entry.status==="done"?"Проверено":"Отправлен, ожидает проверки"}</p>
       <button class="primary full" data-action="openInboxDay" data-client="${esc(id)}" data-date="${esc(today)}">Открыть полученный дневник</button>`:
     `<p class="subtle">${requested?"Запрос отправлен в приложение клиента.":"Клиент ещё не отправил дневник."}</p>
       <button class="primary full" data-action="requestDiary" data-id="${esc(id)}" ${requested?"disabled":""}>${icon("send")} ${requested?"Запрос отправлен":"Попросить отправить дневник"}</button>`}
    <p class="auto-note">Заполненный дневник отправится сам в 22:00, если клиент не отправит раньше.</p>
   </div></div>
   <button class="remove-linked-client" data-action="removeClient" data-id="${esc(id)}" type="button">${icon("userMinus")} Удалить из моих клиентов</button>
   </section>`;
  return h;
}
  function diaryView(){
    const coach=S.mode==="coach",p=currentProfile(),wGoal=waterGoal(p),pGoal=proteinGoal(p),water=num(S.day?.water_ml),protein=dayProtein(),wp=wGoal?Math.min(100,Math.round(100*water/wGoal)):0,pp=pGoal?Math.min(100,Math.round(100*protein/pGoal)):0;
    const state=reviewStatus();
    let h=`<div class="page-heading"><div><div class="eyebrow">${coach?"ДНЕВНИК КЛИЕНТА":"МОЙ ДНЕВНИК"}</div><h1>${coach?esc(who(S.selected)):"Привет"+(cleanName(p?.display_name)?`, ${esc(cleanName(p.display_name).split(" ")[0])}`:"")+"!"}</h1><p>Питание, вода и самочувствие за день</p></div><span class="state ${state}">${state==="done"?"Проверено":state==="waiting"?"Отправлено":state==="draft"?"Сохранено":"Нет записей"}</span></div>
      <div class="date-bar"><button data-action="prevDay">‹</button><label><span>Дата дневника</span><input type="date" id="diaryDate" value="${esc(S.date)}"></label><button data-action="nextDay">›</button></div>
      <div class="indicators">
        <section class="indicator"><div class="indicator-title"><strong>${icon("drop")} Вода</strong><span>${wp}%</span></div><div class="graphic">${glassSvg(wp)}<div><b>${water.toLocaleString("ru-RU")} мл</b><small>${wGoal?`из ${wGoal.toLocaleString("ru-RU")} мл`:"Укажите вес"}</small></div></div>
          ${coach?"":`<div class="water-buttons"><button data-action="waterQuick" data-ml="100">+100</button><button data-action="waterQuick" data-ml="200">+200</button><button data-action="waterQuick" data-ml="250">+250</button></div><form id="waterForm" class="water-form"><input type="number" name="water" aria-label="Миллилитры за день" min="0" max="15000" placeholder="0" value=""><button class="secondary">Записать</button></form>`}
        </section>
        <section class="indicator"><div class="indicator-title"><strong>${icon("leaf")} Белок</strong><span>${pp}%</span></div><div class="graphic">${proteinSvg(pp)}<div><b>${protein} г</b><small>${pGoal?`из ${pGoal} г`:"Нет цели"}</small>${pGoal?`<small>Осталось ${Math.max(0,Math.round((pGoal-protein)*10)/10)} г</small>`:""}</div></div><p class="explain">Белок из записей о еде</p></section>
      </div>`;
    if(!coach&&S.clientRequest&&!S.submission){
      const consultant=who(S.clientRequest.consultant_id);
      h+=`<div class="request-banner">${icon("send")}<div><b>Консультант ${esc(consultant)} просит отправить дневник за этот день</b><p>Заполни питание и отправь дневник на проверку.</p></div><button class="secondary" data-action="${S.meals.length?"sendDiary":"openMeal"}" ${S.meals.length?'':'data-type="breakfast"'}>${S.meals.length?"Отправить":"Заполнить"}</button></div>`;
    }
    if(!coach&&(!p?.weight_kg||!p?.goal))h+=`<div class="hint">Укажите вес и цель — рассчитаем воду и белок. <button data-action="tab" data-tab="profile">Открыть профиль →</button></div>`;
    h+=`<section class="meal-section"><div class="section-title"><div><h2>Моё питание</h2><p>Шесть приёмов пищи</p></div>${coach?"":`<button class="primary compact" data-action="openMeal" data-type="breakfast">${icon("camera")} Добавить фото</button>`}</div>`;
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
        <label class="field"><span>Что ели? *</span><textarea name="description" rows="2" maxlength="2000" placeholder="Например, котлета с макаронами" required></textarea></label>

        <div class="food-calculator" id="foodCalculator">
          <h3>Рассчитать белок по продуктам</h3>
          <p>Продукты Herbalife — в первую очередь. Для обычной еды выберите ингредиенты и укажите граммы.</p>
          ${foodPicker()}
          <div id="foodSelected" class="food-selected">${foodSelectedItems()}</div>
          <p class="food-calculated" id="foodProteinTotal">Выберите продукт через поиск выше</p>
          <p class="food-macro-totals" id="foodMacroTotals"></p>
          <p class="food-disclaimer">Расчёт приблизительный: белок зависит от рецепта и приготовления. Для продуктов Herbalife и других марок используйте данные своей упаковки.</p>
          <details class="add-own-food"><summary>Нет продукта? Добавить свой</summary>
            <p>Введите название и белок на 100 г по этикетке. Продукт появится в вашем личном справочнике.</p>
            <label class="field"><span>Название продукта</span><input name="foodName" maxlength="120" placeholder="Например, мой вечерний коктейль"></label>
            <label class="field"><span>Белок на 100 г</span><input name="foodPer100" type="number" inputmode="decimal" min="0" max="100" step=".1" placeholder="По этикетке"></label>
            <button class="secondary" data-action="saveOwnFood" type="button">Сохранить в справочник</button>
          </details>
        </div>
        <div class="two">${formField("time","Время *","time",new Date().toTimeString().slice(0,5),"required")}${formField("protein","Белок, г *","number","","min=0 max=3000 step=any required")}</div>
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
    if(!coach)h+=sendPanel();
    if(coach&&S.day){
      const own=S.dayReviews.find(r=>r.consultant_id===S.user.id);
      h+=`<section class="card"><h2>Проверка консультанта</h2><form id="dayReviewForm"><div class="rating-row">${Object.entries(ratings).map(([key,label])=>`<label class="${key}"><input type="radio" name="rating" value="${key}" ${(own?.rating||"good")===key?"checked":""}>${label}</label>`).join("")}</div><label class="field"><span>Рекомендации (по желанию)</span><textarea name="comment" rows="3" maxlength="4000" placeholder="Что можно улучшить?">${esc(own?.comment==="Проверено"?"":own?.comment||"")}</textarea></label><button class="primary full">Завершить проверку</button></form></section>`;
    }
    if(S.dayReviews.length)h+=`<section class="card"><h2>Рекомендации консультанта</h2>${S.dayReviews.map(r=>`<div class="review-label ${esc(r.rating||"good")}"><b>${esc(who(r.consultant_id))} · ${esc(ratings[r.rating]||"Проверено")}</b>${r.comment&&r.comment!=="Проверено"?`<p>${esc(r.comment)}</p>`:""}</div>`).join("")}</section>`;
    return h;
  }
  function supportsPush(){return ("serviceWorker" in navigator)&&("PushManager" in window)&&("Notification" in window);}
  function pushPublicBytes(){
  const base64=PUSH_PUBLIC.replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(base64+"=".repeat((4-base64.length%4)%4));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
  function pushPanel(){
  const available=supportsPush(), granted=available&&Notification.permission==="granted";
  const denied=available&&Notification.permission==="denied";
  const description=isCoachApp?
    "Новые дневники клиентов будут приходить на телефон, даже когда кабинет закрыт.":
    "Когда консультант попросит отправить дневник, уведомление придёт на телефон, даже если приложение закрыто.";
  let h='<section class="card push-settings"><h2>Push-уведомления</h2><p class="subtle">'+description+'</p>';
  if(!available)h+='<p class="push-hint">На iPhone откройте дневник в Safari, выберите «Поделиться» → «На экран Домой», откройте приложение через его значок и вернитесь сюда.</p>';
  else if(denied)h+='<p class="push-hint">Уведомления заблокированы. Разрешите их для приложения в настройках телефона.</p>';
  else h+='<button class="primary full" data-action="togglePush">'+icon("inbox")+' '+(S.pushEnabled?"Выключить уведомления":"Включить уведомления")+'</button>';
  if(available&&granted&&S.pushEnabled)h+='<p class="push-active">Уведомления включены на этом устройстве.</p>';
  else h+='<p class="push-hint">На iPhone требуется iOS 16.4 или новее и приложение на экране «Домой». Разрешение запрашивается только после нажатия кнопки.</p>';
  return h+"</section>";
}
  async function checkPushSettings(){
  if(!S.user||!supportsPush()||Notification.permission!=="granted")return;
  try{
    const reg=await navigator.serviceWorker.getRegistration(SW_PATH);
    const sub=await reg?.pushManager.getSubscription();
    if(!sub)return;
    const existing=await ok(db.from("nd_push_subscriptions").select("endpoint").eq("endpoint",sub.endpoint).eq("user_id",S.user.id).eq("app_type",isCoachApp?"consultant":"client").maybeSingle());
    if(existing){S.pushEnabled=true;if(S.tab==="profile")render();}
  }catch(err){console.warn("Push status unavailable",err);}
}
  async function unsubscribePush(){
  if(!supportsPush())return;
  const reg=await navigator.serviceWorker.getRegistration(SW_PATH);
  const sub=await reg?.pushManager.getSubscription();
  if(sub){
    await ok(db.from("nd_push_subscriptions").delete().eq("endpoint",sub.endpoint).eq("user_id",S.user.id));
    await sub.unsubscribe();
  }
  S.pushEnabled=false;
}
  async function enablePush(permissionPromise){
  const permission=await permissionPromise;
  if(permission!=="granted")throw Error("Уведомления не разрешены. Проверьте настройки телефона.");
  const reg=await navigator.serviceWorker.register(SW_PATH,{scope:new URL("./",SW_PATH).pathname});
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushPublicBytes()});
  const value=sub.toJSON();
  if(!value.endpoint||!value.keys?.p256dh||!value.keys?.auth)throw Error("Не удалось подключить уведомления. Попробуйте ещё раз.");
  await ok(db.from("nd_push_subscriptions").upsert({
    endpoint:value.endpoint,user_id:S.user.id,app_type:isCoachApp?"consultant":"client",
    p256dh:value.keys.p256dh,auth_secret:value.keys.auth,last_seen_at:new Date().toISOString()
  },{onConflict:"endpoint"}));
  S.pushEnabled=true;
  render();
  notify("Push-уведомления включены");
}
  function profileView(){
    const coach=S.mode==="coach",p=currentProfile();
    let h=`<div class="intro"><h1>${coach?"Профиль клиента":"Мой профиль"}</h1><p>Данные для автоматического расчёта воды и белка</p></div><section class="card"><form id="${coach?"coachProfileForm":"profileForm"}">`;
    if(!coach)h+=formField("name","Имя и фамилия","text",cleanName(p?.display_name)||"","required maxlength=120");
    h+=`${formField("weight","Текущий вес, кг","number",p?.weight_kg??"","min=20 max=500 step=.1")}<label class="field"><span>Моя цель</span><select name="goal"><option value="">Выбрать</option>${[["loss","Снижение веса"],["maintain","Поддержание веса"],["gain","Набор мышечной массы"]].map(([key,label])=>`<option value="${key}" ${p?.goal===key?"selected":""}>${label}</option>`).join("")}</select></label>${formField("target","Желаемый вес, кг (при снижении или наборе)","number",p?.target_weight_kg??"","min=20 max=500 step=.1")}<button class="primary full">Сохранить профиль</button></form></section>`;
    if(!coach)h+=`<section class="card"><h2>Мой консультант</h2>${S.consultants.length?
        '<p class="subtle">Вы прикреплены к консультанту. Только он видит ваши отправленные дневники.</p>':
        '<p class="subtle">Введите личный код своего консультанта (10 символов), чтобы он мог проверять дневник.</p>'}
        ${S.consultants.length?"":`<form id="linkForm">${formField("code","Код консультанта","text","","required placeholder='Например, A1B2C3D4E5' autocapitalize=characters maxlength=40")}<button class="primary full">Подключить</button></form>`}
        ${S.consultants.map(l=>`<div class="connected"><b>${esc(who(l.consultant_id))}</b><button data-action="unlink" data-id="${esc(l.consultant_id)}">Отключить</button></div>`).join("")}</section>`;
    if(!coach)h+=pushPanel();
    return h;
  }
  function resultsView(){
    const p=currentProfile(),weights=[...S.weights].sort((a,b)=>a.log_date.localeCompare(b.log_date)),current=num(p?.weight_kg),initial=weights.length?num(weights[0].weight_kg):current,diff=Math.round((current-initial)*10)/10,target=num(p?.target_weight_kg);
    let h=`<div class="intro"><h1>${S.mode==="coach"?"Результаты клиента":"Мои результаты"}</h1><p>Вес и динамика изменений</p></div>`;
    if(!current){
      h+='<section class="card"><p class="subtle">Пока нет записей веса. Можно внести первое измерение.</p></section>';
      h+=`<section class="card"><h2>Записать вес</h2><form id="weightForm"><div class="two">${formField("date","Дата","date",S.date,"required")}${formField("weight","Вес, кг","number","","min=20 max=500 step=.1 required")}</div><button class="primary full">Сохранить вес</button></form></section>`;
      return h;
    }
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

  const developerFooter=()=>'<footer class="developer-credit"><span>Разработчик · <strong>Сахаяна Скрябина</strong></span><a href="https://wa.me/79142609616" target="_blank" rel="noopener noreferrer" aria-label="Написать разработчику в WhatsApp по номеру +7 914 260-96-16">+7 914 260-96-16</a></footer>';

  // Bottom navigation always changes the screen immediately.
  // Fresh client data is fetched afterward without holding taps behind network requests.
  async function refreshCoachTab(tab,seq){
    if(!isCoachApp||!S.user)return;
    const userId=S.user.id;
    try{
      const clients=await ok(db.from("nd_links").select("*").eq("consultant_id",userId));
      const ids=clients.map(l=>l.client_id);
      const profileTask=ids.length?ok(db.from("nd_profiles").select("*").in("id",ids)):Promise.resolve([]);
      const weightTask=tab==="results"&&ids.length?
        ok(db.from("nd_weights").select("client_id,log_date,weight_kg").in("client_id",ids).order("log_date",{ascending:true}).limit(2000)):
        Promise.resolve([]);
      const [profiles,weights]=await Promise.all([profileTask,weightTask]);
      if(seq!==S.navSeq||S.user?.id!==userId||S.tab!==tab)return;
      S.clients=clients;
      for(const p of profiles)S.people[p.id]=p;
      if(!clients.some(l=>l.client_id===S.selected))S.selected=clients[0]?.client_id||null;
      if(tab==="results"){
        S.clientWeights={};
        for(const w of weights)(S.clientWeights[w.client_id]??=[]).push(w);
      }
      if(tab==="inbox")await loadInbox();
      if(tab==="diary"){
        S.clientRequests=await ok(db.from("nd_diary_requests").select("client_id,log_date,requested_at").eq("consultant_id",userId).eq("log_date",localDate()));
        await loadInbox();
      }
      if(seq===S.navSeq&&S.user?.id===userId&&S.tab===tab&&!S.viewingClient)render();
    }catch(e){
      // A background refresh should not block navigation or interrupt user input.
      console.warn("Не удалось обновить раздел",e);
    }
  }
  function render(){
    if(!S.user||S.recovery){root.innerHTML=authView()+developerFooter();return}
    if(S.denied){
      root.innerHTML=`<div class="auth-screen"><section class="auth-card"><h1>${S.deniedReason==="client"?"Этот аккаунт уже используется клиентом":"Создать кабинет консультанта"}</h1><p>Вы вошли под почтой:</p><p class="signed-in-email">${esc(S.user?.email||"Электронная почта не определена")}</p>${S.deniedReason==="client"?
        '<p>Этот аккаунт уже прикреплён к консультанту как клиент. Для кабинета консультанта зарегистрируйте другую электронную почту.</p>':
        '<p>У вас ещё нет кабинета консультанта. Создайте его, чтобы получить собственный код и подключать только своих клиентов.</p><button class="primary full" data-action="activateCoach">Создать кабинет консультанта</button>'}
        <button class="secondary full" data-action="logout">Выйти и сменить аккаунт</button><p class="client-link"><a href="${APP_URL}">Открыть дневник клиента</a></p></section></div>`+developerFooter();
      return;
    }
    let h=`<div class="container">${top()}`;
    if(isCoachApp){
      if(S.tab==="inbox"){
        if(S.receivedDiary&&S.selected){
          h+=coachDetailBack()+(S.receivedDiaryLoading?
            '<section class="card received-diary-loading"><p>Загружаем отправленный дневник…</p></section>':
            diaryView());
        }else h+=inboxView();
      }
      else if(S.tab==="profile")h+=coachProfileView();
      else if(S.tab==="results")h+=S.viewingClient&&S.selected?coachDetailBack()+resultsView():coachProgressView();
      else h+=S.viewingClient&&S.selected?coachDetailBack()+coachClientCard():coachClientsView();
    }else h+=S.tab==="profile"?profileView():S.tab==="results"?resultsView():diaryView();
    root.innerHTML=h+developerFooter()+"</div>"+bottom();
  }
  async function enrollConsultant(user,providedName=""){
    if(!isCoachApp||!user)throw Error("Откройте кабинет консультанта для регистрации");
    const oldProfile=await ok(db.from("nd_profiles").select("id,display_name").eq("id",user.id).maybeSingle());
    const clean=String(providedName||user.user_metadata?.display_name||user.email?.split("@")[0]||"Консультант").trim().slice(0,120);
    if(!oldProfile)await ok(db.from("nd_profiles").insert({id:user.id,display_name:clean}));
    else if(providedName&&oldProfile.display_name!==clean)
      await ok(db.from("nd_profiles").update({display_name:clean}).eq("id",user.id));
    const own=await ok(db.from("nd_consultants").select("user_id,invite_code").eq("user_id",user.id).maybeSingle());
    if(!own){
      try{
        await ok(db.from("nd_consultants").insert({user_id:user.id}));
      }catch(err){
        if(/row-level security|duplicate|permission|conflict/i.test(err?.message||""))
          throw Error("Не удалось создать кабинет. Если вы уже подключены как клиент, зарегистрируйте консультанта с другой почтой.");
        throw err;
      }
    }
    await enter(user);
  }

  async function enter(user){
    S.user=user;
    if(!isCoachApp&&user.user_metadata?.signup_app==="consultant"){
      // Email confirmations may fall back to the default Site URL;
      // consultant registrations must return to the consultant app.
      location.replace(COACH_URL);
      return;
    }
    S.denied=false;
    S.mode=isCoachApp?"coach":"client";
    if(isCoachApp){
      const approved=await ok(db.from("nd_consultants").select("user_id,invite_code").eq("user_id",user.id).maybeSingle());
      if(!approved){
        const links=await ok(db.from("nd_links").select("consultant_id").eq("client_id",user.id).limit(1));
        S.denied=true;S.deniedReason=links.length?"client":"unregistered";
        render();return;
      }
      S.consultantCode=approved.invite_code;
    }
    let p=await ok(db.from("nd_profiles").select("*").eq("id",user.id).maybeSingle());
    if(!p){
      const clean=String(user.user_metadata?.display_name||user.email?.split("@")[0]||"Участник").slice(0,120);
      p=await ok(db.from("nd_profiles").insert({id:user.id,display_name:clean}).select().single());
    }
    S.profile=p;
    await loadPersonalFoods();
    if(supportsPush())void navigator.serviceWorker.register(SW_PATH,{scope:new URL("./",SW_PATH).pathname}).catch(e=>console.warn("Service worker unavailable",e));
    await loadLinks();
    if(isCoachApp){
      const deepClient=callbackQuery.get("client");
      const deepDate=callbackQuery.get("date");
      if(deepClient&&S.clients.some(x=>x.client_id===deepClient)){
        S.selected=deepClient;S.tab="diary";S.viewingClient=true;S.receivedDiary=false;
        if(/^\d{4}-\d{2}-\d{2}$/.test(deepDate||""))S.date=deepDate;
        await loadDay();
      }
    }
    void checkPushSettings();
  }
  async function loadInbox(){
  S.inbox=[];
  if(!isCoachApp||!S.clients.length)return;
  const clientIds=S.clients.map(x=>x.client_id);
  const days=await ok(db.from("nd_days").select("id,client_id,log_date,updated_at").in("client_id",clientIds).order("log_date",{ascending:false}).limit(300));
  if(!days.length)return;
  const ids=days.map(d=>d.id);
  let mealRows=[],reviewRows=[],subRows=[];
  for(let i=0;i<ids.length;i+=50){
    const chunk=ids.slice(i,i+50);
    const [meals,reviews,submissions]=await Promise.all([
      ok(db.from("nd_meals").select("day_id,created_at").in("day_id",chunk).limit(1000)),
      ok(db.from("nd_day_reviews").select("day_id,consultant_id,updated_at").in("day_id",chunk).eq("consultant_id",S.user.id)),
      ok(db.from("nd_day_submissions").select("day_id,submitted_at,mode").in("day_id",chunk))
    ]);
    mealRows.push(...meals);reviewRows.push(...reviews);subRows.push(...submissions);
  }
  const mealMap=new Map(),reviewMap=new Map(reviewRows.map(r=>[r.day_id,r])),subMap=new Map(subRows.map(s=>[s.day_id,s]));
  for(const m of mealRows){
    let entry=mealMap.get(m.day_id);
    if(!entry){entry={count:0,latest:0};mealMap.set(m.day_id,entry);}
    entry.count++;entry.latest=Math.max(entry.latest,Date.parse(m.created_at)||0);
  }
  for(const d of days){
    const submission=subMap.get(d.id);
    if(!submission)continue;
    const meals=mealMap.get(d.id)||{count:0,latest:0};
    const changed=Math.max(Date.parse(d.updated_at)||0,meals.latest);
    const checkedAt=Date.parse(reviewMap.get(d.id)?.updated_at||"")||0;
    S.inbox.push({
      client_id:d.client_id,log_date:d.log_date,mealCount:meals.count,
      status:checkedAt>=changed?"done":"pending",mode:submission.mode,
      changedAt:Math.max(changed,Date.parse(submission.submitted_at)||0)
    });
  }
  S.inbox.sort((a,b)=>b.changedAt-a.changedAt);
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
    if(isCoachApp){
      S.clientWeights={};
      if(clients.length){
        const rows=await ok(db.from("nd_weights").select("client_id,log_date,weight_kg").in("client_id",clients.map(l=>l.client_id)).order("log_date",{ascending:true}).limit(2000));
        for(const w of rows)(S.clientWeights[w.client_id]??=[]).push(w);
      }
      S.clientRequests=await ok(db.from("nd_diary_requests").select("client_id,log_date,requested_at").eq("consultant_id",id).eq("log_date",localDate()));
      await loadInbox();
    }
    await loadDay();
  }
  async function loadDay(){
  S.day=null;S.meals=[];S.mealReviews=[];S.dayReviews=[];S.photo={};S.weights=[];
  S.submission=null;S.clientRequest=null;
  const id=currentId();
  if(!id){render();return}
  const clientRequestQuery=S.mode==="client"?
    ok(db.from("nd_diary_requests").select("consultant_id,log_date,requested_at").eq("client_id",S.user.id).eq("log_date",S.date).order("requested_at",{ascending:false}).limit(1)):
    Promise.resolve([]);
  const [day,weights,requests]=await Promise.all([
    ok(db.from("nd_days").select("*").eq("client_id",id).eq("log_date",S.date).maybeSingle()),
    ok(db.from("nd_weights").select("*").eq("client_id",id).order("log_date",{ascending:true}).limit(120)),
    clientRequestQuery
  ]);
  S.day=day;S.weights=weights;S.clientRequest=requests[0]||null;
  if(day){
    const [meals,reviews,submissions]=await Promise.all([
      ok(db.from("nd_meals").select("*").eq("day_id",day.id).order("eaten_at")),
      ok(db.from("nd_day_reviews").select("*").eq("day_id",day.id)),
      ok(db.from("nd_day_submissions").select("*").eq("day_id",day.id).maybeSingle())
    ]);
    S.meals=meals;S.dayReviews=reviews;S.submission=submissions;
    if(meals.length)S.mealReviews=await ok(db.from("nd_meal_reviews").select("*").in("meal_id",meals.map(m=>m.id)));
  }
  render();
  const pictured=S.meals.filter(m=>m.photo_path);
  if(pictured.length){
    const signed=await Promise.all(pictured.map(async m=>{
      const {data}=await db.storage.from("nd-meal-photos").createSignedUrl(m.photo_path,1200);
      return [m.id,data?.signedUrl];
    }));
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
    if(isCoachApp){
      const weights=await ok(db.from("nd_weights").select("client_id,log_date,weight_kg").eq("client_id",id).order("log_date",{ascending:true}).limit(120));
      S.clientWeights[id]=weights;
    }
    notify("Вес сохранён");await loadDay();
  }
  document.addEventListener("submit",e=>{
    const f=e.target;if(!(f instanceof HTMLFormElement))return;
    e.preventDefault();
    guarded(async()=>{
      if(f.id==="authForm"){
        const email=v(f,"email"),password=v(f,"password");
        if(S.authMode==="register"){
          const displayName=v(f,"name");
          if(!displayName||displayName.length>120)throw Error("Укажите имя и фамилию");
          const redirect=isCoachApp?COACH_URL:APP_URL;
          const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:displayName,signup_app:isCoachApp?"consultant":"client"},emailRedirectTo:redirect}});
          if(error)throw error;
          if(data.session&&data.user){
            S.signupPending=false;
            if(isCoachApp)await enrollConsultant(data.user,displayName);
            else await enter(data.user);
          }else{
            S.signupPending=true;S.authMode="login";render();
            notify(isCoachApp?"Письмо отправлено. Подтвердите почту и войдите как консультант.":"Проверьте почту и подтвердите регистрацию.");
          }
        }else{
          const {data,error}=await db.auth.signInWithPassword({email,password});
          if(error)throw error;
          S.signupPending=false;
          await enter(data.user);
        }
        return;
      }
      if(f.id==="resetForm"){
        await ok(db.auth.resetPasswordForEmail(v(f,"email"),{redirectTo:isCoachApp?COACH_URL:APP_URL}));
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
      if(f.id==="consultantOwnProfileForm"){
        if(!isCoachApp)throw Error("Доступ закрыт");
        const name=v(f,"name");
        if(!name||name.length>120)throw Error("Укажи имя и фамилию");
        S.profile=await ok(db.from("nd_profiles").update({display_name:name}).eq("id",S.user.id).select().single());
        notify("Имя сохранено");render();return;
      }
      if(f.id==="profileForm"||f.id==="coachProfileForm"){await saveProfile(f);return}
      if(f.id==="weightForm"){await saveWeight(f);return}
      if(f.id==="linkForm"){
        if(isCoachApp)throw Error("Консультант не может присоединить себя как клиента");
        if(S.consultants.length)throw Error("Сначала отключите предыдущего консультанта");
        const code=v(f,"code").toUpperCase().replace(/\s+/g,"");
        const isOldUuid=/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(code);
        if(!isOldUuid&&!/^[A-F0-9]{10}$/.test(code))throw Error("Код консультанта должен содержать 10 символов");
        const consultant=isOldUuid?
          await ok(db.from("nd_consultants").select("user_id").eq("user_id",code.toLowerCase()).maybeSingle()):
          await ok(db.from("nd_consultants").select("user_id").eq("invite_code",code).maybeSingle());
        if(!consultant)throw Error("Консультант с таким кодом не найден");
        const consultant_id=consultant.user_id;
        if(consultant_id===S.user.id)throw Error("Нельзя подключить себя");
        try{
          await ok(db.from("nd_links").insert({client_id:S.user.id,consultant_id}));
        }catch(err){
          if(/duplicate|unique|nd_links_single_consultant/i.test(err?.message||""))
            throw Error("У вас уже есть консультант. Сначала отключите его в профиле.");
          throw err;
        }
        notify("Консультант подключён");await loadLinks();return;
      }
      if(f.id==="waterForm"){const typed=v(f,"water").trim();if(typed==="")throw Error("Введите количество воды в миллилитрах");const water=Number(typed);if(!Number.isInteger(water)||water<0||water>15000)throw Error("Проверьте количество воды");await saveWater(water);notify("Вода сохранена");return}
      if(f.id==="dayForm"){
        await ok(db.from("nd_days").upsert({client_id:S.user.id,log_date:S.date,water_ml:num(S.day?.water_ml),activity_minutes:Number(v(f,"activity")||0),wake_time:v(f,"wake")||null,bedtime:v(f,"sleep")||null,wellbeing:v(f,"wellbeing")===""?null:Number(v(f,"wellbeing")),notes:v(f,"notes"),updated_at:new Date().toISOString()},{onConflict:"client_id,log_date"}));
        notify("Итоги дня сохранены");await loadDay();return;
      }
      if(f.id==="mealForm"){
        const file=f.elements.namedItem("photo")?.files?.[0];
        if(!file)throw Error("Добавьте фото питания");
        if(file.size>24*1024*1024)throw Error("Фото слишком большое. Выберите другое.");
        if(S.foodSelection.length>30)throw Error("Слишком много продуктов в одном приёме пищи");
        if(S.foodSelection.some(food=>food.unit==="g"&&(!Number.isFinite(food.grams)||food.grams<=0||food.grams>20000)))
          throw Error("Укажите правильную массу каждого обычного продукта");
        if(S.foodSelection.some(food=>food.unit==="serving"&&(!Number.isFinite(food.servings)||food.servings<=0||food.servings>100)))
          throw Error("Укажите количество порций Herbalife");
        if(missingBrandProteins().length)throw Error("Укажите белок на порцию по этикетке каждого продукта Herbalife");
        if(S.foodSelection.some(food=>food.unit==="serving"&&(food.proteinPerServing<0||food.proteinPerServing>300)))
          throw Error("Белок на порцию должен быть от 0 до 300 г");
        if(S.foodSelection.length&&proteinFromSelection()>3000)throw Error("Слишком большое значение белка. Проверьте порции.");
        const processed=await photoToJpeg(file);
        const day=S.day||await ok(db.from("nd_days").insert({client_id:S.user.id,log_date:S.date}).select().single());
        const food_breakdown=S.foodSelection.map(food=>({
          name:food.name,
          grams:food.unit==="serving"?null:Number(food.grams),
          portions:food.unit==="serving"?Number(food.servings):null,
          protein_per_100g:food.unit==="serving"?null:Number(food.protein),
          protein_per_portion:food.unit==="serving"?Number(food.proteinPerServing):null,
          protein_g:foodProteinValue(food),
          fat_g:foodMacroValue(food,"fat"),
          carbs_g:foodMacroValue(food,"carbs"),
          kcal:foodMacroValue(food,"kcal"),
          reference_id:food.referenceId||null,
          source_quality:food.sourceQuality||null,
          source:food.source
        }));
        const path=`${S.user.id}/${S.date}/${crypto.randomUUID()}.jpg`;
        const {error:uploadError}=await db.storage.from("nd-meal-photos").upload(path,processed,{contentType:"image/jpeg",upsert:false});
        if(uploadError)throw uploadError;
        try{
          await ok(db.from("nd_meals").insert({day_id:day.id,meal_type:v(f,"type"),eaten_at:v(f,"time")||null,description:v(f,"description"),portion_g:v(f,"portion")?Number(v(f,"portion")):S.foodSelection.length&&S.foodSelection.every(food=>food.unit==="g")?Math.round(S.foodSelection.reduce((sum,food)=>sum+food.grams,0)*10)/10:null,protein_g:Number(v(f,"protein")),fat_g:foodMacroTotal("fat"),carbs_g:foodMacroTotal("carbs"),kcal:foodMacroTotal("kcal"),food_breakdown,photo_path:path}));
        }catch(e){await db.storage.from("nd-meal-photos").remove([path]);throw e}
        S.openMeal=false;S.foodSelection=[];notify("Запись сохранена");await loadDay();return;
      }
      if(f.classList.contains("mealReviewForm")){
        await ok(db.from("nd_meal_reviews").upsert({meal_id:f.dataset.id,consultant_id:S.user.id,rating:v(f,"rating")||"good",comment:v(f,"comment"),updated_at:new Date().toISOString()},{onConflict:"meal_id,consultant_id"}));
        notify("Оценка сохранена");await loadDay();return;
      }
      if(f.id==="dayReviewForm"){
        await ok(db.from("nd_day_reviews").upsert({day_id:S.day.id,consultant_id:S.user.id,rating:v(f,"rating")||"good",comment:v(f,"comment")||"Проверено",updated_at:new Date().toISOString()},{onConflict:"day_id,consultant_id"}));
        notify("Проверка завершена");await loadInbox();await loadDay();return;
      }
    });
  });
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-action]");if(!b)return;
    const action=b.dataset.action;

    if(action==="toggleFoodSearch"){
      S.foodOpen=!S.foodOpen;
      S.foodTerm="";
      S.foodFilter=foodDefaultCategory(S.mealType);
      const searchField=document.getElementById("foodSearch");
      if(searchField)searchField.value="";
      const clearSearch=document.querySelector(".food-search-clear");
      if(clearSearch)clearSearch.hidden=true;
      const dropdown=document.getElementById("foodPickerDropdown");
      if(dropdown)dropdown.hidden=!S.foodOpen;
      b.setAttribute("aria-expanded",String(S.foodOpen));
      const arrow=b.querySelector(".food-picker-arrow");
      if(arrow)arrow.textContent=S.foodOpen?"⌃":"⌄";
      if(S.foodOpen){refreshFoodDropdown();document.getElementById("foodSearch")?.focus();}
      return;
    }
    if(action==="clearFoodSearch"){
      S.foodTerm="";
      S.foodFilter=foodDefaultCategory(S.mealType);
      const search=document.getElementById("foodSearch");
      if(search)search.value="";
      b.hidden=true;
      refreshFoodDropdown();
      if(search)search.focus();
      return;
    }
    if(action==="foodCategory"){
      const category=b.dataset.category;
      if(!["herbalife","ordinary","all","mine"].includes(category))return;
      S.foodFilter=category;S.foodTerm="";
      const search=document.getElementById("foodSearch");
      if(search)search.value="";
      const clearButton=document.querySelector(".food-search-clear");
      if(clearButton)clearButton.hidden=true;
      refreshFoodDropdown();
      return;
    }
    if(action==="chooseFood"){
      const chosen=foodById(b.dataset.food);
      if(!chosen)return;
      if(S.foodSelection.length>=30){notify("Можно выбрать до 30 продуктов");return;}
      const already=S.foodSelection.find(item=>item.id===chosen.id);
      if(already){notify("Этот продукт уже добавлен. Измените количество или порции.");return;}
      S.foodSelection.push(chosen.unit==="serving"?{...chosen,servings:1,proteinPerServing:chosen.proteinPerServing}:{...chosen,grams:100});
      refreshFoodCalculator();
      S.foodTerm="";
      S.foodFilter=foodDefaultCategory(S.mealType);
      const search=document.getElementById("foodSearch");
      if(search)search.value="";
      const clearButton=document.querySelector(".food-search-clear");
      if(clearButton)clearButton.hidden=true;
      refreshFoodDropdown();
      S.foodOpen=false;
      const picker=document.getElementById("foodPickerDropdown");
      if(picker)picker.hidden=true;
      const trigger=document.querySelector(".food-picker-trigger");
      if(trigger){trigger.setAttribute("aria-expanded","false");const arrow=trigger.querySelector(".food-picker-arrow");if(arrow)arrow.textContent="⌄";}
      return;
    }
    if(action==="removeFood"){
      const index=Number(b.dataset.index);
      if(!Number.isInteger(index)||index<0||index>=S.foodSelection.length)return;
      S.foodSelection.splice(index,1);
      refreshFoodCalculator();
      return;
    }
    if(action==="eveningPreset"){
      const name=b.dataset.name;
      if(!eveningOptions.includes(name))return;
      const description=document.querySelector('#mealForm [name="description"]');
      if(description){description.value=name;description.dataset.foodAuto="0";description.focus();}
      return;
    }
    if(action==="saveOwnFood"){
      guarded(async()=>{
        if(!S.user||isCoachApp)throw Error("Справочник доступен только клиенту");
        const form=document.getElementById("mealForm");
        if(!form)throw Error("Откройте добавление питания");
        const name=v(form,"foodName").replace(/\s+/g," ").trim();
        const protein=Number(v(form,"foodPer100").replace(",","."));
        if(name.length<2||name.length>120)throw Error("Укажите название продукта (2–120 символов)");
        if(v(form,"foodPer100")===""||!Number.isFinite(protein)||protein<0||protein>100)
          throw Error("Введите белок на 100 г с этикетки — от 0 до 100 г");
        if(S.foodSelection.length>=30)throw Error("Максимум 30 ингредиентов в одном приёме пищи");
        const item=await ok(db.from("nd_foods").insert({
          owner_id:S.user.id,name,protein_per_100g:protein
        }).select("id,name,protein_per_100g").single());
        S.foods.push(item);
        const query=document.getElementById("foodSearch");
        if(query)query.value=name;
        const results=document.getElementById("foodSearchResults");
        if(results)results.innerHTML=foodSearchItems(name);
        const own=foodById("mine:"+item.id);
        if(own)S.foodSelection.push({...own,grams:100});
        refreshFoodCalculator();
        form.elements.namedItem("foodName").value="";
        form.elements.namedItem("foodPer100").value="";
        notify("Продукт добавлен в справочник и расчёт");
      });
      return;
    }
    if(action==="togglePassword"){
      const input=document.getElementById(b.getAttribute("aria-controls"));
      if(!(input instanceof HTMLInputElement))return;
      const show=input.type==="password";
      input.type=show?"text":"password";
      b.setAttribute("aria-pressed",String(show));
      b.setAttribute("aria-label",show?"Скрыть пароль":"Показать пароль");
      b.innerHTML=icon(show?"eyeOff":"eye")+`<span>${show?"Скрыть":"Показать"}</span>`;
      return;
    }
    if(["login","register","reset"].includes(action)){S.authMode=action;render();return}
    if(action==="activateCoach"){
      guarded(async()=>await enrollConsultant(S.user));
      return;
    }
    if(action==="tab"){
      const tab=b.dataset.tab;
      if(!["inbox","diary","results","profile"].includes(tab))return;
      S.tab=tab;
      S.openMeal=false;
      if(isCoachApp){S.viewingClient=false;S.receivedDiary=false;S.receivedDiaryLoading=false;}
      const seq=++S.navSeq;
      render(); // Immediate tab highlight and content, regardless of network state.
      if(isCoachApp&&tab!=="profile"){
        requestAnimationFrame(()=>{if(seq===S.navSeq)void refreshCoachTab(tab,seq)});
      }
      return;
    }
    if(action==="togglePush"){
      if(!supportsPush()){notify("Откройте приложение с экрана «Домой»");return;}
      if(S.pushEnabled){
        guarded(async()=>{await unsubscribePush();notify("Уведомления выключены");render()});
      }else{
        const permissionPromise=Notification.requestPermission();
        guarded(async()=>{await enablePush(permissionPromise)});
      }
      return;
    }
    if(action==="inboxFilter"){S.inboxFilter=b.dataset.filter;render();return}
    if(action==="openMeal"){S.mealType=b.dataset.type||"breakfast";S.foodSelection=[];S.foodOpen=false;S.foodTerm="";S.foodFilter=foodDefaultCategory(S.mealType);S.openMeal=true;render();document.getElementById("newEntry")?.scrollIntoView({behavior:"smooth",block:"start"});return}
    if(action==="closeMeal"){S.openMeal=false;S.foodSelection=[];S.foodOpen=false;render();return}
    guarded(async()=>{
      if(action==="logout"){if(S.user&&S.pushEnabled)await unsubscribePush();await db.auth.signOut();S.user=null;S.denied=false;S.deniedReason="";S.consultantCode=null;S.pushEnabled=false;render();return}
      if(action==="refreshClients"){await loadLinks();notify("Имена клиентов обновлены");return}
      if(action==="chooseClient"){
        S.selected=b.dataset.id;S.tab="diary";S.viewingClient=true;S.receivedDiary=false;
        const selectedId=S.selected;
        render();
        void (async()=>{try{
          await loadInbox();
          if(S.selected===selectedId&&S.viewingClient&&S.tab==="diary")render();
        }catch(e){console.warn("Не удалось обновить статус дневника",e)}})();
        return;
      }
      if(action==="openProgressClient"){S.selected=b.dataset.id;S.tab="results";S.viewingClient=true;S.receivedDiary=false;await loadDay();return}
      if(action==="backToList"){
        S.viewingClient=false;
        if(S.receivedDiary){S.receivedDiary=false;S.receivedDiaryLoading=false;S.tab="inbox";}
        render();return;
      }
      if(action==="openInboxDay"){
        if(!isCoachApp)throw Error("Доступ только для консультанта");
        const clientId=b.dataset.client,logDate=b.dataset.date;
        if(!S.clients.some(link=>link.client_id===clientId))throw Error("Клиент не подключён");
        if(!S.inbox.some(item=>item.client_id===clientId&&item.log_date===logDate))
          throw Error("Не удалось найти отправленный дневник. Обновите входящие.");
        S.selected=clientId;
        S.date=logDate;
        S.tab="inbox";
        S.viewingClient=true;
        S.receivedDiary=true;
        S.receivedDiaryLoading=true;
        render();
        try{
          await loadDay();
          if(!S.day||!S.submission)throw Error("Не удалось загрузить отправленный дневник. Обновите входящие.");
        }catch(error){
          S.receivedDiary=false;S.viewingClient=false;
          throw error;
        }finally{
          S.receivedDiaryLoading=false;
          render();
        }
        return;
      }
      if(action==="requestDiary"){
        if(!isCoachApp||!S.clients.some(l=>l.client_id===b.dataset.id))throw Error("Клиент не подключён");
        const id=b.dataset.id,today=localDate();
        if(S.inbox.some(x=>x.client_id===id&&x.log_date===today))throw Error("Дневник уже отправлен и находится во входящих");
        await ok(db.from("nd_diary_requests").upsert({client_id:id,consultant_id:S.user.id,log_date:today,requested_at:new Date().toISOString()},{onConflict:"client_id,consultant_id,log_date"}));
        S.clientRequests=S.clientRequests.filter(x=>!(x.client_id===id&&x.log_date===today));
        S.clientRequests.push({client_id:id,log_date:today,requested_at:new Date().toISOString()});
        notify("Запрос отправлен в приложение клиента");render();return;
      }
      if(action==="sendDiary"){
        if(isCoachApp||!S.user)throw Error("Отправить дневник может только клиент");
        if(S.submission){notify("Дневник уже отправлен");return;}
        if(!S.day||!S.meals.length)throw Error("Сначала добавьте хотя бы один приём пищи");
        if(!S.consultants.length)throw Error("Сначала подключите консультанта");
        await ok(db.from("nd_day_submissions").insert({day_id:S.day.id,client_id:S.user.id,mode:"manual"}));
        notify("Дневник отправлен консультанту");await loadDay();return;
      }
      if(action==="refreshInbox"){await loadInbox();render();notify("Входящие обновлены");return}
      if(action==="prevDay"||action==="nextDay"){S.date=dateAdd(S.date,action==="prevDay"?-1:1);S.openMeal=false;await loadDay();return}
      if(action==="waterQuick"){await saveWater(num(S.day?.water_ml)+Number(b.dataset.ml));return}
      if(action==="copyCode"){try{await navigator.clipboard.writeText(S.consultantCode||S.user.id);notify("Код скопирован")}catch{notify("Скопируйте код вручную")}return}
      if(action==="removeClient"){
        if(!isCoachApp||!S.user)throw Error("Только консультант может удалить клиента из своего списка.");
        const clientId=b.dataset.id;
        if(!S.clients.some(link=>link.client_id===clientId))throw Error("Клиент больше не прикреплён к вам.");
        const clientName=who(clientId);
        if(!confirm("Удалить "+clientName+" из списка ваших клиентов?\n\nКлиент будет откреплён от вас. Его аккаунт, фотографии и дневники сохранятся. Клиент сможет подключиться к вам или другому консультанту снова."))return;
        const removed=await ok(db.from("nd_links").delete().eq("consultant_id",S.user.id).eq("client_id",clientId).select("client_id"));
        if(!removed?.length)throw Error("Связь с клиентом уже отсутствует. Обновите список.");
        S.viewingClient=false;S.receivedDiary=false;S.receivedDiaryLoading=false;S.selected=null;
        S.tab="diary";
        delete S.people[clientId];delete S.clientWeights[clientId];
        S.inbox=S.inbox.filter(item=>item.client_id!==clientId);
        S.clientRequests=S.clientRequests.filter(item=>item.client_id!==clientId);
        await loadLinks();
        notify("Клиент откреплён. Данные клиента сохранены.");
        return;
      }
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
        if(S.day)await ok(db.from("nd_days").update({updated_at:new Date().toISOString()}).eq("id",S.day.id));
        notify("Запись удалена");await loadDay();return;
      }
    });
  });

  document.addEventListener("input",e=>{
    const target=e.target;
    if(target.id==="foodSearch"){
      S.foodTerm=target.value;
      if(S.foodTerm.trim())S.foodFilter="all";
      const clearButton=document.querySelector(".food-search-clear");
      if(clearButton)clearButton.hidden=!Boolean(S.foodTerm);
      refreshFoodDropdown();
      return;
    }
    if(target.matches?.(".food-serving-count,.food-serving-protein")){
      const index=Number(target.dataset.index),item=S.foodSelection[index];
      if(!item||item.unit!=="serving")return;
      const value=target.value.trim()===""?null:Number(target.value);
      if(target.classList.contains("food-serving-count"))item.servings=value===null?0:value;
      else item.proteinPerServing=value;
      refreshFoodCalculator(true);
      return;
    }
    if(target.matches?.(".food-weight")){
      const index=Number(target.dataset.index),item=S.foodSelection[index];
      if(!item)return;
      const grams=Number(target.value);
      item.grams=Number.isFinite(grams)?Math.max(0,Math.min(20000,grams)):0;
      refreshFoodCalculator(true);
      return;
    }
    if(target.matches?.('#mealForm [name="description"]')){
      target.dataset.foodAuto="0";
    }
  });
  document.addEventListener("change",e=>{
    if(e.target.matches?.('#mealForm select[name="type"]')){
      S.mealType=e.target.value;
      S.foodFilter=foodDefaultCategory(S.mealType);
      S.foodTerm="";S.foodOpen=false;
      const dropdown=document.getElementById("foodPickerDropdown");
      if(dropdown)dropdown.hidden=true;
      const trigger=document.querySelector(".food-picker-trigger");
      if(trigger){trigger.setAttribute("aria-expanded","false");const arrow=trigger.querySelector(".food-picker-arrow");if(arrow)arrow.textContent="⌄";}
      const search=document.getElementById("foodSearch");
      if(search)search.value="";
      refreshFoodDropdown();
    }
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