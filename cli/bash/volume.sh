#!/usr/bin/env bash

createLocal() {
	local name=$1
	local path=$2
	docker volume create --name ${name} --opt o=bind --opt device=${path} --opt type=none
}
delete() {
	docker volume rm --force $1
}
"$@"
