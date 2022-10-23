viaPIP(){
	pip install docker-compose
}
mannually(){
	DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
	mkdir -p $DOCKER_CONFIG/cli-plugins
	curl -SL https://github.com/docker/compose/releases/download/v2.12.1/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
	sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
}
$@
