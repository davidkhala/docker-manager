#!/bin/bash

local restartDesc=$1
local resumeDesc=$2
local refreshDesc=$3
echo "Description "
echo
echo "manage docker project"
echo
echo "USAGE: "
echo
echo "./manage.sh up|down|restart|pause|resume|refresh"
echo "      - 'up|down|restart';      ---- consume time a lot, only for first time install or refactor case"
echo "        -- delete, pull all related images in/to local machine "
echo "        "
echo $restartDesc
echo "        "
echo "        -- + all things 'pause|resume' will do"
echo "      - 'pause|resume';     recommended for daily use"
echo "        -- delete, build all related containers"
echo "        "
echo $resumeDesc
echo "        "
echo "        -- + all things 'refresh' will do "
echo "      - 'refresh';    light weight operation, eg. start node server, npm run a script"
echo "        "
echo $refreshDesc
