#!/bin/bash

# TODO pull and view

ACTION=$1
if [ "$ACTION" == "view" ]; then
    echo =====container
    docker ps -a
    echo =====images
    docker images -a

elif [ "$ACTION" == "pull" ]; then
    echo =====docker pull process start
    startSeconds=$(date +%s)
    for (( i = 2; i <= $#; i ++ )); do
        docker pull ${!i}
    done
    echo =====docker pull process cousume $(($(date +%s)-startSeconds)) seconds=====

fi




