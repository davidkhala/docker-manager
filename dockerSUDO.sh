#!/usr/bin/env bash
# NOTE PLEASE run this without 'sudo', otherwise ENV $USER will be 'root' instead of current user.
echo "See in https://docs.docker.com/engine/security/rootless/"
curl -fsSL https://get.docker.com/rootless | sh
export PATH=/usr/bin:$PATH
export DOCKER_HOST=unix:///run/user/1001/docker.sock
