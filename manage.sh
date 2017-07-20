#!/bin/bash

sudo apt-get -y install jq

UP_DOWN="$1"


ROOTPATH=$(dirname $PWD)

COMPOSE_FILE=$(jq '.docker.compose' config.json)

IMPOSED_CONTAINERS=$(jq '.docker.containers.clearPattern.imposed[]' config.json)
PULL_IMAGES=$(jq '.docker.images.pull[]' config.json)

echo ROOTPATH=$ROOTPATH

function dkcl() {
    # TODO work to here
    CONTAINER_IDS=$(docker ps -aq -f name="peer|example.com|orderer|couchdb")

    echo
    if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
        echo "========== No containers available for deletion =========="
    else
        docker rm -f $CONTAINER_IDS
    fi
    echo
}

function dkrm() {
    local isFast=$1
    local PATTERN=""
    IMPOSED_ARR=$(jq -r ".docker.images.clearPattern.imposed[]" config.json)
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



function setupSDK() {
    # download and setup the SDK
    if [ ! -d 'fabric-sdk-node' ]; then
        echo "git repos 'fabric-sdk-node' not exist, to clone...."
        git clone https://github.com/hyperledger/fabric-sdk-node.git
        cd ./fabric-sdk-node

        git checkout v1.0.0-alpha

        git branch
    else
        cd ./fabric-sdk-node
    fi

    npm install
    npm install -g gulp
    gulp ca

    # use our docker compose file in sdk
    cd -
    cp ./$COMPOSE_FILE fabric-sdk-node/test/fixtures

    # replace config.json - this one does not use tls

    cp ./config.json fabric-sdk-node/test/integration/e2e

}


function dockerDown() {
    if [ -d 'fabric-sdk-node/test/fixtures' ]; then
        cd fabric-sdk-node/test/fixtures
        docker-compose -f $COMPOSE_FILE down
        cd -
    else
        # docker-compose down with local copy of marbles3.yaml
        echo fabric-sdk-node not found: using local compose file
        docker-compose -f $COMPOSE_FILE down
    fi

    dkcl

}

function cleanHFC() {
    rm -rf /tmp/hfc-* ~/.hfc-key-store /tmp/fabric-client-kvs_peerOrg*
}


function networkResume() {
    ./compose.sh up $COMPOSE_FILE
    ./onResume.sh

    ./onRefresh.sh
}
function networkUp() {
    ./docker.sh pull $PULL_IMAGES
    ./onUp.sh
    networkResume

}


function networkPause() {
    ./compose.sh down $COMPOSE_FILE

    ./clear.sh container $IMPOSED_CONTAINERS
    dkrm fast
    cleanHFC

    echo ===pause finished:
    ./docker.sh view

}
function networkDown() {
    ./compose.sh down
    dockerDown
    dkrm
    cleanHFC

    if [ -d 'fabric-sdk-node' ]; then
        rm -rf 'fabric-sdk-node'
    fi

    echo ===down finished:
    ./docker.sh view
}

function serverStart() {
    cd $ROOTPATH
    gulp marbles3
    cd -
}

function setupChannel() {
    cleanHFC
    echo "--create-channel.js"
    cd fabric-sdk-node
    node test/integration/e2e/create-channel.js
    echo "--join-channel.js"
    node test/integration/e2e/join-channel.js
    cd -

    cd $ROOTPATH
    npm install gulp -g
    npm install
    cd -
    node install_chaincode.js
    node instantiate_chaincode.js
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
