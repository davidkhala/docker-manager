extract() {
	local image=$1
	docker save $image > $image.tar
}
load() {
	docker image load --input $1

}
trim() {
	echo WARNING! This will remove all images without at least one container associated to them.
	docker image prune -a
}

build() {
	local imageName=$1
	local buildContext=${2:-.}
	# --progress=plain --no-cache: to display full output during build
	# See in: https://stackoverflow.com/questions/52915701/displaying-help-messages-while-docker-build
	docker build --tag="$imageName" --progress=plain --no-cache "$buildContext"
}

$@
