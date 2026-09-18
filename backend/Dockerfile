# --- deps: install once, reused by the build stage ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts && npx --yes true
COPY prisma ./prisma
RUN npx prisma generate

# --- build: compile TypeScript ---
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# --- runtime: only production deps + compiled output ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh && chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/main.js"]
