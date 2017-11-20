# docker-manager


关于安装脚本
----------
安装脚本目前只适合ubuntu，其中包括
 - 通过apt安装docker-ce
 - 用户组管理，使得使用docker时不再需要先打sudo
 - 直接从github上下载docker-compose binary，复制到/usr/local/bin里
 - 安装jq
 
如果脚本下载或者docker pull image 镜像拉取出现问题，也可以在这里寻找适合你环境的解决方案
https://get.daocloud.io/

一些方案已经整合到install.sh脚本当中
 - 下载docker-ce最新版本（TODO：我也还不知道如何下载指定版本的）：``$ ./install.sh dockerCN``
 - 下载docker-compose指定版本如1.14.0：``$ ./install.sh composeCN -c 1.14.0``
 - 加速docker-hub：``$ ./install.sh dockerHubCN``