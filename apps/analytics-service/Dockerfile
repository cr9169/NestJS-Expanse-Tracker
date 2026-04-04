FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/analytics-service/package*.json ./apps/analytics-service/

RUN npm ci --workspaces --if-present

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/analytics-service/ ./apps/analytics-service/

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/analytics-service

FROM node:20-alpine AS production

WORKDIR /app

RUN mkdir -p /data && chown node:node /data

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/analytics-service/dist ./apps/analytics-service/dist
COPY --from=builder /app/apps/analytics-service/package.json ./apps/analytics-service/
COPY --from=builder /app/package.json ./

RUN npm ci --omit=dev --workspaces --if-present

USER node

EXPOSE 3003

CMD ["node", "apps/analytics-service/dist/main.js"]
