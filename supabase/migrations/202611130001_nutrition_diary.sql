-- Fresh-project reference schema. Already applied in the linked Supabase project.

-- Do not run this a second time on an existing installation.

create table public.nd_profiles(
id uuid primary key references auth.users(id) on delete cascade,
display_name text not null default '',created_at timestamptz not null default now(),
check(char_length(display_name)<=120));
create table public.nd_links(
client_id uuid not null references public.nd_profiles(id) on delete cascade,
consultant_id uuid not null references public.nd_profiles(id) on delete cascade,
created_at timestamptz not null default now(),
primary key(client_id,consultant_id),check(client_id<>consultant_id));
create index nd_links_consultant_idx on public.nd_links(consultant_id);
create table public.nd_days(
id uuid primary key default gen_random_uuid(),
client_id uuid not null references public.nd_profiles(id) on delete cascade,
log_date date not null,
water_ml integer not null default 0 check(water_ml between 0 and 15000),
activity_minutes integer not null default 0 check(activity_minutes between 0 and 1440),
bedtime time,wake_time time,wellbeing integer check(wellbeing between -5 and 5),
notes text not null default '' check(char_length(notes)<=3000),
updated_at timestamptz not null default now(),unique(client_id,log_date));
create index nd_days_client_date_idx on public.nd_days(client_id,log_date desc);
create table public.nd_meals(
id uuid primary key default gen_random_uuid(),
day_id uuid not null references public.nd_days(id) on delete cascade,
meal_type text not null check(meal_type in('breakfast','snack1','lunch','snack2','dinner','other')),
eaten_at time,
description text not null check(char_length(description) between 1 and 2000),
portion_g numeric(8,1) check(portion_g>0 and portion_g<=20000),
protein_g numeric(8,1) check(protein_g>=0 and protein_g<=3000),
photo_path text check(char_length(photo_path)<=500),
created_at timestamptz not null default now());
create index nd_meals_day_idx on public.nd_meals(day_id);
create table public.nd_meal_reviews(
id uuid primary key default gen_random_uuid(),
meal_id uuid not null references public.nd_meals(id) on delete cascade,
consultant_id uuid not null references public.nd_profiles(id) on delete cascade,
rating text not null check(rating in('good','improve')),
comment text not null default '' check(char_length(comment)<=3000),
updated_at timestamptz not null default now(),
unique(meal_id,consultant_id));
create table public.nd_day_reviews(
id uuid primary key default gen_random_uuid(),
day_id uuid not null references public.nd_days(id) on delete cascade,
consultant_id uuid not null references public.nd_profiles(id) on delete cascade,
comment text not null check(char_length(comment) between 1 and 4000),
updated_at timestamptz not null default now(),
unique(day_id,consultant_id));
create table public.nd_plans(
id uuid primary key default gen_random_uuid(),
client_id uuid not null references public.nd_profiles(id) on delete cascade,
consultant_id uuid not null references public.nd_profiles(id) on delete cascade,
title text not null check(char_length(title) between 1 and 120),
start_date date not null,end_date date not null,
notes text not null default '' check(char_length(notes)<=4000),
created_at timestamptz not null default now(),
check(end_date>=start_date and end_date<=start_date+90));
create index nd_plans_client_idx on public.nd_plans(client_id,start_date desc);
create table public.nd_plan_meals(
id uuid primary key default gen_random_uuid(),
plan_id uuid not null references public.nd_plans(id) on delete cascade,
planned_for date not null,
meal_type text not null check(meal_type in('breakfast','snack1','lunch','snack2','dinner','other')),
at_time time,
description text not null check(char_length(description) between 1 and 2000),
portion_note text not null default '' check(char_length(portion_note)<=400));
create index nd_plan_meals_plan_idx on public.nd_plan_meals(plan_id,planned_for);
create table public.nd_foods(
id uuid primary key default gen_random_uuid(),
owner_id uuid not null references public.nd_profiles(id) on delete cascade,
name text not null check(char_length(name) between 1 and 160),
kcal_per_100g numeric(8,1) check(kcal_per_100g>=0),
protein_per_100g numeric(8,1) check(protein_per_100g>=0),
fat_per_100g numeric(8,1) check(fat_per_100g>=0),
carbs_per_100g numeric(8,1) check(carbs_per_100g>=0),
unique(owner_id,name));

