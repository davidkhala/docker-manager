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


## Caveats
- [Docker Userland proxy is not any good](https://github.com/moby/moby/issues/14856)
    - [heavy CPU resource waste](https://franckpachot.medium.com/high-cpu-usage-in-docker-proxy-with-chatty-database-application-disable-userland-proxy-415ffa064955)
    - Use case1: When a container connected to another Docker network tries to reach the service (Docker is blocking direct communication between Docker networks);
    - Use case2： When a local process tries to reach the service through loopback interface.
## TODO

- do not re-create wheels, see what fabric using:
  ```
  [[constraint]]
      name = "github.com/fsouza/go-dockerclient"
      version = "1.2.0"
  ```
- containerSolidify: container.commit
