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
aws-public(){
	## aws ecr-public
	## Case 1: if we use other non-home region like hongkong, `get-login-password` will prompt error
	## 	Could not connect to the endpoint URL: "https://api.ecr-public.ap-east-1.amazonaws.com/"
	
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/davidkhala
	
	
}
$@