alter table public.nd_profiles enable row level security;

alter table public.nd_links enable row level security;

alter table public.nd_days enable row level security;

alter table public.nd_meals enable row level security;

alter table public.nd_meal_reviews enable row level security;

alter table public.nd_day_reviews enable row level security;

alter table public.nd_plans enable row level security;

alter table public.nd_plan_meals enable row level security;

alter table public.nd_foods enable row level security;

create policy nd_profiles_read on public.nd_profiles for select to authenticated using(id=(select auth.uid()) or exists(select 1 from public.nd_links l where (l.client_id=(select auth.uid()) and l.consultant_id=id) or (l.consultant_id=(select auth.uid()) and l.client_id=id))) ;

create policy nd_profiles_create on public.nd_profiles for insert to authenticated  with check(id=(select auth.uid()));

create policy nd_profiles_edit on public.nd_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));

create policy nd_links_read on public.nd_links for select to authenticated using(client_id=(select auth.uid()) or consultant_id=(select auth.uid())) ;

create policy nd_links_create on public.nd_links for insert to authenticated  with check(client_id=(select auth.uid()));

create policy nd_links_delete on public.nd_links for delete to authenticated using(client_id=(select auth.uid()) or consultant_id=(select auth.uid())) ;

create policy nd_days_read on public.nd_days for select to authenticated using(client_id=(select auth.uid()) or exists(select 1 from public.nd_links l where l.client_id = nd_days.client_id and l.consultant_id = (select auth.uid()))) ;

create policy nd_days_create on public.nd_days for insert to authenticated  with check(client_id=(select auth.uid()));

create policy nd_days_edit on public.nd_days for update to authenticated using(client_id=(select auth.uid())) with check(client_id=(select auth.uid()));

create policy nd_days_delete on public.nd_days for delete to authenticated using(client_id=(select auth.uid())) ;

create policy nd_meals_read on public.nd_meals for select to authenticated using(exists(select 1 from public.nd_days d where d.id=day_id)) ;

create policy nd_meals_create on public.nd_meals for insert to authenticated  with check(exists(select 1 from public.nd_days d where d.id=day_id and d.client_id=(select auth.uid())));

create policy nd_meals_edit on public.nd_meals for update to authenticated using(exists(select 1 from public.nd_days d where d.id=day_id and d.client_id=(select auth.uid()))) with check(exists(select 1 from public.nd_days d where d.id=day_id and d.client_id=(select auth.uid())));

create policy nd_meals_delete on public.nd_meals for delete to authenticated using(exists(select 1 from public.nd_days d where d.id=day_id and d.client_id=(select auth.uid()))) ;

create policy nd_meal_reviews_read on public.nd_meal_reviews for select to authenticated using((consultant_id=(select auth.uid()) and exists(select 1 from public.nd_meals m join public.nd_days d on d.id=m.day_id join public.nd_links l on l.client_id=d.client_id where m.id=meal_id and l.consultant_id=(select auth.uid()))) or exists(select 1 from public.nd_meals m join public.nd_days d on d.id=m.day_id where m.id=meal_id and d.client_id=(select auth.uid()))) ;

create policy nd_meal_reviews_create on public.nd_meal_reviews for insert to authenticated  with check(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_meals m join public.nd_days d on d.id=m.day_id join public.nd_links l on l.client_id=d.client_id where m.id=meal_id and l.consultant_id=(select auth.uid())));

create policy nd_meal_reviews_edit on public.nd_meal_reviews for update to authenticated using(consultant_id=(select auth.uid())) with check(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_meals m join public.nd_days d on d.id=m.day_id join public.nd_links l on l.client_id=d.client_id where m.id=meal_id and l.consultant_id=(select auth.uid())));

create policy nd_meal_reviews_delete on public.nd_meal_reviews for delete to authenticated using(consultant_id=(select auth.uid())) ;

