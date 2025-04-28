# Базовый образ Node.js с Alpine Linux
FROM node:23-alpine AS base

# Установка pnpm - менеджера пакетов
RUN npm i --global --no-update-notifier --no-fund pnpm

# Этап сборки приложения
FROM base as build

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml ./
# Установка всех зависимостей
RUN pnpm install

# Копирование исходного кода
COPY --chown=node:node . .
RUN pnpm prisma:generate
# Сборка приложения
RUN pnpm build

# Этап установки продакшн-зависимостей
FROM base as dependencies

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml ./
# Установка только продакшн-зависимостей
RUN pnpm install --production

# Финальный этап - основной образ
FROM base

# Установка часового пояса
RUN apk add --no-cache tzdata
ENV TZ=Europe/Moscow

# Установка режима NODE_ENV в production
ENV NODE_ENV production

# Установка рабочей директории
WORKDIR /app

# Копирование необходимых файлов
COPY package.json pnpm-lock.yaml ./
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
# COPY --chown=node:node .env* ./

# Копирование entrypoint скрипта
COPY --chown=node:node docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Переключение на пользователя node для безопасности
USER node

# Используем entrypoint скрипт
ENTRYPOINT ["/docker-entrypoint.sh"]

# Команда запуска приложения
CMD ["pnpm", "start:prod"]