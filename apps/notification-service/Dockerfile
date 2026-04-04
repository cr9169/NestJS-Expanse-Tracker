FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/notification-service/package*.json ./apps/notification-service/

RUN npm ci --workspaces --if-present

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/notification-service/ ./apps/notification-service/

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/notification-service

FROM node:20-alpine AS production

WORKDIR /app

RUN mkdir -p /data && chown node:node /data

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/notification-service/dist ./apps/notification-service/dist
COPY --from=builder /app/apps/notification-service/package.json ./apps/notification-service/
COPY --from=builder /app/package.json ./

RUN npm ci --omit=dev --workspaces --if-present

USER node

EXPOSE 3004

CMD ["node", "apps/notification-service/dist/main.js"]
