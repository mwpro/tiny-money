// auth.setup.ts
import {expect, test as setup} from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('http://localhost:8080/');

  await page.getByTestId("login-button").click();

  await page.locator("input[name=email]").waitFor({ state: "visible"});
  await page.locator("input[name=email]").type(process.env.PLAYWRIGHT_LOGIN);
  await page.locator("input[name=password]").type(process.env.PLAYWRIGHT_PASSWORD);
  await page.getByRole("button").click();

  await expect(page).toHaveTitle("TINY-Money");
  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
