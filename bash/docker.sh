#!/bin/bash
hello-world(){
	docker run hello-world
}
test-linux-container(){
	docker run alpine uname
}
view-container-port() {
	CMD="docker container port $1 $2"
	if [[ -n "$2" ]]; then
		if [[ "$3" == "--ip" ]]; then
			${CMD} | awk '{split($0,a,":"); print a[1]}'
			exit 0
		else
			${CMD} | awk '{split($0,a,":"); print a[2]}'
			exit 0
		fi
	fi
	$CMD
}
image-trim() {
	#    WARNING! This will remove all images without at least one container associated to them.
	docker image prune -a
}
build-image() {
	local imageName=$1
	local buildContext=${2:-.}
	# --progress=plain --no-cache: to display full output during build
	# See in: https://stackoverflow.com/questions/52915701/displaying-help-messages-while-docker-build
	docker build --tag="$imageName" --progress=plain --no-cache "$buildContext" 
}
bash() {
	docker run -it ubuntu bash
}
get-ID() {
	docker ps --no-trunc -aqf "name=^${1}$"
}
log-path() {
	local containerID=$(get-ID $1)
	echo /var/lib/docker/containers/${containerID}/${containerID}-json.log
}
$@
