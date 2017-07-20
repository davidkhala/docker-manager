#!/bin/bash

sudo apt-get -y install jq

UP_DOWN="$1"

CURRENT=$(dirname $0)

COMPOSE_FILE=$(jq '.docker.compose' config.json)




function clearContainer() {
    local PATTERN=""
    local IMPOSED_ARR=$(jq -r ".docker.containers.clearPattern.imposed[]" config.json)
    for IMPOSE_EACH in $IMPOSED_ARR; do
        PATTERN="$PATTERN\|"$IMPOSE_EACH
    done
    PATTERN=${PATTERN:2} # substring

    local CONTAINER_IDS=$(docker ps -a | grep "$PATTERN" | awk '{print $1}')

    ./clear.sh container $CONTAINER_IDS
}

function clearImage() {
    local isFast=$1
    local PATTERN=""
    local IMPOSED_ARR=$(jq -r ".docker.images.clearPattern.imposed[]" config.json)
    for IMPOSE_EACH in $IMPOSED_ARR; do
        PATTERN="$PATTERN\|"$IMPOSE_EACH
    done
    PATTERN=${PATTERN:2} # substring

    if [ -z "$isFast" ]; then
        local BASIC=""
        local BASIC_ARR=$(jq -r ".docker.images.clearPattern.fundamental[]" config.json)
        for BASIC_EACH in $BASIC_ARR; do
            BASIC="$BASIC\|"$BASIC_EACH
        done
        BASIC=${BASIC:2} # substring
        if [ ! -z "$BASIC" ]; then
          PATTERN="$PATTERN\|"$BASIC
        fi
    fi
    DOCKER_IMAGE_IDS=$(docker images | grep "$PATTERN" | awk '{print $3}')
    ./clear.sh image $DOCKER_IMAGE_IDS
}

function networkResume() {
    ./onResume.sh
    ./compose.sh up $COMPOSE_FILE

    echo ===resume finished:
    ./docker.sh view
    ./onRefresh.sh
}
function networkUp() {
    ./onUp.sh

    PULL_IMAGES=$(jq '.docker.images.pull[]' config.json)
    ./docker.sh pull $PULL_IMAGES
    networkResume

    echo ===up finished:
    ./docker.sh view
}

function clearHFC(){
    ./clear.sh cache /tmp/hfc-* ~/.hfc-key-store /tmp/fabric-client-kvs_peerOrg*
}
function networkPause() {
    ./compose.sh down $COMPOSE_FILE
    clearContainer
    clearImage fast
    clearHFC

    ./onPause.sh
    echo ===pause finished:
    ./docker.sh view

}
function networkDown() {
    networkPause
    clearImage

    ./onDown.sh
    echo ===down finished:
    ./docker.sh view
}



if [ "${UP_DOWN}" == "up" ]; then
    networkUp
elif [ "${UP_DOWN}" == "down" ]; then
    ## Clear the network
    networkDown
elif [ "${UP_DOWN}" == "restart" ]; then
    ## Restart the network
    networkDown
    networkUp
elif [ "${UP_DOWN}" == "pause" ]; then
    networkPause
elif [ "${UP_DOWN}" == "resume" ]; then
    networkPause
    networkResume
elif [ "${UP_DOWN}" == "refresh" ]; then
    ./onRefresh.sh
else
    ./help.sh
    exit 1
fi
