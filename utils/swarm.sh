#!/usr/bin/env bash
fcn="$1"
remain_params=""
for ((i = 2; i <= $#; i++)); do
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
function viewSwarm() {
	docker node ls
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
