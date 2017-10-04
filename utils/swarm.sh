#!/usr/bin/env bash
fcn="$1"
remain_params=""
for ((i = 2; i <= "$#"; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
function viewService() {
	docker node ps "$1" # default to view current node
}
function viewNode() {
	local isPretty="--pretty"
	if [ ! "$2" == "$isPretty" ]; then
		isPretty=""
	fi
	echo $isPretty
	if [ -z "$1" ]; then
		docker node inspect self $isPretty
	else
		docker node inspect "$1" $isPretty
	fi
}
function view() {
	docker node ls
}
function managerToken(){
	docker swarm join-token manager | grep docker| awk '{$1=$1};1'
}
function create() {
	local ip="$1"
	docker swarm init --advertise-addr=${ip}
}
function restore(){
	# when too much manager is lost and consensus corrupted, re-initiate is needed See in https://github.com/docker/swarmkit/issues/891
	local thisIP=$1 # 192.168.0.167:2377
	docker swarm init --force-new-cluster --advertise-addr=${thisIP}
}
function getNodeID() {
	local hostName="$1"
	viewNode "$hostName" --pretty | grep "ID" | awk '{print $2}'
}
function getNodeIP() {
	viewNode "$1" | jq -r ".[0].ManagerStatus.Addr" | awk '{split($0, a, ":");print a[1]}'
}
function getNodeLabels(){
    viewNode "$1" | jq ".[0].Spec.Labels"
}
function addNodeLabels() {
	local node="$1"
	local remain_params=""
	for ((i = 2; i <= "$#"; i++)); do
		j=${!i}
		remain_params="$remain_params $j"
	done
	local labels=""
	for entry in $remain_params; do
		labels="$labels --label-add $entry"
	done

	docker node update $labels $node

}
function rmNodeLabels(){
    local node="$1"
	local remain_params=""
	for ((i = 2; i <= "$#"; i++)); do
		j=${!i}
		remain_params="$remain_params $j"
	done
	local labels=""
	for entry in $remain_params; do
		labels="$labels --label-rm $entry"
	done

	docker node update $labels $node
}
$fcn $remain_params
