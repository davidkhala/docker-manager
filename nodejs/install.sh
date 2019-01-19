#!/usr/bin/env bash
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
		if [ $(uname) == "Darwin" ]; then
			brew install node@8
			echo 'export PATH="/usr/local/opt/node@8/bin:$PATH"' >> ~/.bash_profile
			export LDFLAGS="-L/usr/local/opt/node@8/lib"
            export CPPFLAGS="-I/usr/local/opt/node@8/include"
		else
			curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
			sudo apt-get -qq install -y nodejs
		fi
	fi
fi
