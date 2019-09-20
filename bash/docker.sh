#!/bin/bash

fcn=$1
remain_params=""
for ((i = 2; i <= $#; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
viewContainerPort() {
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
imageTrim(){
#    WARNING! This will remove all images without at least one container associated to them.
    docker image prune -a
}
bash(){
    local containerName=$1
    docker exec -it ${containerName} bash
}
getID(){
    docker ps --no-trunc -aqf "name=^${1}$"
}
logPath(){
    local containerID=$(getID $1)
    echo /var/lib/docker/containers/${containerID}/${containerID}-json.log
}
${fcn} ${remain_params}
