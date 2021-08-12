#!/usr/bin/env bash
set -e
## Note: below is for reference only, please switch to use platform specific install tools

installCompose() {
		if pip --version ; then 
			pip install docker-compose
		else
			sudo curl -L https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
			sudo chmod +x /usr/local/bin/docker-compose
		fi
}

shipyard() {
	local action=$1
	if [[ ${action} == "install" ]]; then
		curl -sSL https://shipyard-project.com/deploy | sudo bash -s
	elif [[ ${action} == "uninstall" ]]; then
		curl -sSL https://shipyard-project.com/deploy | ACTION=remove sudo -E bash -s cause -E preserves environmental vaiables set
	elif [[ ${action} == "refresh" ]]; then
		curl -sSL https://shipyard-project.com/deploy | ACTION=upgrade sudo bash -s
	fi
}
installDocker() {
	curl -sSL https://get.docker.com/ | sh

}

$@
