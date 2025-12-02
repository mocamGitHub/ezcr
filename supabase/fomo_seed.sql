INSERT INTO fomo_banners (enabled, type, message, stock_count, stock_threshold, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'stock', 'Only {count} ramps left in stock! Order now before they are gone.', 7, 10, '#FEF3C7', '#92400E', '#F78309', 'top', true, true, NOW(), NOW() + INTERVAL '30 days', 1);

INSERT INTO fomo_banners (enabled, type, message, end_date, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, priority)
VALUES (true, 'countdown', 'Holiday Sale ends in {countdown} - Save 15% with code HOLIDAY15', NOW() + INTERVAL '7 days', '#FEE2E2', '#991B1B', '#DC2626', 'top', true, true, NOW(), 2);

INSERT INTO fomo_banners (enabled, type, message, visitor_count, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'visitors', '{visitors} people are viewing our ramps right now!', 23, '#DBEAFE', '#1E40AF', '#2563EB', 'top', true, true, NOW(), NOW() + INTERVAL '90 days', 3);

INSERT INTO fomo_banners (enabled, type, message, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'custom', 'FREE SHIPPING on all orders over $500! Limited time offer.', '#D1FAE5', '#065F46', '#10B981', 'top', true, true, NOW(), NOW() + INTERVAL '14 days', 4);

INSERT INTO fomo_banners (enabled, type, message, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'custom', 'Veteran Owned Business - Thank you for supporting American manufacturing!', '#EDE9FE', '#5B21B6', '#7C3AED', 'top', true, true, NOW(), NOW() + INTERVAL '60 days', 5);

INSERT INTO fomo_banners (enabled, type, message, stock_count, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'stock', 'Hot Item! AUN250 Folding Ramp - Only {count} left this month', 12, '#FFF7ED', '#9A3412', '#EA580C', 'top', true, true, NOW(), NOW() + INTERVAL '30 days', 6);

INSERT INTO fomo_banners (enabled, type, message, end_date, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, priority)
VALUES (true, 'countdown', 'Flash Sale! {countdown} left to save 10% on all accessories', NOW() + INTERVAL '3 days', '#FDF2F8', '#9D174D', '#EC4899', 'top', true, true, NOW(), 7);

INSERT INTO fomo_banners (enabled, type, message, visitor_count, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'visitors', '{visitors} riders have purchased this week - Join them!', 47, '#ECFDF5', '#047857', '#10B981', 'top', true, true, NOW(), NOW() + INTERVAL '30 days', 8);