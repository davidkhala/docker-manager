ocir() {
    # Usually, before pushing images to a repository, you'll first create an empty repository in a compartment.
    # The name you give the repository must be unique across all compartments in the entire tenancy(globally).
    # The same docker push will auto-targeting to compartment than root-compartment

    local tenancy_namespace=${tenancy_namespace:-cn9yc2hk0gzg}
    local region_key=${region_key:-'ap-singapore-1'}
    local image=$1

    docker-hub $region_key.ocir.io/$tenancy_namespace $image
}

docker-hub() {
    local namespace=${1:-davidkhala}
    local image=$2
    docker tag $image $namespace/$image
    docker push $namespace/$image
    docker image rm --no-prune $namespace/$image
}

aws-public() {
    ## aws ecr-public
    local tenancy_namespace=${tenancy_namespace:-davidkhala}
    local image=$1
    docker-hub public.ecr.aws/$tenancy_namespace $image
}

$@
