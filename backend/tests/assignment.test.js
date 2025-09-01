//imports
import { test, expect } from '@playwright/test';

//definiert test mit namen get route
test('get route', async ({ page }) => {
  const from = 'Zürich HB';
  const to = 'Belpstrasse 37, 3008 Bern';

  //öffnet applikation im Browser
  await page.goto('http://localhost:3000/');

  //fülle start und zielort aus und clickt den button
  await page.getByLabel(/Start:?/i).fill(from);
  await page.getByLabel(/End:?/i).fill(to);
  await page.getByRole('button', { name: /Absenden/i }).click();

  //speichert wo sich die anzeige der routen befindet
  const steps = page.locator('#steps');

  //prüft, ob die route angezeigt wird wie erwartet
  await expect(page.locator('#ergebnis')).toBeVisible({ timeout: 30000 });
  await expect(steps.locator('li').first()).toBeVisible({ timeout: 30000 });
  await expect(steps.locator('li')).toHaveCountGreaterThan(0);

  await expect(page.locator('#ergebnis')).toContainText(/Distance|Distanz/i);
});

expect.extend({
  async toHaveCountGreaterThan(received, min) {
    const count = await received.count();
    if (count > min) {
      return { pass: true, message: () => `count ${count} > ${min}` };
    }
    return { pass: false, message: () => `expected count > ${min}, got ${count}` };
  },
});