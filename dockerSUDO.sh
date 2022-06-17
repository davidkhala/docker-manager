#!/usr/bin/env bash
rootless(){
  # NOTE PLEASE run this without 'sudo', otherwise ENV $USER will be 'root' instead of current user.
  echo "See in https://docs.docker.com/engine/security/rootless/"
  curl -fsSL https://get.docker.com/rootless | sh
  export DOCKER_HOST=unix:///run/user/$UID/docker.sock
}
rootfull(){
  sudo groupadd docker
  sudo usermod -aG docker $USER
  newgrp docker
}

$@
