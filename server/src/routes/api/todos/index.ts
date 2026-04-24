import { type FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../../db/init.js';
import {
  createTodoSchema,
  updateTodoSchema,
  todoParamsSchema,
} from '../../../schemas/todo.js';

interface DbTodoRow {
  id: string;
  text: string;
  completed: number;
  created_at: string;
  completed_at: string | null;
}

function toTodoResponse(row: DbTodoRow) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed === 1,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

const todos: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error.validation) {
      reply.code(400).send({ error: error.message });
      return;
    }
    reply.code(error.statusCode ?? 500).send({ error: 'Internal server error' });
  });

  fastify.get('/', async () => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM todos ORDER BY created_at ASC').all() as DbTodoRow[];
    return rows.map(toTodoResponse);
  });

  fastify.post<{ Body: { text: string } }>(
    '/',
    { schema: { body: createTodoSchema } },
    async (request, reply) => {
      const db = getDb();
      const id = uuidv4();
      const { text } = request.body;
      db.prepare('INSERT INTO todos (id, text) VALUES (?, ?)').run(id, text);
      const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as DbTodoRow;
      reply.code(201);
      return toTodoResponse(row);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: { completed: boolean } }>(
    '/:id',
    { schema: { params: todoParamsSchema, body: updateTodoSchema } },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params;
      const { completed } = request.body;

      const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as
        | DbTodoRow
        | undefined;
      if (!existing) {
        reply.code(404);
        return { error: 'Todo not found' };
      }

      if (completed) {
        db.prepare("UPDATE todos SET completed = 1, completed_at = datetime('now') WHERE id = ?").run(id);
      } else {
        db.prepare('UPDATE todos SET completed = 0, completed_at = NULL WHERE id = ?').run(id);
      }

      const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as DbTodoRow;
      return toTodoResponse(row);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: todoParamsSchema } },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params;

      const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
      if (result.changes === 0) {
        reply.code(404);
        return { error: 'Todo not found' };
      }

      reply.code(204);
      return reply.send();
    },
  );
};

export default todos;
