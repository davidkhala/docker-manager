#!/usr/bin/env bash
set -e
fcn=$1
remain_params=""
for ((i = 2; i <= ${#}; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done

dockerVersion=19
composeVersion=1.22.0
jqVersion=1.6
while getopts "d:c:j:" shortname ${remain_params}; do
	case ${shortname} in
	d)
		echo "docker-ce version (default: ${dockerVersion}) ==> $OPTARG"
		dockerVersion="$OPTARG"
		;;
	c)
		echo "docker-compose version (default: $composeVersion) ==> $OPTARG"
		composeVersion="$OPTARG"
		;;
	j)
		echo "jq version (default: $jqVersion) ==> $OPTARG"
		jqVersion="$OPTARG"
		;;
	?)
		echo "unknown argument"
		exit 1
		;;
	esac
done

isMacOS() {
	[[ $(uname) == "Darwin" ]]
	return $?
}

isUbuntu20() {
	lsb_release -d | grep "Ubuntu 20."
	return $?
}

installjq() {
	if ! jq --version | grep ${jqVersion}; then
		if isMacOS; then
			brew install jq
		else
			sudo apt update
			sudo apt -qq install -y jq*
		fi

	fi
}

installCompose() {
	if ! docker-compose version | grep ${composeVersion}; then
		if isMacOS; then
			echo There is no recommended way to install docker toolset via commands on MacOS,
			echo more details: https://docs.docker.com/docker-for-mac/install/
			exit 1
		fi
		sudo curl -L https://github.com/docker/compose/releases/download/${composeVersion}/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
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
	if ! docker version | grep ${dockerVersion}; then
		if isMacOS; then
			if ! docker version; then
				brew cask install docker
				open -a Docker
			fi
		elif isUbuntu20; then
			sudo apt install docker.io
		else
			if ! curl --version; then
				sudo apt-get install -y curl
			fi
			sudo apt-get install -y apt-transport-https
			# install docker-ce
			curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
			sudo apt-key fingerprint 0EBFCD88
			sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
			sudo apt-get update
			if docker version; then
				sudo service docker stop
			fi
			sudo apt-get -qq install -y --allow-downgrades docker-ce=${dockerVersion}*
		fi
	fi
}
if [[ -n "$fcn" ]]; then
	${fcn} ${remain_params}
else
	installDocker
	installjq
fi
