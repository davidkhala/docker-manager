#!/usr/bin/env bash
fcn=$1
remain_params=""
for ((i = 2; i <= "$#"; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done
function createLocal() {
	docker volume create --name "$1" --opt o=bind --opt device="$2" --opt type=none
}
function delete() {
	docker volume rm --force $1
}
$fcn $remain_params
