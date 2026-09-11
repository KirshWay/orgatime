import type { FastifyStaticOptions } from '@fastify/static';

export function createStaticAssetOptions(
  uploadsDir: string,
): FastifyStaticOptions {
  return {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (reply) => {
      reply.header('Cache-Control', 'public, max-age=604800, immutable');
      reply.header('Expires', new Date(Date.now() + 604800000).toUTCString());
      reply.header('Vary', 'Accept-Encoding');
    },
  };
}
