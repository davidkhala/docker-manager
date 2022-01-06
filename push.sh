ocir() {
    # <region-key>.ocir.io/<tenancy-namespace>/<repo-name>:<tag>
    
    local tenancy_namespace=${3:-cn9yc2hk0gzg}
    local region_key=${2:-'ap-seoul-1'}
    local image=$1

    docker tag $image $region_key.ocir.io/$tenancy_namespace/$image

    docker push $region_key.ocir.io/$tenancy_namespace/$image
    docker image rm --no-prune $region_key.ocir.io/$tenancy_namespace/$image 
}

$@
