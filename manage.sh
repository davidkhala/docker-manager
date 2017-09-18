#!/bin/bash

sudo apt-get -qq install -y jq

UP_DOWN="$1"

CURRENT="$(dirname $(readlink -f ${BASH_SOURCE}))"

CONFIG_JSON=$CURRENT/config.json
COMPOSE_FILE="$2"

IMAGE_TAG="x86_64-1.0.0"

remain_params=""
for ((i = 3; i <= $#; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
while getopts "v:" shortname $remain_params; do
	case $shortname in
	v)
		echo "set docker image version tag (default: $IMAGE_TAG) ==> $OPTARG"
		IMAGE_TAG=$OPTARG
		;;
	?)
		echo "unknown argument"
		exit 1
		;;
	esac
done

function clearContainer() {
	local PATTERN=""
	local IMPOSED_ARR=$(jq -r ".docker.containers.clearPattern.imposed[]" $CONFIG_JSON)
	for IMPOSE_EACH in $IMPOSED_ARR; do
		PATTERN="$PATTERN\|"$IMPOSE_EACH
	done
	PATTERN=${PATTERN:2} # substring

	local CONTAINER_IDS=$(docker ps -a | grep "$PATTERN" | awk '{print $1}')

	utils/clear.sh container $CONTAINER_IDS
	docker container prune --force # delete all stopped container
}

function clearImage() {
	local isFast=$1
	local PATTERN=""
	local IMPOSED_ARR=$(jq -r ".docker.images.clearPattern.imposed[]" $CONFIG_JSON)
	for IMPOSE_EACH in $IMPOSED_ARR; do
		PATTERN="$PATTERN\|"$IMPOSE_EACH
	done
	PATTERN=${PATTERN:2} # substring

	if [ -z "$isFast" ]; then
		local BASIC=""
		local BASIC_ARR=$(jq -r ".docker.images.clearPattern.fundamental[]" $CONFIG_JSON)
		for BASIC_EACH in $BASIC_ARR; do
			BASIC="$BASIC\|"$BASIC_EACH
		done
		BASIC=${BASIC:2} # substring
		if [ ! -z "$BASIC" ]; then
			PATTERN="$PATTERN\|"$BASIC
		fi
	fi
	DOCKER_IMAGE_IDS=$(docker images | grep "$PATTERN" | awk '{print $3}')
	utils/clear.sh image $DOCKER_IMAGE_IDS
}

function networkResume() {
	callback/onResume.sh
	utils/compose.sh up $COMPOSE_FILE

	echo ===resume finished:
	utils/docker.sh view
	callback/onRefresh.sh
}
function networkUp() {
	callback/onUp.sh

	PULL_IMAGES=$(jq -r '.docker.images.pull[]' $CONFIG_JSON)
	for pullImage in $PULL_IMAGES; do
		utils/docker.sh pull $pullImage:$IMAGE_TAG
	done

	networkResume
	echo ===up finished:
	utils/docker.sh view
}

function networkPause() {
	utils/compose.sh down $COMPOSE_FILE
	clearContainer
	clearImage fast

	callback/onPause.sh
	echo ===pause finished:
	utils/docker.sh view

}
function networkDown() {
	networkPause
	clearImage

	callback/onDown.sh
	echo ===down finished:
	utils/docker.sh view
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
	callback/onRefresh.sh
else
	callback/help.sh
	exit 1
fi
