const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  const screenshotDir = path.join(__dirname, 'screenshots');

  // Desktop screenshots (1280px)
  console.log('Taking desktop screenshots...');
  const desktopBrowser = await chromium.launch();
  const desktopContext = await desktopBrowser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const desktopPage = await desktopContext.newPage();

  // Homepage - Desktop
  console.log('  Homepage...');
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'load', timeout: 60000 });
  await desktopPage.waitForTimeout(3000);
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '01-homepage-hero.png'),
    fullPage: false
  });
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '01-homepage-full.png'),
    fullPage: true
  });

  // Configurator Step 1 - Desktop
  console.log('  Configurator Step 1...');
  await desktopPage.goto('http://localhost:3000/configure', { waitUntil: 'load', timeout: 60000 });
  // Wait for loading to complete - look for the vehicle selection to appear
  try {
    await desktopPage.waitForSelector('button:has-text("Pickup Truck")', { timeout: 15000 });
  } catch (e) {
    console.log('    Waiting extra time for configurator...');
    await desktopPage.waitForTimeout(5000);
  }
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '02-configurator-step1.png'),
    fullPage: true
  });

  // Select a vehicle to proceed to step 2
  console.log('  Configurator Step 2...');
  try {
    await desktopPage.click('button:has-text("Pickup Truck")', { timeout: 5000 });
    await desktopPage.waitForTimeout(500);
    await desktopPage.click('button:has-text("Continue")', { timeout: 5000 });
    await desktopPage.waitForTimeout(1500);
  } catch (e) {
    console.log('    Note: Could not navigate to step 2');
  }
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '03-configurator-step2.png'),
    fullPage: true
  });

  // Fill measurements and proceed to step 3
  console.log('  Configurator Step 3...');
  try {
    // Look for input fields with various possible IDs
    const inputs = await desktopPage.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('72');
      await inputs[1].fill('24');
    }
    await desktopPage.waitForTimeout(500);
    await desktopPage.click('button:has-text("Continue")', { timeout: 5000 });
    await desktopPage.waitForTimeout(1500);
  } catch (e) {
    console.log('    Note: Could not complete step 2 form');
  }
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '04-configurator-step3.png'),
    fullPage: true
  });

  // Try to proceed to step 4
  console.log('  Configurator Step 4...');
  try {
    await desktopPage.click('button:has-text("Sport")', { timeout: 5000 });
    await desktopPage.waitForTimeout(300);
    const inputs = await desktopPage.locator('input[type="number"]').all();
    if (inputs.length >= 3) {
      await inputs[0].fill('450');
      await inputs[1].fill('55');
      await inputs[2].fill('80');
    }
    await desktopPage.waitForTimeout(500);
    await desktopPage.click('button:has-text("Continue")', { timeout: 5000 });
    await desktopPage.waitForTimeout(1500);
  } catch (e) {
    console.log('    Note: Could not complete step 3 form');
  }
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '05-configurator-step4.png'),
    fullPage: true
  });

  // Try to proceed to step 5
  console.log('  Configurator Step 5...');
  try {
    // Try various button texts
    const continueBtn = await desktopPage.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click({ timeout: 5000 });
      await desktopPage.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('    Note: Could not navigate to step 5');
  }
  await desktopPage.screenshot({
    path: path.join(screenshotDir, 'desktop', '06-configurator-step5.png'),
    fullPage: true
  });

  await desktopBrowser.close();

  // Mobile screenshots (375px - iPhone SE)
  console.log('\nTaking mobile screenshots...');
  const mobileBrowser = await chromium.launch();
  const mobileContext = await mobileBrowser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();

  // Homepage - Mobile
  console.log('  Homepage...');
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'load', timeout: 60000 });
  await mobilePage.waitForTimeout(3000);
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '01-homepage-hero.png'),
    fullPage: false
  });
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '01-homepage-full.png'),
    fullPage: true
  });

  // Configurator Step 1 - Mobile
  console.log('  Configurator Step 1...');
  await mobilePage.goto('http://localhost:3000/configure', { waitUntil: 'load', timeout: 60000 });
  try {
    await mobilePage.waitForSelector('button:has-text("Pickup Truck")', { timeout: 15000 });
  } catch (e) {
    console.log('    Waiting extra time for configurator...');
    await mobilePage.waitForTimeout(5000);
  }
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '02-configurator-step1.png'),
    fullPage: true
  });

  // Select a vehicle to proceed to step 2
  console.log('  Configurator Step 2...');
  try {
    await mobilePage.click('button:has-text("Pickup Truck")', { timeout: 5000 });
    await mobilePage.waitForTimeout(500);
    await mobilePage.click('button:has-text("Continue")', { timeout: 5000 });
    await mobilePage.waitForTimeout(1500);
  } catch (e) {
    console.log('    Note: Could not navigate to step 2');
  }
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '03-configurator-step2.png'),
    fullPage: true
  });

  // Fill measurements and proceed to step 3
  console.log('  Configurator Step 3...');
  try {
    const inputs = await mobilePage.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill('72');
      await inputs[1].fill('24');
    }
    await mobilePage.waitForTimeout(500);
    await mobilePage.click('button:has-text("Continue")', { timeout: 5000 });
    await mobilePage.waitForTimeout(1500);
  } catch (e) {
    console.log('    Note: Could not complete step 2 form');
  }
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '04-configurator-step3.png'),
    fullPage: true
  });

  // Try to proceed to step 4
  console.log('  Configurator Step 4...');
  try {
    await mobilePage.click('button:has-text("Sport")', { timeout: 5000 });
    await mobilePage.waitForTimeout(300);
    const inputs = await mobilePage.locator('input[type="number"]').all();
    if (inputs.length >= 3) {
      await inputs[0].fill('450');
      await inputs[1].fill('55');
      await inputs[2].fill('80');
    }
    await mobilePage.waitForTimeout(500);
    await mobilePage.click('button:has-text("Continue")', { timeout: 5000 });
    await mobilePage.waitForTimeout(1500);
  } catch (e) {
    console.log('    Note: Could not complete step 3 form');
  }
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '05-configurator-step4.png'),
    fullPage: true
  });

  // Try to proceed to step 5
  console.log('  Configurator Step 5...');
  try {
    const continueBtn = await mobilePage.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click({ timeout: 5000 });
      await mobilePage.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('    Note: Could not navigate to step 5');
  }
  await mobilePage.screenshot({
    path: path.join(screenshotDir, 'mobile', '06-configurator-step5.png'),
    fullPage: true
  });

  await mobileBrowser.close();

  console.log('\nDone! Screenshots saved to:', screenshotDir);
}

takeScreenshots().catch(console.error);
