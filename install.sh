#!/usr/bin/env bash
set -e -x
fcn=$1
remain_params=""
for ((i = 2; i <= ${#}; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done

dockerVersion=17.12.0
composeVersion=1.14.0
jqVersion=1.5
while getopts "d:c:j:" shortname $remain_params; do
	case $shortname in
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

function dockerCN() {
	curl -sSL https://get.daocloud.io/docker | sh
}

function dockerHubCN() {
	curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://105839be.m.daocloud.io
	systemctl restart docker.service # use sudo if needed
}

function composeCN() {
	curl -L https://get.daocloud.io/docker/compose/releases/download/${composeVersion}/docker-compose-$(uname -s)-$(uname -m) >/usr/local/bin/docker-compose
	chmod +x /usr/local/bin/docker-compose
}
function cn(){
    sudo apt-get install -y curl
	dockerCN
    installjq
    composeCN
    dockerHubCN
}
function installjq(){
    if ! jq --version | grep $jqVersion;then
        # install jq for parsing json content
        sudo apt-get update
	    sudo apt-get -qq install -y jq=${jqVersion}*
    fi
}

function default() {
    if ! docker version | grep $dockerVersion;then
        # install docker-ce
        sudo apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual

        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo apt-key fingerprint 0EBFCD88
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        sudo apt-get update
        sudo apt-get -qq install -y --allow-downgrades docker-ce=${dockerVersion}*
    fi
    installjq
    if ! docker-compose version | grep $composeVersion;then
        curl -L https://github.com/docker/compose/releases/download/${composeVersion}/docker-compose-$(uname -s)-$(uname -m) >docker-compose
        chmod +x docker-compose
        sudo mv docker-compose /usr/local/bin/docker-compose
    fi
}

if [ -n "$fcn" ]; then
	$fcn
else
	default
fi
