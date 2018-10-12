# docker-manager


关于安装脚本
----------
安装脚本目前只适合ubuntu，其中包括
 - 通过apt安装docker-ce
 - 从github上下载安装docker-compose
 - 安装jq
 
如果脚本下载或者docker pull image 镜像拉取出现问题，也可以在这里寻找适合你环境的解决方案
https://get.daocloud.io/

# dockerSUDO.sh
this script help to make docker command runnable without `sudo` prefix

# TODO
- test on mac machine: docker version mismatch, nodejs 