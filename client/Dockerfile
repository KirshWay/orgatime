FROM node:22-alpine AS build

RUN npm i -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

ARG PROJECT_ENVIRONMENT=production
ARG VITE_BACKEND_URL
ARG VITE_SITE_DOMAIN
ARG VITE_SUPPORT_EMAIL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_SITE_DOMAIN=${VITE_SITE_DOMAIN}
ENV VITE_SUPPORT_EMAIL=${VITE_SUPPORT_EMAIL}

RUN pnpm build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
