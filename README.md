# docker-manager

## Installation

安装 docker-ce [Ubuntu|MacOS]: `./install.sh Docker`


### docker user grant

`dockerSUDO.sh` :
this script help to make docker command runnable without `sudo` prefix

## Notes

- get container log file location: `./bash/docker.sh logPath <containerName>`
- after `docker login`: `WARNING! Your password will be stored unencrypted in /home/${USER}/.docker/config.json.`


## Caveats
- [Docker Userland proxy is not any good](https://github.com/moby/moby/issues/14856)
    - [heavy CPU resource waste](https://franckpachot.medium.com/high-cpu-usage-in-docker-proxy-with-chatty-database-application-disable-userland-proxy-415ffa064955)
    - Use case1: When a container connected to another Docker network tries to reach the service (Docker is blocking direct communication between Docker networks);
    - Use case2： When a local process tries to reach the service through loopback interface.
