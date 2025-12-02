INSERT INTO fomo_banners (enabled, type, message, stock_count, stock_threshold, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (true, 'stock', 'Only {count} ramps left in stock! Order now before they are gone.', 7, 10, '#FEF3C7', '#92400E', '#F78309', 'top', true, true, NOW(), NOW() + INTERVAL '30 days', 1);

INSERT INTO fomo_banners (enabled, type, message, end_date, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, priority)
VALUES (false, 'countdown', 'Holiday Sale ends in {countdown}! Save 15% with code HOLIDAY15', NOW() + INTERVAL '7 days', '#FEE2E2', '#991B1B', '#DC2626', 'top', true, true, NOW(), 2);

INSERT INTO fomo_banners (enabled, type, message, visitor_count, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (false, 'visitors', '{visitors} people are viewing our ramps right now!', 23, '#DBEAFE', '#1E40AF', '#2563EB', 'top', true, true, NOW(), NOW() + INTERVAL '90 days', 3);

INSERT INTO fomo_banners (enabled, type, message, background_color, text_color, accent_color, position, dismissible, show_icon, start_date, end_date, priority)
VALUES (false, 'custom', 'FREE SHIPPING on all orders over $500! Limited time offer.', '#D1FAE5', '#065F46', '#10B981', 'top', true, true, NOW(), NOW() + INTERVAL '14 days', 4);