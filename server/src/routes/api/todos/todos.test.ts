import Fastify from 'fastify';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, closeDb } from '../../../db/init.js';
import todosRoutes from './index.js';

function buildApp() {
  const app = Fastify({
    ajv: { customOptions: { removeAdditional: false } },
  });
  app.register(todosRoutes, { prefix: '/api/todos' });
  return app;
}

describe('todos routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    const db = getDb();
    db.exec('DELETE FROM todos');
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    closeDb();
  });

  describe('GET /api/todos', () => {
    it('returns empty array when no todos exist', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/todos' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns all todos with camelCase fields', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text) VALUES ('id-1', 'First todo')").run();
      db.prepare("INSERT INTO todos (id, text) VALUES ('id-2', 'Second todo')").run();

      const res = await app.inject({ method: 'GET', url: '/api/todos' });
      expect(res.statusCode).toBe(200);

      const todos = res.json();
      expect(todos).toHaveLength(2);
      expect(todos[0]).toHaveProperty('id');
      expect(todos[0]).toHaveProperty('text');
      expect(todos[0]).toHaveProperty('completed');
      expect(todos[0]).toHaveProperty('createdAt');
      expect(todos[0]).toHaveProperty('completedAt');
      expect(todos[0]).not.toHaveProperty('created_at');
      expect(todos[0]).not.toHaveProperty('completed_at');
    });

    it('returns completed as boolean, not integer', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text, completed) VALUES ('id-1', 'Done', 1)").run();

      const res = await app.inject({ method: 'GET', url: '/api/todos' });
      const todos = res.json();
      expect(todos[0].completed).toBe(true);
    });
  });

  describe('POST /api/todos', () => {
    it('creates a todo and returns it with 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { text: 'Buy milk' },
      });

      expect(res.statusCode).toBe(201);
      const todo = res.json();
      expect(todo.text).toBe('Buy milk');
      expect(todo.completed).toBe(false);
      expect(todo.completedAt).toBeNull();
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
    });

    it('generates a UUID for the new todo', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { text: 'Test' },
      });

      const todo = res.json();
      expect(todo.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it('returns 400 with { error } format when text is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body).not.toHaveProperty('statusCode');
      expect(body).not.toHaveProperty('message');
    });

    it('returns 400 when text is empty string', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { text: '' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when body has extra fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { text: 'Valid', extra: 'field' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when text exceeds 200 characters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { text: 'a'.repeat(201) },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('marks a todo as completed and sets completedAt', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text) VALUES ('patch-id', 'Test')").run();

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/todos/patch-id',
        payload: { completed: true },
      });

      expect(res.statusCode).toBe(200);
      const todo = res.json();
      expect(todo.completed).toBe(true);
      expect(todo.completedAt).not.toBeNull();
    });

    it('marks a completed todo as incomplete and clears completedAt', async () => {
      const db = getDb();
      db.prepare(
        "INSERT INTO todos (id, text, completed, completed_at) VALUES ('patch-id', 'Test', 1, datetime('now'))",
      ).run();

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/todos/patch-id',
        payload: { completed: false },
      });

      expect(res.statusCode).toBe(200);
      const todo = res.json();
      expect(todo.completed).toBe(false);
      expect(todo.completedAt).toBeNull();
    });

    it('returns 404 when todo does not exist', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/todos/nonexistent',
        payload: { completed: true },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Todo not found' });
    });

    it('returns 400 when completed is not a boolean', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text) VALUES ('patch-id', 'Test')").run();

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/todos/patch-id',
        payload: { completed: 'yes' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when completed is missing', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text) VALUES ('patch-id', 'Test')").run();

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/todos/patch-id',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when body has extra fields', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text) VALUES ('patch-id', 'Test')").run();

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/todos/patch-id',
        payload: { completed: true, extra: 'field' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes a todo and returns 204', async () => {
      const db = getDb();
      db.prepare("INSERT INTO todos (id, text) VALUES ('del-id', 'Delete me')").run();

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/todos/del-id',
      });

      expect(res.statusCode).toBe(204);

      const row = db.prepare("SELECT * FROM todos WHERE id = 'del-id'").get();
      expect(row).toBeUndefined();
    });

    it('returns 404 when todo does not exist', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/todos/nonexistent',
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'Todo not found' });
    });
  });

  describe('CRUD integration', () => {
    it('create → read → update → delete → confirm gone', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { text: 'Integration test' },
      });
      expect(createRes.statusCode).toBe(201);
      const created = createRes.json();
      const id = created.id;

      const listRes = await app.inject({ method: 'GET', url: '/api/todos' });
      expect(listRes.json()).toHaveLength(1);
      expect(listRes.json()[0].id).toBe(id);

      const updateRes = await app.inject({
        method: 'PATCH',
        url: `/api/todos/${id}`,
        payload: { completed: true },
      });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.json().completed).toBe(true);
      expect(updateRes.json().completedAt).not.toBeNull();

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/todos/${id}`,
      });
      expect(deleteRes.statusCode).toBe(204);

      const finalList = await app.inject({ method: 'GET', url: '/api/todos' });
      expect(finalList.json()).toHaveLength(0);
    });
  });
});
