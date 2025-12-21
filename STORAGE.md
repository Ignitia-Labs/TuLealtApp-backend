# Configuración de Almacenamiento - MinIO (S3 Compatible)

Esta guía explica cómo configurar y usar MinIO para almacenar imágenes y archivos en el sistema.

## Configuración con Docker

### Desarrollo

MinIO ya está configurado en `docker-compose.yml`. Solo necesitas:

```bash
npm run docker:up
```

Esto iniciará MinIO junto con los demás servicios.

### Acceso a MinIO

- **API Endpoint**: `http://localhost:9000`
- **Console (UI)**: `http://localhost:9001`
- **Usuario por defecto**: `minioadmin`
- **Contraseña por defecto**: `minioadmin`

### Crear Bucket Manualmente

1. Accede a la consola de MinIO: `http://localhost:9001`
2. Inicia sesión con las credenciales por defecto
3. Crea un bucket llamado `tulealtapp-images` (o el nombre configurado en `S3_BUCKET_NAME`)
4. Configura el bucket como público si necesitas acceso directo a las imágenes

## Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `S3_ENDPOINT` | Endpoint de MinIO/S3 | `http://localhost:9000` |
| `S3_ACCESS_KEY_ID` | Access Key ID | `minioadmin` |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key | `minioadmin` |
| `S3_BUCKET_NAME` | Nombre del bucket | `tulealtapp-images` |
| `S3_REGION` | Región (no usado en MinIO pero requerido) | `us-east-1` |
| `S3_FORCE_PATH_STYLE` | Usar path-style URLs | `true` |
| `MINIO_PORT` | Puerto de la API de MinIO | `9000` |
| `MINIO_CONSOLE_PORT` | Puerto de la consola de MinIO | `9001` |
| `MINIO_ROOT_USER` | Usuario root de MinIO | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | Contraseña root de MinIO | `minioadmin` |

### Configuración en `.env.local`

```env
# MinIO Configuration
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=tulealtapp-images
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# MinIO Ports
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

## Uso de la API

### Subir Logo de Partner

```bash
curl -X POST http://localhost:3000/admin/upload/partner-logo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/logo.png"
```

**Response:**
```json
{
  "url": "http://localhost:9000/tulealtapp-images/partners/uuid-logo.png"
}
```

### Subir Logo de Tenant

```bash
curl -X POST http://localhost:3000/admin/upload/tenant-logo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/logo.png"
```

**Response:**
```json
{
  "url": "http://localhost:9000/tulealtapp-images/tenants/uuid-logo.png"
}
```

## Estructura de Almacenamiento

Los archivos se organizan en carpetas dentro del bucket:

```
tulealtapp-images/
├── partners/
│   ├── uuid1-logo.png
│   ├── uuid2-logo.jpg
│   └── ...
├── tenants/
│   ├── uuid1-logo.png
│   ├── uuid2-logo.jpg
│   └── ...
└── ...
```

## Validaciones

- **Formatos permitidos**: jpg, jpeg, png, webp
- **Tamaño máximo**: 5MB por archivo
- **Autenticación**: Requiere token JWT y rol ADMIN

## Integración con Partners y Tenants

Cuando creas un partner o tenant, puedes:

1. **Opción 1**: Subir el logo primero usando el endpoint `/admin/upload/partner-logo` o `/admin/upload/tenant-logo` y luego usar la URL retornada al crear el partner/tenant.

2. **Opción 2**: (Futuro) Enviar el archivo directamente en el request de creación del partner/tenant.

## Producción

Para producción, considera:

1. **Usar AWS S3 real** en lugar de MinIO
2. **Configurar CDN** (CloudFront) para servir las imágenes
3. **Usar URLs firmadas** para acceso temporal a archivos privados
4. **Implementar políticas de bucket** más restrictivas
5. **Configurar backups** automáticos del bucket

### Configuración para AWS S3

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=your-aws-access-key
S3_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-production-bucket
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
```

## Troubleshooting

### Error: "Bucket does not exist"

1. Accede a la consola de MinIO: `http://localhost:9001`
2. Crea el bucket `tulealtapp-images`
3. Configura el bucket como público si es necesario

### Error: "Access Denied"

1. Verifica las credenciales en `.env.local`
2. Asegúrate de que el usuario tenga permisos en el bucket
3. En MinIO Console, verifica las políticas del bucket

### Error: "Connection refused"

1. Verifica que MinIO esté corriendo: `docker ps | grep minio`
2. Verifica el endpoint en las variables de entorno
3. Si estás usando Docker, asegúrate de usar `http://minio:9000` como endpoint dentro de los contenedores

## Scripts Útiles

### Ver logs de MinIO

```bash
docker logs tulealtapp-minio-dev
```

### Reiniciar MinIO

```bash
docker restart tulealtapp-minio-dev
```

### Acceder a MinIO desde línea de comandos

```bash
# Instalar mc (MinIO Client)
brew install minio/stable/mc

# Configurar alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Listar buckets
mc ls local

# Listar archivos en un bucket
mc ls local/tulealtapp-images/partners/
```
