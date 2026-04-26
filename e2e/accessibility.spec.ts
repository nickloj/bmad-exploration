import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const axeScript = readFileSync(
  resolve(process.cwd(), 'node_modules/axe-core/axe.min.js'),
  'utf-8',
);

interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  nodes: Array<{ html: string; failureSummary: string }>;
}

async function runAxe(page: Page, tags = ['wcag2a', 'wcag2aa', 'wcag21aa']) {
  await page.addScriptTag({ content: axeScript });
  return page.evaluate((t) => {
    return (window as unknown as { axe: { run: (opts: object) => Promise<{ violations: unknown[] }> } })
      .axe.run({ runOnly: { type: 'tag', values: t } });
  }, tags) as Promise<{ violations: AxeViolation[] }>;
}

async function clearTodos(page: Page) {
  const todos = await page.request.get('/api/todos');
  const list = await todos.json() as Array<{ id: string }>;
  await Promise.all(list.map((t) => page.request.delete(`/api/todos/${t.id}`)));
}

async function addTodo(page: Page, text: string) {
  await page.fill('input[placeholder="Add a new task..."]', text);
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(150);
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((v) => `\n  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes[0]?.html ?? ''}`)
    .join('');
}

// ── WCAG AA automated axe scans ───────────────────────────────────────────────

test.describe('WCAG AA — axe automated scans', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTodos(page);
    await page.reload();
    await page.waitForSelector('text=No tasks yet.');
  });

  test('empty state (no todos) passes WCAG AA', async ({ page }) => {
    const { violations } = await runAxe(page);
    expect(violations, `Violations found:${formatViolations(violations)}`).toHaveLength(0);
  });

  test('list with todos passes WCAG AA', async ({ page }) => {
    await addTodo(page, 'Buy groceries');
    await addTodo(page, 'Walk the dog');
    await page.waitForSelector('text=Buy groceries');

    const { violations } = await runAxe(page);
    expect(violations, `Violations found:${formatViolations(violations)}`).toHaveLength(0);
  });

  test('completed todo state passes WCAG AA', async ({ page }) => {
    await addTodo(page, 'Finish report');
    await page.waitForSelector('text=Finish report');
    await page.getByRole('button', { name: 'Mark complete' }).first().click();
    await page.waitForTimeout(200);

    const { violations } = await runAxe(page);
    expect(violations, `Violations found:${formatViolations(violations)}`).toHaveLength(0);
  });

  test('error state passes WCAG AA', async ({ page }) => {
    await page.route('**/api/todos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
      } else {
        route.continue();
      }
    });

    await page.fill('input[placeholder="Add a new task..."]', 'Will fail');
    await page.click('button:has-text("Add")');
    await page.waitForSelector('[role="alert"]');

    const { violations } = await runAxe(page);
    expect(violations, `Violations found:${formatViolations(violations)}`).toHaveLength(0);
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

test.describe('keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTodos(page);
    await page.reload();
    await page.waitForSelector('text=No tasks yet.');
  });

  test('can submit a todo with Enter key', async ({ page }) => {
    await page.fill('input[placeholder="Add a new task..."]', 'Keyboard todo');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Keyboard todo')).toBeVisible();
  });

  test('complete button activatable with Space key', async ({ page }) => {
    await addTodo(page, 'Keyboard action item');
    await page.waitForSelector('text=Keyboard action item');
    await page.getByRole('button', { name: 'Mark complete' }).first().focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible();
  });

  test('input is reachable via Tab from page', async ({ page }) => {
    await page.keyboard.press('Tab');
    const placeholder = await page.evaluate(() =>
      (document.activeElement as HTMLInputElement)?.placeholder,
    );
    expect(placeholder).toBe('Add a new task...');
  });

  test('Add button is reachable via Tab after input', async ({ page }) => {
    await page.keyboard.press('Tab'); // input
    await page.keyboard.press('Tab'); // Add button
    const tagAndText = await page.evaluate(() => {
      const el = document.activeElement as HTMLButtonElement;
      return `${el?.tagName}:${el?.textContent?.trim()}`;
    });
    expect(tagAndText).toMatch(/BUTTON:Add/i);
  });
});

// ── ARIA roles and semantic structure ─────────────────────────────────────────

test.describe('ARIA roles and semantics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTodos(page);
    await page.reload();
    await page.waitForSelector('text=No tasks yet.');
  });

  test('page has a visible h1 heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('My Todos');
  });

  test('todo input has accessible placeholder', async ({ page }) => {
    await expect(page.getByPlaceholder('Add a new task...')).toBeVisible();
  });

  test('complete button has descriptive aria-label (active)', async ({ page }) => {
    await addTodo(page, 'ARIA check');
    await page.waitForSelector('text=ARIA check');
    await expect(page.getByRole('button', { name: 'Mark complete' }).first()).toBeVisible();
  });

  test('complete button aria-label toggles to "Mark incomplete" when done', async ({ page }) => {
    await addTodo(page, 'Toggle label');
    await page.waitForSelector('text=Toggle label');
    await page.getByRole('button', { name: 'Mark complete' }).first().click();
    await expect(page.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible();
  });

  test('delete button has descriptive aria-label', async ({ page }) => {
    await addTodo(page, 'Delete label test');
    await page.waitForSelector('text=Delete label test');
    await expect(page.getByRole('button', { name: 'Delete todo' }).first()).toBeVisible();
  });

  test('error message uses role="alert"', async ({ page }) => {
    await page.route('**/api/todos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'fail' }) });
      } else {
        route.continue();
      }
    });
    await addTodo(page, 'Fail todo');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('todo list renders as <ul> with <li> items', async ({ page }) => {
    await addTodo(page, 'List semantic check');
    await page.waitForSelector('text=List semantic check');
    const listTag = await page.evaluate(() => document.querySelector('ul')?.tagName);
    expect(listTag).toBe('UL');
    const itemTag = await page.evaluate(() => document.querySelector('li')?.tagName);
    expect(itemTag).toBe('LI');
  });

  test('live region present for status announcements', async ({ page }) => {
    const liveRegions = await page.locator('[aria-live]').count();
    expect(liveRegions).toBeGreaterThanOrEqual(1);
  });
});

// ── Touch target size (WCAG 2.5.5) ───────────────────────────────────────────

test.describe('touch target sizes (WCAG 2.5.5 — AA 44×44px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTodos(page);
    await page.reload();
    await page.waitForSelector('text=No tasks yet.');
  });

  test('complete button meets 44×44px minimum', async ({ page }) => {
    await addTodo(page, 'Touch target test');
    await page.waitForSelector('text=Touch target test');
    const size = await page.getByRole('button', { name: 'Mark complete' }).first().boundingBox();
    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
  });

  test('delete button meets 44×44px minimum', async ({ page }) => {
    await addTodo(page, 'Delete touch target');
    await page.waitForSelector('text=Delete touch target');
    const size = await page.getByRole('button', { name: 'Delete todo' }).first().boundingBox();
    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
  });

  test('Add button meets 44×44px minimum', async ({ page }) => {
    const size = await page.getByRole('button', { name: 'Add' }).boundingBox();
    expect(size?.width).toBeGreaterThanOrEqual(44);
    expect(size?.height).toBeGreaterThanOrEqual(44);
  });
});
