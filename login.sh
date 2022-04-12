docker-hub() {
	docker login registry.hub.docker.com
}
ocr() {
	docker login container-registry.oracle.com
}
ocir() {
	local username=${username:-'davidkhala@gmail.com'}
	local tenancy_namespace=${tenancy_namespace:-cn9yc2hk0gzg}
	local region_key=${region_key:-'ap-singapore-1'}

	echo Please use auth_token as password...
	docker login $region_key.ocir.io --username $tenancy_namespace/$username

}
$@
