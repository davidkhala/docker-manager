ocir() {
    # <region-key>.ocir.io/<tenancy-namespace>/<repo-name>:<tag>
    local region_key=$1
    local tenancy_namespace=$2
    local image=$3
    docker tag $image $region_key.ocir.io/$tenancy_namespace/$image

    docker push $region_key.ocir.io/$tenancy_namespace/$image
    docker image rm --no-prune $region_key.ocir.io/$tenancy_namespace/$image 
}

$@
