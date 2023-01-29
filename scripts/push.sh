source ./scripts/ambiente.sh

echo "$DOCKER_HUB_TOKEN" | docker login --username $DOCKER_HUB_USER --password-stdin

docker push $DOCKER_HUB_REPO/$PROYECTO:$VERSION
