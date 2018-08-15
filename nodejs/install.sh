#!/usr/bin/env bash
CURRENT=$(
	cd $(dirname ${BASH_SOURCE})
	pwd
)
set -e
fcn=$1
remain_params=""
for ((i = 2; i <= ${#}; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
function packageLock() {
	local CMD="npm config set package-lock $1"
	echo $CMD
	$CMD
}
if [ -n "$fcn" ]; then
	$fcn $remain_params
else
	if ! node --version | grep 'v8.'; then
		# install nodejs
		curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
		sudo apt-get -qq install -y nodejs
	fi
fi
