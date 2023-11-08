image=$1
Name=$2
shift 1
if [[ -n "$Name" ]]; then
    shift 1
    docker run -d -p=${hostPort}:${containerPort} --name=${Name} $@ $image
    echo $Name
else
    # Ref: https://stackoverflow.com/questions/71083248/how-to-return-random-generated-name-instead-of-id-when-starting-docker-container
    docker run -d -p=${hostPort}:${containerPort} $@ $image | xargs docker container inspect -f '{{ slice .Name 1 }}'
fi
