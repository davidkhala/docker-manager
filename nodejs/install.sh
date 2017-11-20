#!/usr/bin/env bash


fcn="$1"
function cn(){
    # install nodejs
    curl -sL https://deb.nodesource.com/setup_6.x | bash -
    apt-get -qq install -y nodejs
    npm config set registry https://registry.npm.taobao.org/
}
if [ -n "$fcn" ];then
    $fcn
else
    # install nodejs
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    apt-get -qq install -y nodejs
fi