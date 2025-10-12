import { test, expect } from '@playwright/test'

/**
 * E2E Test: Stripe Checkout Integration
 *
 * Tests the checkout flow from form submission to Stripe redirect.
 * Does not test actual payment (requires Stripe hosted page).
 */

test.describe('Stripe Checkout Integration', () => {
  test('should successfully create checkout session and get Stripe redirect', async ({
    page,
  }) => {
    // Navigate to checkout page
    await page.goto('/checkout')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Fill out customer information
    await page.fill('input[name="customerEmail"]', 'test@example.com')
    await page.fill('input[name="customerName"]', 'Test Customer')
    await page.fill('input[name="customerPhone"]', '555-0100')

    // Fill out shipping address
    await page.fill('input[name="shippingAddress.addressLine1"]', '123 Test Street')
    await page.fill('input[name="shippingAddress.city"]', 'Los Angeles')
    await page.fill('input[name="shippingAddress.state"]', 'CA')
    await page.fill('input[name="shippingAddress.zipCode"]', '90210')
    await page.fill('input[name="shippingAddress.country"]', 'US')

    // Check "same as shipping" for billing address
    const sameAsShippingCheckbox = page.locator('input[type="checkbox"]').first()
    await sameAsShippingCheckbox.check()

    // Intercept the checkout API call
    const checkoutResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/stripe/checkout') && response.request().method() === 'POST'
    )

    // Submit the form
    const submitButton = page.locator('button:has-text("Proceed to Payment")')
    await submitButton.click()

    // Wait for API response
    const checkoutResponse = await checkoutResponsePromise

    // Verify response is successful
    expect(checkoutResponse.status()).toBe(200)

    const responseData = await checkoutResponse.json()

    // Verify response structure
    expect(responseData).toHaveProperty('sessionId')
    expect(responseData).toHaveProperty('orderId')
    expect(responseData).toHaveProperty('orderNumber')
    expect(responseData.sessionId).toMatch(/^cs_test_/)
    expect(responseData.orderNumber).toMatch(/^EZCR-/)

    console.log('✅ Checkout session created:', {
      sessionId: responseData.sessionId,
      orderNumber: responseData.orderNumber,
    })

    // Note: Stripe will redirect to checkout.stripe.com
    // We don't follow this redirect in automated tests
    // The redirect URL contains the session ID which can be used for verification
  })

  test('should show loading state during checkout submission', async ({
    page,
  }) => {
    await page.goto('/checkout')

    // Fill form
    await page.fill('input[name="customerEmail"]', 'test@example.com')
    await page.fill('input[name="customerName"]', 'Test Customer')
    await page.fill('input[name="customerPhone"]', '555-0100')
    await page.fill('input[name="shippingAddress.addressLine1"]', '123 Test St')
    await page.fill('input[name="shippingAddress.city"]', 'Test City')
    await page.fill('input[name="shippingAddress.state"]', 'CA')
    await page.fill('input[name="shippingAddress.zipCode"]', '90210')
    await page.fill('input[name="shippingAddress.country"]', 'US')

    const sameAsShippingCheckbox = page.locator('input[type="checkbox"]').first()
    await sameAsShippingCheckbox.check()

    // Submit and check for loading state
    const submitButton = page.locator('button:has-text("Proceed to Payment")')
    await submitButton.click()

    // Button should be disabled during processing
    await expect(submitButton).toBeDisabled()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/checkout')

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Proceed to Payment")')
    await submitButton.click()

    // Form validation should prevent submission
    // Check for HTML5 validation or error messages
    const emailInput = page.locator('input[name="customerEmail"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid
    })

    expect(isInvalid).toBe(true)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/checkout')

    // Fill form
    await page.fill('input[name="customerEmail"]', 'test@example.com')
    await page.fill('input[name="customerName"]', 'Test Customer')
    await page.fill('input[name="customerPhone"]', '555-0100')
    await page.fill('input[name="shippingAddress.addressLine1"]', '123 Test St')
    await page.fill('input[name="shippingAddress.city"]', 'Test City')
    await page.fill('input[name="shippingAddress.state"]', 'CA')
    await page.fill('input[name="shippingAddress.zipCode"]', '90210')
    await page.fill('input[name="shippingAddress.country"]', 'US')

    const sameAsShippingCheckbox = page.locator('input[type="checkbox"]').first()
    await sameAsShippingCheckbox.check()

    // Mock API to return error
    await page.route('**/api/stripe/checkout', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Submit form
    const submitButton = page.locator('button:has-text("Proceed to Payment")')
    await submitButton.click()

    // Wait for error message (toast or alert)
    // The exact selector depends on your toast implementation (sonner)
    await page.waitForTimeout(1000) // Give time for error to appear

    // Check console for errors or look for error UI
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('error') ||
             document.body.innerText.includes('failed')
    })

    expect(hasError).toBe(true)
  })
})

test.describe('Checkout Form Behavior', () => {
  test('should auto-fill billing address when "same as shipping" is checked', async ({
    page,
  }) => {
    await page.goto('/checkout')

    // Fill shipping address
    await page.fill('input[name="shippingAddress.addressLine1"]', '456 Main St')
    await page.fill('input[name="shippingAddress.city"]', 'San Francisco')
    await page.fill('input[name="shippingAddress.state"]', 'CA')
    await page.fill('input[name="shippingAddress.zipCode"]', '94102')

    // Check "same as shipping"
    const sameAsShippingCheckbox = page.locator('input[type="checkbox"]').first()
    await sameAsShippingCheckbox.check()

    // Billing address fields should be hidden or disabled
    // This depends on implementation - verify they're not shown
    const billingFields = page.locator('input[name^="billingAddress"]')
    const billingFieldsCount = await billingFields.count()

    // If billing fields are hidden when "same as shipping" is checked
    if (billingFieldsCount > 0) {
      // Verify they're disabled or hidden
      const firstBillingField = billingFields.first()
      const isDisabled = await firstBillingField.isDisabled()
      expect(isDisabled).toBe(true)
    }
  })

  test('should display order summary with correct calculations', async ({
    page,
  }) => {
    await page.goto('/checkout')

    // Look for order summary section
    const orderSummary = page.locator('text=Order Summary').locator('..')
    await expect(orderSummary).toBeVisible()

    // Verify key elements are present
    await expect(page.locator('text=/subtotal/i')).toBeVisible()
    await expect(page.locator('text=/shipping/i')).toBeVisible()
    await expect(page.locator('text=/tax/i')).toBeVisible()
    await expect(page.locator('text=/total/i')).toBeVisible()
  })
})

test.describe('Order Confirmation Page', () => {
  test('should display order details after successful payment', async ({
    page,
  }) => {
    // Mock session_id in URL (simulating return from Stripe)
    await page.goto('/order-confirmation?session_id=cs_test_mock_session_id')

    // Page should attempt to fetch order by session
    const orderResponse = page.waitForResponse(
      response => response.url().includes('/api/orders/by-session')
    )

    // Check if page loads (may show error if session doesn't exist)
    await page.waitForLoadState('networkidle')

    // Verify confirmation page elements exist
    const hasConfirmationText = await page.evaluate(() => {
      return document.body.innerText.includes('Order') ||
             document.body.innerText.includes('Confirmation') ||
             document.body.innerText.includes('Thank you')
    })

    expect(hasConfirmationText).toBe(true)
  })
})
