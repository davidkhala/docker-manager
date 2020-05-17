#!/usr/bin/env bash
logspout() {

	docker run -d --name="logspout" --volume=/var/run/docker.sock:/var/run/docker.sock \
		--publish=127.0.0.1:${PORT}:80 --network ${DOCKER_NETWORK} \
		gliderlabs/logspout
}
