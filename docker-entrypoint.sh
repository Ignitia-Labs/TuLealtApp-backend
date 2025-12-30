#!/bin/sh
set -e

# Verificar si node_modules existe y tiene contenido
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "Instalando dependencias..."
  npm install
fi

# Ejecutar el comando pasado como argumento
exec "$@"

