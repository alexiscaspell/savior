#!/usr/bin/env bash
set -euo pipefail

source ./scripts/ambiente.sh

IMAGE_VERSION=${1:-$VERSION}
BACKEND_IMAGE="${DOCKER_HUB_REPO}/savior"
FRONTEND_IMAGE="${DOCKER_HUB_REPO}/savior-ui"

echo "$DOCKER_HUB_TOKEN" | docker login --username "$DOCKER_HUB_USER" --password-stdin

docker run --privileged --rm tonistiigi/binfmt --install all
docker buildx rm saviorbuild 2>/dev/null || true
docker buildx create --use --name saviorbuild

echo "Building & pushing ${BACKEND_IMAGE}:${IMAGE_VERSION}"
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  --push \
  --build-arg TAG="$IMAGE_VERSION" \
  -t "${BACKEND_IMAGE}:${IMAGE_VERSION}" \
  -t "${BACKEND_IMAGE}:latest" \
  -f ./backend/Dockerfile \
  ./backend

echo "Building & pushing ${FRONTEND_IMAGE}:${IMAGE_VERSION}"
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  --push \
  -t "${FRONTEND_IMAGE}:${IMAGE_VERSION}" \
  -t "${FRONTEND_IMAGE}:latest" \
  -f ./frontend/Dockerfile \
  ./frontend

echo "Done."
echo "  ${BACKEND_IMAGE}:${IMAGE_VERSION}"
echo "  ${FRONTEND_IMAGE}:${IMAGE_VERSION}"
