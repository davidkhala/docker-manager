#!/usr/bin/env bash
# install docker-ce
sudo apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual

sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce

# add user as root
sudo gpasswd -a $USER docker
# NOTE newgrp starts a subshell with the group you specified. So that line in your script will not finish until that subshell is done.
newgrp docker <<input
input

# install docker-compose
sudo su - -c "curl -L https://github.com/docker/compose/releases/download/1.14.0/docker-compose-$(uname -s)-$(uname -m) > /usr/local/bin/docker-compose"
sudo su - -c "chmod +x /usr/local/bin/docker-compose"

# install jq for parsing json content
sudo apt-get -qq install -y jq
