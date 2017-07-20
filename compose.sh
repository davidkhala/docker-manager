#!/bin/bash
ACTION=$1
COMPOSE_FILE=$2

if [ -f "$COMPOSE_FILE" ]; then
	if [ "$ACTION" == "up" ]; then
		docker-compose -f $COMPOSE_FILE up -d
        echo ===compose up completed
        ./view.sh 
	elif [ "$ACTION" == "down" ]; then
		docker-compose -f $COMPOSE_FILE down
        echo ===compose down completed
        ./view.sh
	else
		echo "Invalid action $ACTION"
		exit 1
	fi

else 
    echo "File not found: $COMPOSE_FILE"
    exit 1
fi
