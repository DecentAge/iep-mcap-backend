#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

RELEASE_VERSION=$(cat release-version.txt)
docker build -t decentage/iep-mcap-backend:${RELEASE_VERSION} .
docker container rm --force iep-mcap-backend-extr
CONTAINER_ID=$(docker create --rm --name iep-mcap-backend-extr decentage/iep-mcap-backend:${RELEASE_VERSION})
mkdir -p ./build
docker cp ${CONTAINER_ID}:/build/iep-mcap-backend.zip ./build || echo "Could not copy /build/iep-mcap-backend.zip from container"
docker rm ${CONTAINER_ID}
