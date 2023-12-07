#!/bin/bash
host-info(){
	docker system info --format '{{.OSType}}/{{.Architecture}}'
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
monitor(){
	docker stats
}
$@
