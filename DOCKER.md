# Docker Setup - TuLealtApp Backend

Esta guía explica cómo usar Docker para ejecutar las APIs en desarrollo y producción.

## Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+

## Desarrollo

### Iniciar todas las APIs en modo desarrollo

```bash
# Construir e iniciar los contenedores
npm run docker:up

# Ver logs en tiempo real
npm run docker:logs

# Detener los contenedores
npm run docker:down
```

### Comandos disponibles

```bash
# Construir imágenes
npm run docker:build

# Iniciar servicios
npm run docker:up

# Detener servicios
npm run docker:down

# Ver logs
npm run docker:logs

# Reiniciar servicios
npm run docker:restart

# Limpiar todo (contenedores, volúmenes e imágenes)
npm run docker:clean
```

### Acceso a las APIs en desarrollo

- **Admin API**: http://localhost:3000/admin
- **Admin API Swagger**: http://localhost:3000/admin/docs
- **Partner API**: http://localhost:3001/partner
- **Partner API Swagger**: http://localhost:3001/partner/docs
- **Customer API**: http://localhost:3002/customer
- **Customer API Swagger**: http://localhost:3002/customer/docs

### Hot Reload

En modo desarrollo, los cambios en el código se reflejan automáticamente gracias a los volúmenes montados y el modo `--watch` de NestJS.

## Producción

### Construir imágenes de producción

```bash
# Construir imágenes optimizadas
npm run docker:build:prod
```

### Iniciar servicios en producción

```bash
# Iniciar servicios en producción
npm run docker:up:prod

# Ver logs
npm run docker:logs:prod

# Detener servicios
npm run docker:down:prod
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
NODE_ENV=production
ADMIN_API_PORT=3000
PARTNER_API_PORT=3001
CUSTOMER_API_PORT=3002
```

### Características de Producción

- **Multi-stage build**: Imágenes optimizadas y más pequeñas
- **Solo dependencias de producción**: Sin devDependencies
- **Usuario no-root**: Ejecución con usuario sin privilegios
- **Healthchecks**: Monitoreo automático del estado de las APIs
- **Restart policies**: Reinicio automático en caso de fallo

## Estructura de Archivos Docker

```
.
├── Dockerfile              # Dockerfile multi-stage para producción
├── Dockerfile.dev          # Dockerfile para desarrollo
├── docker-compose.yml      # Configuración para desarrollo
├── docker-compose.prod.yml # Configuración para producción
└── .dockerignore           # Archivos excluidos del build
```

## Troubleshooting

### Los contenedores no inician

1. Verifica que los puertos no estén en uso:
   ```bash
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   ```

2. Revisa los logs:
   ```bash
   npm run docker:logs
   ```

### Problemas con node_modules

Si hay problemas con las dependencias, limpia y reconstruye:

```bash
npm run docker:clean
npm run docker:build
npm run docker:up
```

### Rebuild después de cambios en package.json

```bash
npm run docker:down
npm run docker:build
npm run docker:up
```

## Health Checks

Cada API expone un endpoint de health check:

- Admin API: `GET /admin/health`
- Partner API: `GET /partner/health`
- Customer API: `GET /customer/health`

Estos endpoints son utilizados por Docker para verificar el estado de los contenedores.

## Red Docker

Todas las APIs están conectadas a la red `tulealtapp-network`, lo que permite la comunicación entre servicios usando los nombres de los contenedores como hostnames.

## Comandos Docker Directos

Si prefieres usar Docker Compose directamente:

```bash
# Desarrollo
docker-compose up -d
docker-compose logs -f
docker-compose down

# Producción
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down
```

