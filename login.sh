docker-hub() {
    docker login registry.hub.docker.com
}
ocr() {
    docker login container-registry.oracle.com
}
ocir() {
    local region_key=${1:-'ap-seoul-1'}
    local tenancy_namespace=${2:-cn9yc2hk0gzg}
    local username=${3:-'davidkhala@gmail.com'}
    echo Please use auth_token as password...
    docker login $region_key.ocir.io --username $tenancy_namespace/$username

}
$@
