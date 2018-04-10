#!/usr/bin/env bash
set -e
fcn="$1"
function cn() {
	npm config set registry https://registry.npm.taobao.org/
}
if [ -n "$fcn" ]; then
	$fcn
fi
if ! node --version | grep 'v8.'; then
	# install nodejs
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt-get -qq install -y nodejs
fi
