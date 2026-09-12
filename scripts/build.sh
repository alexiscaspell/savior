#!/usr/bin/env bash
set -euo pipefail

source ./scripts/ambiente.sh

IMAGE_VERSION=${1:-$VERSION}

docker build \
  -f ./backend/Dockerfile \
  --build-arg TAG="$IMAGE_VERSION" \
  -t "${DOCKER_HUB_REPO}/savior:${IMAGE_VERSION}" \
  -t "${DOCKER_HUB_REPO}/savior:latest" \
  ./backend

docker build \
  -f ./frontend/Dockerfile \
  -t "${DOCKER_HUB_REPO}/savior-ui:${IMAGE_VERSION}" \
  -t "${DOCKER_HUB_REPO}/savior-ui:latest" \
  ./frontend

echo "Built:"
echo "  ${DOCKER_HUB_REPO}/savior:${IMAGE_VERSION}"
echo "  ${DOCKER_HUB_REPO}/savior-ui:${IMAGE_VERSION}"
