#!/usr/bin/env sh
set -eu
IMAGE_PREFIX=${1:-devsecops}
SERVER_IMAGE="${IMAGE_PREFIX}-server:local"
CLIENT_IMAGE="${IMAGE_PREFIX}-client:local"
command -v docker >/dev/null 2>&1 || { echo "Docker is required to build the image" >&2; exit 127; }
command -v trivy >/dev/null 2>&1 || { echo "Install Trivy first: https://aquasecurity.github.io/trivy/" >&2; exit 127; }
docker build -f docker/Dockerfile.server -t "$SERVER_IMAGE" .
trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed "$SERVER_IMAGE"
docker build -f docker/Dockerfile.client --build-arg "REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:3000}" -t "$CLIENT_IMAGE" .
exec trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed "$CLIENT_IMAGE"
