#!/usr/bin/env bash

fcn=$1

toolSet() {
	#    kubelet: the component that runs on all of the machines in your cluster and does things like starting pods and containers.
	#    kubectl: the command line util to talk to your cluster.
	#    kubeadm: the command to bootstrap the cluster.

	curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
	cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
	apt-get update
	apt-get install -y kubelet kubeadm kubectl
	apt-mark hold kubelet kubeadm kubectl
}
minikube() {
	echo VirtualBox is required for linux system...
	curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.30.0/minikube-linux-amd64 && chmod +x minikube && sudo cp minikube /usr/local/bin/ && rm minikube
}

$fcn
