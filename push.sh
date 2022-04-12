ocir() {
    # Usually, before pushing images to a repository, you'll first create an empty repository in a compartment.
    # The name you give the repository must be unique across all compartments in the entire tenancy(globally).
    # The same docker push will auto-targeting to compartment than root-compartment


    local tenancy_namespace=${3:-cn9yc2hk0gzg}
    local region_key=${2:-'ap-singapore-1'}
    local image=$1

    docker tag $image $region_key.ocir.io/$tenancy_namespace/$image

    docker push $region_key.ocir.io/$tenancy_namespace/$image
    docker image rm --no-prune $region_key.ocir.io/$tenancy_namespace/$image
}

$@
