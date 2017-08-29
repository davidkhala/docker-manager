#!/bin/bash

# TODO pull and view

ACTION=$1
if [ "$ACTION" == "view" ]; then
	if [ -z "$2" ]; then
		echo =====container
		docker ps -a
		echo =====images
		docker images -a
	else

		if [ "$2" == "container" ]; then

			if [ "$3" == "port" ]; then
				CMD="docker container port $4 $5"
				if [ -n "$5" ]; then
					if [ "$6" == "--ip" ]; then
						$CMD | awk '{split($0,a,":"); print a[1]}'
						exit 0
					else
						$CMD | awk '{split($0,a,":"); print a[2]}'
						exit 0
					fi
				fi
				$CMD
			else
				echo =====container
				docker ps -a
			fi

		elif [ "$2" == "image" ]; then
			echo =====images
			docker images -a
		else
			:
		fi
	fi

elif [ "$ACTION" == "pull" ]; then
	echo =====docker pull process start
	startSeconds=$(date +%s)
	for ((i = 2; i <= $#; i++)); do
		docker pull ${!i}
	done
	echo =====docker pull process cousume $(($(date +%s) - startSeconds)) seconds=====

fi
