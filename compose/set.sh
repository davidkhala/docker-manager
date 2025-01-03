up(){
    local remote_file=$1
    shift 1
    curl -L "$remote_file" | docker compose -f - up $@
}
"$@"