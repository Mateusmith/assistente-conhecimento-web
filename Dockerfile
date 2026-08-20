FROM node:24-alpine AS compilacao

WORKDIR /aplicacao

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8083
ARG VITE_OIDC_AUTHORITY=http://localhost:18084/realms/contextpilot
ARG VITE_OIDC_CLIENT_ID=contextpilot-web
ARG VITE_OIDC_SCOPE="openid profile email"

ENV VITE_API_URL=$VITE_API_URL \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    VITE_OIDC_SCOPE=$VITE_OIDC_SCOPE

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacao /aplicacao/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O - http://127.0.0.1:8080/health || exit 1
