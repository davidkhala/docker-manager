# This file is not a standalone executable but the next piping part to decorating docker command

# Usecase: Return container-name instead of docker id after docker run
container-name() {
    xargs docker container inspect -f '{{ slice .Name 1 }}'
}
$@
