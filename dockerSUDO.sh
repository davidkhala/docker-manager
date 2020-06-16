#!/usr/bin/env bash
# NOTE PLEASE run this without 'sudo', otherwise ENV $USER will be 'root' instead of current user.
osVersion=`uname -s`
if [[ $osVersion != "Darwin" ]]; then
#     sudo chmod 666 /var/run/docker.sock
    
    
    ## Reference: https://docs.docker.com/engine/install/linux-postinstall/
    sudo groupadd docker
    sudo usermod -aG docker $USER
    newgrp docker
    ## Reference: https://docs.docker.com/engine/install/linux-postinstall/
    
    
fi
