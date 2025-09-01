//imports
import { test, expect } from '@playwright/test';

//definiert test mit namen get route
test('get route', async ({ page }) => {
  const from = 'Zürich HB';
  const to = 'Belpstrasse 37, 3008 Bern';

  await page.route('**/api/ors/autocomplete**', route => {
    const urlObject = new URL(route.request().url());
    const text = (urlObject.searchParams.get('text') || '').toLowerCase();
    let features = [];
    if (text.includes('zürich')) features.push({ properties: { label: 'Zürich HB' }, geometry: { coordinates: [8.5402, 47.3782] } });
    if (text.includes('belpstrasse')) features.push({ properties: { label: 'Belpstrasse 37, 3008 Bern' }, geometry: { coordinates: [7.4305, 46.9438] } });
    if (features.length === 0) features = [{ properties: { label: text || 'Ort' }, geometry: { coordinates: [7.44, 46.95] } }];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features }) });
  });

  await page.route('**/api/ors/search**', route => {
    const urlObject = new URL(route.request().url());
    const label = urlObject.searchParams.get('text') || 'Ort';
    const coord = label.includes('Zürich') ? [8.5402, 47.3782] : [7.4305, 46.9438];
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ features: [{ properties: { label }, geometry: { coordinates: coord } }] })
    });
  });

  await page.route('**/api/ors/directions', route => {
    const responseBody = {
      routes: [
        {
          summary: { distance: 12345, duration: 1800 },
          segments: [{ steps: [
              { instruction: 'Geradeaus fahren' },
              { instruction: 'Links abbiegen' },
              { instruction: 'Rechts abbiegen' },
              { instruction: 'Ziel erreicht' }
            ]}]
        }
      ]
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseBody) });
  });

  await page.route('**/api/routes**', route => {
    const method = route.request().method();
    if (method === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    if (method === 'POST') return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
    if (method === 'DELETE') return route.fulfill({ status: 204, body: '' });
    route.continue();
  });

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
