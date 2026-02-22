-- 006_gem_star_currency.sql
-- Dual currency: Gem (premium) + Star (bound)
-- Game-specific currencies deactivated (TC/CC manage their own points)

-- Rename: point → gem (일반형, 충전/출금 가능)
UPDATE currencies SET code = 'gem', name = 'Gem', description = 'Premium currency (rechargeable, withdrawable)' WHERE code = 'point';

-- Rename: private_point → star (귀속형, 이벤트/출석/광고)
UPDATE currencies SET code = 'star', name = 'Star', description = 'Bound currency (events, check-in, non-withdrawable)' WHERE code = 'private_point';

-- Deactivate game-specific currencies (each game manages its own points)
UPDATE currencies SET is_active = false WHERE code IN ('tc_point', 'cc_point');

-- Bonus policies: free rewards go to Star (귀속형)
UPDATE bonus_policies SET currency_id = (SELECT id FROM currencies WHERE code = 'star') WHERE code IN ('signup', 'daily_visit');
