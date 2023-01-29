source ./scripts/ambiente.sh

cp fly.toml.template fly.toml

pfx="\${"
sfx="}"

sed -i -e "s#${pfx}DOCKER_HUB_REPO${sfx}#${DOCKER_HUB_REPO}#g" \
        -e "s#${pfx}PROYECTO${sfx}#${PROYECTO}#g" \
        -e "s#${pfx}VERSION${sfx}#${VERSION}#g" fly.toml

flyctl deploy
