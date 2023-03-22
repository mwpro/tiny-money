import { test, expect } from '@playwright/test';


test('add transaction', async ({ page }) => {
  await page.goto('http://localhost:8080/');

  await page.getByRole('button').filter({ hasText: 'add' }).click();
  await page.getByRole('combobox', { name: 'Sprzedawca*' }).click();
  await page.getByRole('combobox', { name: 'Sprzedawca*' }).fill('Testowy sprzeda');
  await page.locator('a').filter({ hasText: 'Testowy sprzedawca' }).click({ force: true});
  //await page.getByRole('spinbutton', { name: 'Kwota wydatku*' }).click();
  await page.getByRole('spinbutton', { name: 'Kwota wydatku*' }).fill('123.45');
  await expect(page.locator('input[aria-label="Kategoria*"]')).toHaveValue("Rozrywka / Książki");
  //await page.getByRole('combobox', { name: 'Tagi' }).click();
  await page.getByRole('combobox', { name: 'Tagi' }).fill('testowy ta');
  await page.locator('a').filter({ hasText: 'Testowy tag' }).click();
  await page.keyboard.press("Escape")
  await page.getByRole('textbox', { name: 'Opis' }).fill('Testowy opis');
  await page.getByRole('button', { name: 'Zapisz', exact: true }).click();

  await expect(page.locator('.v-snack')).toHaveText("Transakcja zapisana");

  // await page.getByRole('cell', { name: '21.03.2023' }).click();
  // await page.getByRole('cell', { name: 'Rozrywka / Książki' }).getByText('Rozrywka / Książki').click();
  // await page.getByText('Testowy sprzedawca').click();
  // await page.getByRole('cell', { name: '123.45 PLN' }).click();
  // await page.getByRole('row', { name: '21.03.2023 Rozrywka / Książki Testowy sprzedawca 123.45 PLN' }).getByText('notes#').click();
  // await page.getByText('Testowy tag').click();
  //
  // await page.getByText('Data dodania: 21.03.2023 Data aktualizacji: 21.03.2023 Tagi: Testowy tag Opis: T').click();
  // await page.getByRole('button').filter({ hasText: 'delete' }).click();
  // await page.getByRole('button', { name: 'Tak' }).click();
});

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//
//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();
//
//   // Expects the URL to contain intro.
//   await expect(page).toHaveURL(/.*intro/);
// });
