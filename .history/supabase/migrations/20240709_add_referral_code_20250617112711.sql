-- Добавить поле с реферальным кодом (уникальный для каждого пользователя)
alter table users add column if not exists referral_code text unique;
alter table users add column if not exists used_referral_code text;

-- Для существующих пользователей: referral_code = id::text
update users set referral_code = id::text where referral_code is null;

-- Добавить поле is_active для выбора активного баннера
alter table promo_banners add column if not exists is_active boolean default false;

-- Сбросить is_active у всех баннеров
update promo_banners set is_active = false; 