create policy nd_day_reviews_read on public.nd_day_reviews for select to authenticated using((consultant_id=(select auth.uid()) and exists(select 1 from public.nd_days d join public.nd_links l on l.client_id=d.client_id where d.id=day_id and l.consultant_id=(select auth.uid()))) or exists(select 1 from public.nd_days d where d.id=day_id and d.client_id=(select auth.uid()))) ;

create policy nd_day_reviews_create on public.nd_day_reviews for insert to authenticated  with check(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_days d join public.nd_links l on l.client_id=d.client_id where d.id=day_id and l.consultant_id=(select auth.uid())));

create policy nd_day_reviews_edit on public.nd_day_reviews for update to authenticated using(consultant_id=(select auth.uid())) with check(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_days d join public.nd_links l on l.client_id=d.client_id where d.id=day_id and l.consultant_id=(select auth.uid())));

create policy nd_day_reviews_delete on public.nd_day_reviews for delete to authenticated using(consultant_id=(select auth.uid())) ;

create policy nd_plans_read on public.nd_plans for select to authenticated using(client_id=(select auth.uid()) or (consultant_id=(select auth.uid()) and exists(select 1 from public.nd_links l where l.client_id = nd_plans.client_id and l.consultant_id = (select auth.uid())))) ;

create policy nd_plans_create on public.nd_plans for insert to authenticated  with check(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_links l where l.client_id = nd_plans.client_id and l.consultant_id = (select auth.uid())));

create policy nd_plans_edit on public.nd_plans for update to authenticated using(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_links l where l.client_id = nd_plans.client_id and l.consultant_id = (select auth.uid()))) with check(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_links l where l.client_id = nd_plans.client_id and l.consultant_id = (select auth.uid())));

create policy nd_plans_delete on public.nd_plans for delete to authenticated using(consultant_id=(select auth.uid()) and exists(select 1 from public.nd_links l where l.client_id = nd_plans.client_id and l.consultant_id = (select auth.uid()))) ;

create policy nd_plan_meals_read on public.nd_plan_meals for select to authenticated using(exists(select 1 from public.nd_plans p where p.id=plan_id)) ;

create policy nd_plan_meals_create on public.nd_plan_meals for insert to authenticated  with check(exists(select 1 from public.nd_plans p where p.id=plan_id and p.consultant_id=(select auth.uid())));

create policy nd_plan_meals_edit on public.nd_plan_meals for update to authenticated using(exists(select 1 from public.nd_plans p where p.id=plan_id and p.consultant_id=(select auth.uid()))) with check(exists(select 1 from public.nd_plans p where p.id=plan_id and p.consultant_id=(select auth.uid())));

create policy nd_plan_meals_delete on public.nd_plan_meals for delete to authenticated using(exists(select 1 from public.nd_plans p where p.id=plan_id and p.consultant_id=(select auth.uid()))) ;

create policy nd_foods_read on public.nd_foods for select to authenticated using(owner_id=(select auth.uid())) ;

create policy nd_foods_create on public.nd_foods for insert to authenticated  with check(owner_id=(select auth.uid()));

create policy nd_foods_edit on public.nd_foods for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create policy nd_foods_delete on public.nd_foods for delete to authenticated using(owner_id=(select auth.uid())) ;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('nd-meal-photos','nd-meal-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;

create policy nd_photos_read on storage.objects for select to authenticated using(bucket_id='nd-meal-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.nd_links l where l.client_id::text=(storage.foldername(name))[1] and l.consultant_id=(select auth.uid()))));

create policy nd_photos_create on storage.objects for insert to authenticated with check(bucket_id='nd-meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy nd_photos_delete on storage.objects for delete to authenticated using(bucket_id='nd-meal-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

grant select,insert,update,delete on public.nd_profiles,public.nd_links,public.nd_days,public.nd_meals,public.nd_meal_reviews,public.nd_day_reviews,public.nd_plans,public.nd_plan_meals,public.nd_foods to authenticated;

revoke all on public.nd_profiles,public.nd_links,public.nd_days,public.nd_meals,public.nd_meal_reviews,public.nd_day_reviews,public.nd_plans,public.nd_plan_meals,public.nd_foods from anon;