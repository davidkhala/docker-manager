image=$1
Name={$2}

if [[ -n "$Name" ]]; then
    docker run -d -p=${hostPort}:${containerPort} --name=${Name} $@ $image
    echo $Name
else
    docker run -d -p=${hostPort}:${containerPort} $@ $image | xargs docker container inspect -f '{{ slice .Name 1 }}'
fi
