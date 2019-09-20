#!/usr/bin/env bash

fcn=$1

toolSet() {
	#    kubelet: the component that runs on all of the machines in your cluster and does things like starting pods and containers.
	#    kubectl: the command line util to talk to your cluster.
	#    kubeadm: the command to bootstrap the cluster.

	curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
	echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee -a /etc/apt/sources.list.d/kubernetes.list 
	sudo apt-get update
	sudo apt-get install -y kubelet kubeadm kubectl
	# sudo apt-mark hold kubelet kubeadm kubectl
}
minikube() {
	echo VirtualBox is required for linux system...
	curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.30.0/minikube-linux-amd64 && chmod +x minikube && sudo cp minikube /usr/local/bin/ && rm minikube
}

$fcn
