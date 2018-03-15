#!/usr/bin/env bash


fcn="$1"
function cn(){
    npm config set registry https://registry.npm.taobao.org/
}
if [ -n "$fcn" ];then
    $fcn
fi

# install nodejs
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get -qq install -y nodejs
