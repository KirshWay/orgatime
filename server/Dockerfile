FROM node:22-alpine AS base

RUN npm i --global --no-update-notifier --no-fund pnpm@10.33.4

FROM base AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --production --frozen-lockfile

FROM base

RUN apk add --no-cache tzdata
ENV TZ=Europe/Moscow

ENV NODE_ENV=production

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node prisma ./prisma

RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER node

ENTRYPOINT ["sh", "/docker-entrypoint.sh"]

CMD ["pnpm", "start:prod"]
