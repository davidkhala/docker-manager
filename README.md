# docker-manager
[![Build Status](https://travis-ci.com/davidkhala/docker-manager.svg?branch=master)](https://travis-ci.com/davidkhala/docker-manager)

## Installation

- 安装 docker-ce [Ubuntu|MacOS]: `./install.sh installDocker`
- 从 github 上下载安装 docker-compose [Ubuntu]: `./install.sh installCompose`
- 安装 jq [Ubuntu|MacOS]: `./install.sh installjq`

如果脚本下载或者 docker pull image 镜像拉取出现问题，也可以在这里寻找适合你环境的解决方案
https://get.daocloud.io/

### docker user grant

`dockerSUDO.sh` :
this script help to make docker command runnable without `sudo` prefix (Ubuntu only)

## Notes

- get container log file location: `./bash/docker.sh logPath <containerName>`
- after `docker login`: `WARNING! Your password will be stored unencrypted in /home/${USER}/.docker/config.json.`

## TODO

- do not re-create wheels, see what fabric using:
  ```
  [[constraint]]
      name = "github.com/fsouza/go-dockerclient"
      version = "1.2.0"
  ```
- [issue][docker][occasional]driver failed programming external connectivity on endpoint peer1.MCC (b8b9151a3542d8b632c3d633d115c9fb8ed69aabf2a868ca33bceda9fd02f92e): Bind for 0.0.0.0:7151 failed: port is already allocated
- refactor: split docker-swarm api to an optional level
- containerSolidify: container.commit
