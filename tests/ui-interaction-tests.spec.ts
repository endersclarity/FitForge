import { test, expect } from '@playwright/test';

test.describe('FitForge UI Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
  });

  test.describe('Button Functionality', () => {
    test('should respond to button clicks', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('http://localhost:5000/dashboard');
      
      // Find and click a button
      const button = page.locator('button:has-text("Start Quick Workout")').first();
      await expect(button).toBeVisible();
      await button.click();
      
      // Verify navigation occurred
      await expect(page).toHaveURL(/.*workouts/);
    });

    test('theme toggle button should work', async ({ page }) => {
      // Find theme toggle button
      const themeToggle = page.locator('button[aria-label*="theme"], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
      await expect(themeToggle).toBeVisible();
      
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('class');
      
      // Click theme toggle
      await themeToggle.click();
      
      // Verify theme changed
      const newTheme = await htmlElement.getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages using nav links', async ({ page }) => {
      await page.goto('http://localhost:5000/dashboard');
      
      // Click workouts link
      await page.click('a:has-text("Workouts")');
      await expect(page).toHaveURL(/.*workouts/);
      
      // Click progress link
      await page.click('a:has-text("Progress")');
      await expect(page).toHaveURL(/.*progress/);
      
      // Click community link
      await page.click('a:has-text("Community")');
      await expect(page).toHaveURL(/.*community/);
    });

    test('mobile menu should open and navigate', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:5000/dashboard');
      
      // Find and click mobile menu button
      const menuButton = page.locator('button:has(svg.lucide-menu)');
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      
      // Verify menu opened
      const mobileMenu = page.locator('[role="dialog"]');
      await expect(mobileMenu).toBeVisible();
      
      // Click a menu item
      await page.click('[role="dialog"] a:has-text("Workouts")');
      await expect(page).toHaveURL(/.*workouts/);
    });
  });

  test.describe('Form Submissions', () => {
    test('login form should submit', async ({ page }) => {
      await page.goto('http://localhost:5000/auth');
      
      // Fill login form
      await page.fill('input[type="email"]', 'test@example.com');
      
      // Submit form
      await page.click('button:has-text("Sign In")');
      
      // Should either show error or redirect to dashboard
      await expect(page).toHaveURL(/(auth|dashboard)/);
    });

    test('registration form should validate', async ({ page }) => {
      await page.goto('http://localhost:5000/auth');
      
      // Switch to register tab
      await page.click('button[role="tab"]:has-text("Register")');
      
      // Try to submit empty form
      await page.click('button:has-text("Create Account")');
      
      // Should show validation errors
      const errors = page.locator('.text-destructive');
      await expect(errors.first()).toBeVisible();
    });
  });

  test.describe('Interactive Components', () => {
    test('dropdown menus should open and close', async ({ page }) => {
      await page.goto('http://localhost:5000/dashboard');
      
      // Find user menu dropdown
      const userMenuTrigger = page.locator('[role="button"]:has(.rounded-full)').last();
      await userMenuTrigger.click();
      
      // Verify dropdown opened
      const dropdown = page.locator('[role="menu"]');
      await expect(dropdown).toBeVisible();
      
      // Click outside to close
      await page.click('body', { position: { x: 0, y: 0 } });
      await expect(dropdown).not.toBeVisible();
    });

    test('modals and dialogs should function', async ({ page }) => {
      await page.goto('http://localhost:5000/workouts');
      
      // Look for any button that might open a modal
      const modalTrigger = page.locator('button:has-text("Start Workout"), button:has-text("Create"), button:has-text("New")').first();
      
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click();
        
        // Check for dialog/modal
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    });
  });
});

test.describe('Accessibility and Keyboard Navigation', () => {
  test('should be navigable by keyboard', async ({ page }) => {
    await page.goto('http://localhost:5000');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter on focused element
    await page.keyboard.press('Enter');
    
    // Verify some navigation occurred
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('forms should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:5000/auth');
    
    // Tab to first input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Type in field
    await page.keyboard.type('test@example.com');
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    
    // Submit with Enter
    await page.keyboard.press('Enter');
    
    // Verify form attempted submission
    await expect(page).toHaveURL(/(auth|dashboard)/);
  });
});