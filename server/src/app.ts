import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AutoLoad from '@fastify/autoload';
import cors from '@fastify/cors';
import { type FastifyPluginAsync } from 'fastify';
import { getDb } from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  getDb();

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  });

  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
  });

  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true,
  });
};

export default app;
export { app };
export const options = {
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
  },
};
