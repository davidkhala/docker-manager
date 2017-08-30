#!/bin/bash

TYPE=$1

TARGET=""
for (( i = 2; i <= $#; i ++ )); do
    j=${!i}
    TARGET="$TARGET $j"
done
echo target: $TARGET
if [ "${TYPE}" == "container" ]; then
    CONTAINER_IDS=$TARGET

    echo
    if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
        echo "========== No containers available for deletion =========="
    else
        docker rm $CONTAINER_IDS
    fi
    echo
elif [ "${TYPE}" == "image" ]; then

    DOCKER_IMAGE_IDS=$TARGET
    echo
    if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" = " " ]; then
        echo "========== No images available for deletion ==========="
    else
        docker rmi $DOCKER_IMAGE_IDS
    fi
    echo
else
    echo "Invalid TYPE: $TYPE"
    exit 1
fi

