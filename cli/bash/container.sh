#!/usr/bin/env bash
viewPort() {
	CMD="docker container port $1 $2"
	if [[ -n "$2" ]]; then
		if [[ "$3" == "--ip" ]]; then
			${CMD} | awk '{split($0,a,":"); print a[1]}'
			return 0
		else
			${CMD} | awk '{split($0,a,":"); print a[2]}'
			return 0
		fi
	fi
	$CMD
}
getID() {
	docker ps --no-trunc -aqf "name=^${1}$"
}
"$@"
