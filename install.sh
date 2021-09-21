#!/usr/bin/env bash
set -e
## Note: below is for reference only, please switch to use platform specific install tools
diagnose() {
	ls -al /var/run/docker.sock
}

Docker() {
	curl -sSL https://get.docker.com/ | sh
}

$@
