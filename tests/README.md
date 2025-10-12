# E2E Tests with Playwright

Automated end-to-end tests for the EZCR e-commerce platform, focusing on the Stripe checkout integration.

## Setup

Playwright is already installed in the project. To install browsers:

```bash
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

## Test Structure

### `checkout.spec.ts`
Tests the complete Stripe checkout integration:

#### Stripe Checkout Integration
- **Should create checkout session**: Fills out form, submits, verifies API response with sessionId and orderNumber
- **Should show loading state**: Verifies button is disabled during processing
- **Should validate required fields**: Tests HTML5 validation on empty form
- **Should handle API errors**: Mocks API failure and checks error handling

#### Checkout Form Behavior
- **Should auto-fill billing address**: Tests "same as shipping" checkbox functionality
- **Should display order summary**: Verifies subtotal, shipping, tax, and total are shown

#### Order Confirmation Page
- **Should display order details**: Verifies confirmation page loads after payment

## What These Tests Do NOT Cover

- **Actual Stripe Payment**: Tests stop before the redirect to checkout.stripe.com
- **Webhook Processing**: Tests don't simulate Stripe webhook events
- **Email Notifications**: Not yet implemented in the app
- **Order History**: Not yet implemented

## Test Strategy

The tests verify:
1. Form submission works correctly
2. API endpoint returns expected data structure
3. Error handling works as expected
4. UI elements are present and functional

The tests **intentionally do not**:
- Follow redirects to Stripe's external checkout page
- Enter actual payment information
- Test the actual payment processing (that's Stripe's responsibility)

## Test Data

All tests use mock customer data:
- Email: `test@example.com`
- Name: `Test Customer`
- Phone: `555-0100`
- Address: `123 Test Street, Los Angeles, CA 90210`

## Debugging Tests

Use the debug command to step through tests:

```bash
npm run test:e2e:debug
```

Or use UI mode for visual debugging:

```bash
npm run test:e2e:ui
```

## CI/CD Integration

These tests can be run in CI pipelines. The configuration automatically:
- Starts the dev server before tests
- Runs in headless mode in CI
- Retries failed tests (2 retries in CI)
- Captures screenshots on failure

## Configuration

See `playwright.config.ts` for configuration details:
- Base URL: `http://localhost:3003`
- Timeout: 120 seconds for server startup
- Browser: Chromium only (can add Firefox, WebKit)
- Reporter: HTML report (opens automatically on failure)

## Extending Tests

To add more tests:

1. Create a new `.spec.ts` file in the `tests/` directory
2. Import `test` and `expect` from `@playwright/test`
3. Use `test.describe()` to group related tests
4. Use `test()` to define individual test cases

Example:

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page')
    await expect(page.locator('h1')).toContainText('Expected Text')
  })
})
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Assertions](https://playwright.dev/docs/test-assertions)
