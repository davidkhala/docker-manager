#!/bin/bash

UP_DOWN="$1"

FABRIC_TAG="x86_64-1.0.0-rc1"

ROOTPATH=$(dirname $PWD)

COMPOSE_FILENAME="docker-compose-marblesv3"
COMPOSE_FILE_SUFFIX=".yaml"
COMPOSE_FILE=$COMPOSE_FILENAME-$FABRIC_TAG$COMPOSE_FILE_SUFFIX


echo ROOTPATH=$ROOTPATH


function dockerView() {

    echo =====container
    docker ps -a
    echo =====images
    docker images -a
}

function dkcl() {
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
    DOCKER_IMAGE_IDS=$(docker images | grep "hyperledger\|dev\|none\|couchdb" | awk '{print $3}')
    if [ ! -z "$isFast" ]; then
        echo dkrm isFast=true
        DOCKER_IMAGE_IDS=$(docker images | grep "dev\|none" | awk '{print $3}')
    fi
    echo
    if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" = " " ]; then
        echo "========== No images available for deletion ==========="
    else
        docker rmi -f $DOCKER_IMAGE_IDS
    fi
    echo

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

function dockerPull() {
    for IMAGES in peer orderer couchdb ccenv javaenv kafka zookeeper ca; do

        docker pull hyperledger/fabric-$IMAGES:$FABRIC_TAG
    done
}

function dockerUp() {
    cd ./fabric-sdk-node/test/fixtures
    docker-compose -f $COMPOSE_FILE up -d
    cd -
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

function networkUp() {
    dockerPull
    setupSDK
    dockerUp

    echo ===docker up finished:
    dockerView

    setupChannel
    serverStart

}

function networkResume() {
    dockerUp

    echo ===docker up finished:
    dockerView

    setupChannel
    serverStart
}

function networkDown() {
    dockerDown
    dkrm
    cleanHFC

    if [ -d 'fabric-sdk-node' ]; then
        rm -rf 'fabric-sdk-node'
    fi

    echo ===down finished:
    dockerView
}

function networkPause() {
    dockerDown
    dkrm fast
    cleanHFC

    echo ===pause finished:
    dockerView

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
    serverStart
else
    ./help.sh
    exit 1
fi
