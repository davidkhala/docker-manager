docker-hub() {
    docker login registry.hub.docker.com
}
ocr() {
    docker login container-registry.oracle.com
}
ocir() {
    local region_key=$1
    local tenancy_namespace=$2
    local username=$3
    echo Please use auth_token as password...
    docker login $region_key.ocir.io --username $tenancy_namespace/$username

}
$@
