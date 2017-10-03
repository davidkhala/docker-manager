#!/usr/bin/env bash
# install docker-ce
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce

# add user as root
sudo gpasswd -a $USER docker
newgrp docker

# install docker-compose
sudo su - -c "curl -L https://github.com/docker/compose/releases/download/1.14.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose"
sudo su - -c "chmod +x /usr/local/bin/docker-compose"
