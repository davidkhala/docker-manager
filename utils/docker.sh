#!/bin/bash

# TODO pull and view

fcn=$1
remain_params=""
for ((i = 2; i <= $#; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
function pullBatch() {
	echo =====docker batch pull process start
	startSeconds=$(date +%s)
	for ((i = 1; i <= $#; i++)); do
		docker pull ${!i}
	done
	echo =====docker pull process cousume $(($(date +%s) - startSeconds)) seconds=====
}
function pullIfNotExist() {
	if [ -z $(docker images -q $1) ]; then
		docker pull $1
	fi
}
function viewContainerPort() {
	CMD="docker container port $1 $2"
	if [ -n "$2" ]; then
		if [ "$3" == "--ip" ]; then
			$CMD | awk '{split($0,a,":"); print a[1]}'
			exit 0
		else
			$CMD | awk '{split($0,a,":"); print a[2]}'
			exit 0
		fi
	fi
	$CMD
}

$fcn $remain_params
