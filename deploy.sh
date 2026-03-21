#!/bin/bash
# deploy.sh — Ejecutar en el VPS después de subir los archivos
# Uso: bash deploy.sh

set -e

DEPLOY_DIR="/opt/neoarcade"
IMAGE_TAR="neoarcade.tar.gz"

echo "▶ Creando directorio de deploy..."
mkdir -p "$DEPLOY_DIR/nginx"
mkdir -p "$DEPLOY_DIR/certs"

echo "▶ Cargando imagen Docker..."
docker load < "$IMAGE_TAR"

echo "▶ Copiando archivos de configuración..."
cp docker-compose.prod.yml "$DEPLOY_DIR/docker-compose.yml"
cp nginx/neoarcade.conf    "$DEPLOY_DIR/nginx/neoarcade.conf"
cp certs/origin.pem        "$DEPLOY_DIR/certs/origin.pem"
cp certs/origin.key        "$DEPLOY_DIR/certs/origin.key"

echo "▶ Levantando contenedores..."
cd "$DEPLOY_DIR"
docker compose up -d --force-recreate

echo "▶ Estado:"
docker compose ps

echo ""
echo "✅ NEOARCADE deployed en https://arcadeneo.com"
