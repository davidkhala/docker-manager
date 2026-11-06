#!/usr/bin/env bash
helloWorld() {
	docker run hello-world
}
testLinuxContainer() {
	docker run alpine uname
}

container() {
	local image=$1
	local name=$2
	shift 1
	if [[ -n "$name" ]]; then
		shift 1
		docker run -d -p=${hostPort}:${containerPort} --name=${name} $@ $image
		echo $name
	else
		# Ref: https://stackoverflow.com/questions/71083248/how-to-return-random-generated-name-instead-of-id-when-starting-docker-container
		docker run -d -p=${hostPort}:${containerPort} $@ $image | xargs docker container inspect -f '{{ slice .Name 1 }}'
	fi
}
ubuntuBash() {
	docker run -it ubuntu bash
}
"$@"
