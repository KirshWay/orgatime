# Этап сборки
FROM node:22-alpine AS build

# Установка pnpm
RUN npm i -g pnpm

# Рабочая директория
WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml ./

# Установка зависимостей
RUN pnpm install

# Копирование исходного кода
COPY . .

# Установка переменных окружения для сборки
ARG PROJECT_ENVIRONMENT=production
# ARG VITE_BACKEND_URL
# ARG VITE_SITE_DOMAIN
# ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_SITE_DOMAIN=http://example.com

# Сборка приложения
RUN pnpm build

# Этап финальной сборки
FROM nginx:alpine

# Копирование собранных файлов в директорию nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копирование конфигурации nginx как шаблон
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Копирование entrypoint скрипта
# COPY ./docker-entrypoint.sh /docker-entrypoint.sh
# RUN chmod +x /docker-entrypoint.sh

# Открываем порт
EXPOSE 80

# Используем entrypoint скрипт
# ENTRYPOINT ["/docker-entrypoint.sh"]

# Запускаем nginx в фоновом режиме
CMD ["nginx", "-g", "daemon off;"] 