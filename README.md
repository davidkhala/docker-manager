# docker-manager


关于安装脚本
----------
 - 安装docker-ce(Ubuntu only)
 - 从github上下载安装docker-compose((Ubuntu only))
 - 安装jq
 
如果脚本下载或者docker pull image 镜像拉取出现问题，也可以在这里寻找适合你环境的解决方案
https://get.daocloud.io/

# dockerSUDO.sh
this script help to make docker command runnable without `sudo` prefix (Ubuntu only)

# TODO
- do not re-create wheels, see what fabric using:
    ```
    [[constraint]]
        name = "github.com/fsouza/go-dockerclient"
        version = "1.2.0"
    ```
     