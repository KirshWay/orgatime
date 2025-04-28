#!/bin/sh
set -e

# Замена переменных окружения в конфигурации nginx
envsubst '${VITE_BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Запускаем nginx
exec "$@"