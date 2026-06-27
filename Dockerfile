# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build application
RUN npx prisma generate
RUN npm run build

# Stage 2: Execution stage
FROM node:22-alpine AS runner
WORKDIR /app

# Set production env
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build artifacts and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"]
