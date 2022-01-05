docker-hub() {
    docker login registry.hub.docker.com
}
ocr() {
    docker login container-registry.oracle.com
}
oci-cr() {
    # TODO
    https://docs.oracle.com/en-us/iaas/Content/Registry/Tasks/registrypushingimagesusingthedockercli.htm
}
$@
