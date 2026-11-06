#!/usr/bin/env bash
hostInfo() {
	docker system info --format '{{.OSType}}/{{.Architecture}}'
}
monitor() {
	docker stats
}
"$@"
