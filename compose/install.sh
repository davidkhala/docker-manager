linux-manually() {
	DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
	mkdir -p $DOCKER_CONFIG/cli-plugins
	curl -SL https://github.com/docker/compose/releases/download/v2.32.1/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
	sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
}


RPM() {
	sudo dnf update
	sudo dnf install -y docker-compose-plugin
}
dpkg() {
	sudo apt-get update
	sudo apt-get install -y docker-compose-plugin
}

"$@"
