#!/bin/bash

TYPE=$1
TARGET=$2

function container(){
    local CONTAINER_IDS=$1

    echo
    if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
        echo "========== No containers available for deletion =========="
    else
        docker rm $CONTAINER_IDS
    fi
    echo
}

function image(){
    local DOCKER_IMAGE_IDS=$1
    echo
    if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" = " " ]; then
        echo "========== No images available for deletion ==========="
    else
        docker rmi $DOCKER_IMAGE_IDS
    fi
    echo
}

function cache(){
    local files=$1
    echo cache files to remove: $files
    rm -rf $files
}

if [ "${TYPE}" == "container" ]; then
    container $TARGET
elif [ "${TYPE}" == "cache" ]; then
    cache $TARGET
elif [ "${TYPE}" == "image" ]; then
    image $TARGET
else
    echo "Invalid TYPE: $TYPE"
    exit 1
fi

