#!/usr/bin/env bash
stop() {
	minikube stop
}
start() {
	minikube start
}
clean() {
	minikube delete
}
view() {
	minikube dashboard
}

$1
