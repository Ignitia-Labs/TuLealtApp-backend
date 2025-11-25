# Multi-stage Dockerfile para producción
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package.json package-lock.json* ./
COPY tsconfig.json tsconfig.base.json nest-cli.json ./

# Copiar código fuente
COPY apps ./apps
COPY libs ./libs

# Instalar dependencias
RUN npm ci --only=production=false

# Build del proyecto
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copiar package.json para instalar solo dependencias de producción
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar archivos compilados desde el stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Cambiar ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Exponer puerto (se sobrescribirá en docker-compose)
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/admin/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Comando por defecto (se sobrescribirá en docker-compose)
CMD ["node", "dist/apps/admin-api/main.js"]

