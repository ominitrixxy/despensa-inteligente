FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund
RUN npx prisma generate
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
EXPOSE 3000
# API:    CMD ["sh","-c","npx prisma migrate deploy && RUN_SCHEDULER=false node dist/main"]
# Worker: CMD ["sh","-c","RUN_SCHEDULER=true node dist/main"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
