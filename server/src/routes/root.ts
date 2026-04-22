import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => {
    return { status: 'ok' };
  });
};

export default root;
