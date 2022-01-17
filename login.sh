docker-hub() {
    docker login registry.hub.docker.com
}
ocr() {
    docker login container-registry.oracle.com
}
ocir() {
    local username=${1:-'davidkhala@gmail.com'}
    local region_key=${2:-'ap-seoul-1'}
    local tenancy_namespace=${3:-cn9yc2hk0gzg}
    
    echo Please use auth_token as password...
    docker login $region_key.ocir.io --username $tenancy_namespace/$username

}
$@
