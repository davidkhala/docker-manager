# docker-manager


 About install.sh
----------
 - 安装docker-ce(Ubuntu only)
 - 从github上下载安装docker-compose((Ubuntu only))
 - 安装jq
 
如果脚本下载或者docker pull image 镜像拉取出现问题，也可以在这里寻找适合你环境的解决方案
https://get.daocloud.io/

# docker user grant
`dockerSUDO.sh` :
this script help to make docker command runnable without `sudo` prefix (Ubuntu only)

# Notes
- kubeadm@1.12.3 support upper limit is 18.06: https://github.com/kubernetes/minikube/issues/3323

# TODO
- do not re-create wheels, see what fabric using:
    ```
    [[constraint]]
        name = "github.com/fsouza/go-dockerclient"
        version = "1.2.0"
    ```
- [issue][docker][occasional]driver failed programming external connectivity on endpoint peer1.MCC (b8b9151a3542d8b632c3d633d115c9fb8ed69aabf2a868ca33bceda9fd02f92e): Bind for 0.0.0.0:7151 failed: port is already allocated 
- kubeadm init:  
[ERROR Swap]: running with swap on is not supported. Please disable swap
https://github.com/kubernetes/kubeadm/issues/610

- refactor: split docker-swarm api to an optional level
- containerSolidify: container.commit