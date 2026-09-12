#!/usr/bin/env bash
set -euo pipefail

source ./scripts/ambiente.sh

IMAGE_VERSION=${1:-$VERSION}

echo "$DOCKER_HUB_TOKEN" | docker login --username "$DOCKER_HUB_USER" --password-stdin

docker push "${DOCKER_HUB_REPO}/savior:${IMAGE_VERSION}"
docker push "${DOCKER_HUB_REPO}/savior:latest"
docker push "${DOCKER_HUB_REPO}/savior-ui:${IMAGE_VERSION}"
docker push "${DOCKER_HUB_REPO}/savior-ui:latest"
