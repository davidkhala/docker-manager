#!/usr/bin/env bash

init() {
	sudo kubeadm init --ignore-preflight-errors Swap
}
pullImages() {
	kubeadm config images pull
}
$1
