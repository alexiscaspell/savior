source ./scripts/ambiente.sh

IMAGE_VERSION=${1:-$VERSION}

echo "$DOCKER_HUB_TOKEN" | docker login --username $DOCKER_HUB_USER --password-stdin

docker run --privileged --rm tonistiigi/binfmt --install all

docker buildx rm mybuild || true
docker buildx create --use --name mybuild default || true


docker buildx build --platform linux/arm64,linux/amd64 --push -t $DOCKER_HUB_REPO/$PROYECTO:$IMAGE_VERSION .