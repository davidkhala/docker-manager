#!/usr/bin/env bash
set -e
## Note: below is for reference only, please switch to use platform specific install tools
diagnose() {
	ls -al /var/run/docker.sock
}
system-service() {
	# On Debian and Ubuntu, the Docker service is configured to start on boot by default. 
	sudo systemctl enable docker.service
 	sudo systemctl enable containerd.service
	sudo systemctl start docker.service
}
Docker() {
	curl -sSL https://get.docker.com/ | sh
}

$@
