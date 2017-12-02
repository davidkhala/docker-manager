#!/usr/bin/env bash
set -e
fcn=$1
remain_params=""
for ((i = 2; i <= ${#}; i++)); do
	j=${!i}
	remain_params="$remain_params $j"
done

dockerVersion=17.09.0~ce-0~ubuntu
composeVersion=1.14.0
jqVersion=1.5+dfsg-1
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
    apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual

	apt-get install -y apt-transport-https ca-certificates curl software-properties-common
	dockerCN
    jq
    composeCN
    dockerHubCN
}
function jq(){
    apt-get update
    # install jq for parsing json content
	apt-get -qq install -y jq=$jqVersion
}

function default() {

	# install docker-ce
	apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual

	apt-get install -y apt-transport-https ca-certificates curl software-properties-common
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
	apt-key fingerprint 0EBFCD88
	add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
	apt-get update
	apt-get -qq install -y docker-ce=$dockerVersion

    jq
	curl -L https://github.com/docker/compose/releases/download/${composeVersion}/docker-compose-$(uname -s)-$(uname -m) >/usr/local/bin/docker-compose
	chmod +x /usr/local/bin/docker-compose

}

if [ -n "$fcn" ]; then
	$fcn
else
	default
fi
