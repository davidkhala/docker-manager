extract(){
  local image=$1
  docker save $image > $2
}
load(){
  docker image load --input $1

}
trim() {
	echo    WARNING! This will remove all images without at least one container associated to them.
	docker image prune -a
}
$@
