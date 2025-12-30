# 📖 Guía para QA: Inicialización del Proyecto con Docker

Esta guía está diseñada para personas sin mucho conocimiento técnico. Te explicaremos paso a paso cómo instalar Docker y ejecutar el proyecto TuLealtApp Backend.

---

## 📋 Tabla de Contenidos

1. [¿Qué es Docker y por qué lo usamos?](#qué-es-docker-y-por-qué-lo-usamos)
2. [Instalación de Docker](#instalación-de-docker)
3. [Verificar la Instalación](#verificar-la-instalación)
4. [Obtener el Código del Proyecto](#obtener-el-código-del-proyecto)
5. [Inicializar el Proyecto](#inicializar-el-proyecto)
6. [Verificar que Todo Funciona](#verificar-que-todo-funciona)
7. [Comandos Útiles](#comandos-útiles)
8. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

---

## 🤔 ¿Qué es Docker y por qué lo usamos?

**Docker** es una herramienta que permite ejecutar aplicaciones dentro de "contenedores" (como cajas virtuales). Esto significa que:

- ✅ No necesitas instalar Node.js, MariaDB u otras herramientas manualmente
- ✅ El proyecto funcionará igual en cualquier computadora
- ✅ Es más fácil de configurar y mantener
- ✅ Todo está aislado y no afecta otras aplicaciones en tu computadora

**Piensa en Docker como una caja mágica que contiene todo lo necesario para que el proyecto funcione.**

---

## 💻 Instalación de Docker

### Paso 1: Descargar Docker Desktop

1. **Abre tu navegador web** (Chrome, Firefox, Safari, etc.)

2. **Ve a la página oficial de Docker Desktop**:
   - **Para Windows/Mac**: https://www.docker.com/products/docker-desktop/
   - O busca en Google: "Docker Desktop download"

3. **Haz clic en el botón "Download"** (Descargar)

4. **Selecciona tu sistema operativo**:
   - Si tienes **Windows**: Descarga "Docker Desktop for Windows"
   - Si tienes **Mac con procesador Intel**: Descarga "Docker Desktop for Mac (Intel)"
   - Si tienes **Mac con procesador Apple Silicon (M1/M2/M3)**: Descarga "Docker Desktop for Mac (Apple Silicon)"

### Paso 2: Instalar Docker Desktop

#### Para Windows:

1. **Ejecuta el archivo descargado** (por ejemplo: `Docker Desktop Installer.exe`)

2. **Sigue el asistente de instalación**:
   - Acepta los términos y condiciones
   - Marca la casilla "Use WSL 2 instead of Hyper-V" (si aparece)
   - Haz clic en "Install" (Instalar)

3. **Cuando termine la instalación**, haz clic en "Close and restart" (Cerrar y reiniciar)

4. **Reinicia tu computadora** si te lo pide

5. **Después de reiniciar**, busca "Docker Desktop" en el menú de inicio y ábrelo

6. **Espera a que Docker se inicie** (verás un ícono de ballena 🐳 en la barra de tareas)

#### Para Mac:

1. **Abre el archivo descargado** (por ejemplo: `Docker.dmg`)

2. **Arrastra el ícono de Docker** a la carpeta "Applications"

3. **Abre Docker Desktop** desde la carpeta Applications

4. **La primera vez que lo abras**, puede pedirte permisos:
   - Haz clic en "Open" (Abrir) cuando aparezca la advertencia de seguridad
   - Ingresa tu contraseña de Mac si te la pide

5. **Espera a que Docker se inicie** (verás un ícono de ballena 🐳 en la barra superior)

### Paso 3: Configuración Inicial de Docker

1. **Cuando Docker Desktop se abra por primera vez**, puede pedirte:
   - Aceptar los términos de servicio
   - Crear una cuenta (opcional, puedes hacer clic en "Skip" si quieres)

2. **Espera a que Docker termine de iniciar**:
   - Verás un mensaje que dice "Docker Desktop is running" (Docker Desktop está corriendo)
   - El ícono de la ballena 🐳 en la barra de tareas debe estar verde o azul

---

## ✅ Verificar la Instalación

Para asegurarnos de que Docker está instalado correctamente, vamos a abrir la **Terminal** (o **Símbolo del sistema** en Windows) y ejecutar un comando.

### Abrir la Terminal

#### En Windows:

1. Presiona la tecla **Windows** + **R**
2. Escribe `cmd` y presiona **Enter**
3. O busca "Símbolo del sistema" o "Command Prompt" en el menú de inicio

#### En Mac:

1. Presiona **Cmd + Espacio** (barra espaciadora)
2. Escribe "Terminal" y presiona **Enter**
3. O ve a Aplicaciones → Utilidades → Terminal

### Ejecutar el Comando de Verificación

En la terminal, escribe el siguiente comando y presiona **Enter**:

```bash
docker --version
```

**Resultado esperado**: Deberías ver algo como:
```
Docker version 24.0.0, build abc123
```

Si ves un número de versión, ¡Docker está instalado correctamente! 🎉

Si ves un error como "docker: command not found", significa que Docker no está instalado o no está en el PATH. Vuelve a revisar la instalación.

---

## 📥 Obtener el Código del Proyecto

Ahora necesitas obtener el código del proyecto. Hay dos formas:

### Opción A: Si tienes acceso al repositorio Git

1. **Abre la Terminal** (como explicamos arriba)

2. **Navega a la carpeta donde quieres guardar el proyecto**. Por ejemplo:
   ```bash
   cd Documents
   ```

3. **Clona el repositorio** (pide a tu equipo el comando exacto, será algo como):
   ```bash
   git clone <URL-del-repositorio>
   ```

4. **Entra a la carpeta del proyecto**:
   ```bash
   cd TuLealtApp-backend
   ```

### Opción B: Si recibes el código en un archivo ZIP

1. **Descomprime el archivo ZIP** en una carpeta (por ejemplo: `Documents/TuLealtApp-backend`)

2. **Abre la Terminal**

3. **Navega a la carpeta del proyecto**:
   ```bash
   cd Documents/TuLealtApp-backend
   ```
   (Ajusta la ruta según donde hayas descomprimido el archivo)

---

## 🚀 Inicializar el Proyecto

Ahora viene la parte más importante: iniciar el proyecto con Docker. Sigue estos pasos **en orden**.

### Paso 1: Abrir la Terminal en la Carpeta del Proyecto

1. **Abre la Terminal** (como explicamos antes)

2. **Navega a la carpeta del proyecto**:
   ```bash
   cd ruta/a/TuLealtApp-backend
   ```

   **Ejemplo en Windows**:
   ```bash
   cd C:\Users\TuNombre\Documents\TuLealtApp-backend
   ```

   **Ejemplo en Mac**:
   ```bash
   cd ~/Documents/TuLealtApp-backend
   ```

3. **Verifica que estás en la carpeta correcta** ejecutando:
   ```bash
   ls
   ```
   (En Windows usa `dir` en lugar de `ls`)

   Deberías ver archivos como `package.json`, `docker-compose.yml`, etc.

### Paso 2: Construir las Imágenes Docker

La primera vez que ejecutes el proyecto, necesitas "construir" las imágenes Docker. Esto puede tardar varios minutos (5-15 minutos dependiendo de tu conexión a internet).

**Ejecuta este comando**:

```bash
npm run docker:build
```

**¿Qué está pasando?**
- Docker está descargando e instalando todas las herramientas necesarias (Node.js, MariaDB, etc.)
- Está preparando el entorno para ejecutar el proyecto
- La primera vez tarda más porque descarga muchas cosas

**Espera a que termine**. Verás muchos mensajes en la pantalla. Cuando termine, deberías ver algo como:
```
Successfully built abc123def456
```

### Paso 3: Iniciar los Servicios

Una vez que las imágenes estén construidas, inicia todos los servicios:

```bash
npm run docker:up
```

**¿Qué está pasando?**
- Docker está iniciando la base de datos (MariaDB)
- Está iniciando el almacenamiento de archivos (MinIO)
- Está iniciando las 3 APIs del proyecto (Admin, Partner, Customer)

**Espera unos segundos** para que todos los servicios se inicien.

### Paso 4: Verificar que los Servicios Están Corriendo

Ejecuta este comando para ver el estado de todos los servicios:

```bash
docker ps
```

**Resultado esperado**: Deberías ver una tabla con 5 servicios corriendo:
- `tulealtapp-mariadb-dev` (Base de datos)
- `tulealtapp-minio-dev` (Almacenamiento)
- `tulealtapp-admin-api-dev` (API de administración)
- `tulealtapp-partner-api-dev` (API de partners)
- `tulealtapp-customer-api-dev` (API de clientes)

Si ves los 5 servicios con estado "Up" o "healthy", ¡todo está funcionando! ✅

### Paso 5: Inicializar la Base de Datos

La primera vez que ejecutas el proyecto, necesitas crear las tablas de la base de datos y agregar datos iniciales. Esto solo se hace **una vez**.

**Ejecuta estos dos comandos** (uno después del otro):

```bash
docker exec tulealtapp-admin-api-dev npm run migration:run
```

Espera a que termine (verás mensajes sobre migraciones). Luego ejecuta:

```bash
docker exec tulealtapp-admin-api-dev npm run seed:all
```

Espera a que termine (verás mensajes sobre seeds).

**¡Listo!** El proyecto está completamente inicializado. 🎉

---

## ✅ Verificar que Todo Funciona

Ahora vamos a verificar que las APIs están funcionando correctamente.

### Paso 1: Verificar los Logs

Para ver los logs (mensajes) de todos los servicios, ejecuta:

```bash
npm run docker:logs
```

Deberías ver mensajes que indican que las APIs están corriendo. Presiona **Ctrl + C** para salir de los logs.

### Paso 2: Abrir las APIs en el Navegador

Abre tu navegador web y visita estas URLs:

1. **Admin API (Documentación Swagger)**:
   ```
   http://localhost:3000/admin/docs
   ```
   Deberías ver una página con documentación de la API.

2. **Partner API (Documentación Swagger)**:
   ```
   http://localhost:3001/partner/docs
   ```

3. **Customer API (Documentación Swagger)**:
   ```
   http://localhost:3002/customer/docs
   ```

4. **MinIO Console (Almacenamiento de archivos)**:
   ```
   http://localhost:9001
   ```
   - Usuario: `minioadmin`
   - Contraseña: `minioadmin`

Si puedes ver estas páginas, **¡el proyecto está funcionando correctamente!** ✅

### Paso 3: Verificar el Usuario Admin

Después de ejecutar los seeds, puedes iniciar sesión con:
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

---

## 🛠️ Comandos Útiles

Aquí tienes los comandos más importantes que necesitarás usar:

### Ver Logs (Mensajes) de los Servicios

```bash
npm run docker:logs
```

Para ver los logs de un servicio específico:
```bash
docker logs tulealtapp-admin-api-dev -f
```

### Detener los Servicios

```bash
npm run docker:down
```

Esto detiene todos los servicios pero **NO borra los datos** de la base de datos.

### Reiniciar los Servicios

```bash
npm run docker:restart
```

Útil si algo no funciona y quieres reiniciar todo.

### Ver el Estado de los Servicios

```bash
docker ps
```

Muestra qué servicios están corriendo.

### Limpiar Todo (CUIDADO)

```bash
npm run docker:clean
```

⚠️ **ADVERTENCIA**: Este comando **borra todo** (contenedores, datos de la base de datos, imágenes). Solo úsalo si quieres empezar desde cero.

---

## 🔧 Solución de Problemas Comunes

### Problema 1: "docker: command not found"

**Solución**: Docker no está instalado o no está corriendo.
1. Abre Docker Desktop
2. Espera a que el ícono de la ballena 🐳 esté verde/azul
3. Vuelve a intentar el comando

### Problema 2: "Cannot connect to the Docker daemon"

**Solución**: Docker Desktop no está corriendo.
1. Abre Docker Desktop
2. Espera a que se inicie completamente
3. Vuelve a intentar

### Problema 3: Los servicios no inician o se detienen inmediatamente

**Solución**: Revisa los logs para ver qué está pasando:
```bash
docker logs tulealtapp-admin-api-dev
docker logs tulealtapp-mariadb-dev
```

### Problema 4: "Port already in use" (Puerto ya en uso)

**Solución**: Algo más está usando los puertos 3000, 3001, 3002, 3306, 9000 o 9001.
1. Detén los servicios: `npm run docker:down`
2. Cierra otras aplicaciones que puedan estar usando esos puertos
3. Vuelve a iniciar: `npm run docker:up`

### Problema 5: La base de datos no se conecta

**Solución**:
1. Verifica que MariaDB esté corriendo: `docker ps | grep mariadb`
2. Espera unos segundos más (la base de datos tarda en iniciar)
3. Revisa los logs: `docker logs tulealtapp-mariadb-dev`

### Problema 6: "npm: command not found" en los comandos npm

**Solución**: Necesitas tener Node.js instalado para usar los comandos `npm run`.
- **Opción A**: Instala Node.js desde https://nodejs.org/
- **Opción B**: Usa los comandos de Docker directamente:
  ```bash
  docker-compose build
  docker-compose up -d
  docker-compose logs -f
  docker-compose down
  ```

### Problema 7: Los cambios en el código no se reflejan

**Solución**:
1. Verifica que estés usando `docker-compose.yml` (no `docker-compose.prod.yml`)
2. Reinicia los servicios: `npm run docker:restart`
3. Espera unos segundos para que se recarguen

### Problema 8: "Error: Cannot find module"

**Solución**: Las dependencias no están instaladas en el contenedor.
1. Reconstruye las imágenes: `npm run docker:build`
2. O accede al contenedor e instala manualmente:
   ```bash
   docker exec -it tulealtapp-admin-api-dev sh
   npm install
   exit
   ```

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir esta guía sigues teniendo problemas:

1. **Revisa los logs** de los servicios para ver mensajes de error
2. **Verifica que Docker Desktop esté corriendo**
3. **Consulta con tu equipo de desarrollo** y comparte:
   - El error exacto que ves
   - Los logs del servicio que falla
   - Tu sistema operativo (Windows/Mac) y versión

---

## 🎉 ¡Felicitaciones!

Si llegaste hasta aquí y todo funciona, ¡has inicializado el proyecto correctamente! Ahora puedes:

- ✅ Probar las APIs usando Swagger (http://localhost:3000/admin/docs)
- ✅ Ejecutar pruebas manuales
- ✅ Reportar bugs y problemas

**Recuerda**: Cada vez que quieras trabajar con el proyecto:
1. Abre Docker Desktop
2. Abre la Terminal en la carpeta del proyecto
3. Ejecuta: `npm run docker:up`
4. Espera unos segundos a que todo inicie

**Para detener el proyecto**:
- Ejecuta: `npm run docker:down`

---

**Última actualización**: Esta guía está diseñada para el proyecto TuLealtApp Backend. Si el proyecto cambia, esta guía puede necesitar actualizaciones.

