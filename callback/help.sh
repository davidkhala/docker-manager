#!/bin/bash

restartDesc=$1
resumeDesc=$2
refreshDesc=$3
echo "Description "
echo
echo "manage docker project"
echo
echo "USAGE: "
echo
echo "./manage.sh up|down|restart|pause|resume|refresh"
echo "      - 'up|down|restart';      ---- consume time a lot, only for first time install or refactor case"
echo "        -- delete, pull all related images in/to local machine "
echo $restartDesc
echo "        -- + all things 'pause|resume' will do"
echo "      - 'pause|resume';     recommended for daily use"
echo "        -- delete, build all related containers"
echo $resumeDesc
echo "        -- + all things 'refresh' will do "
echo "      - 'refresh';    light weight operation, eg. start node server, npm run a script"
echo $refreshDesc
