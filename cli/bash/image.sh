#!/usr/bin/env bash
extract() {
	local image=$1
	# 镜像名可能含 / 和 :，替换为 _ 以得到合法的文件名
	local file=${image//[\/:]/_}.tar
	docker save "$image" >"$file"
}
load() {
	docker image load --input $1

}
prune() {
	echo WARNING! This will remove all images without at least one container associated to them.
	sleep 5
	docker image prune -a
}
trim() {
	# keep only the latest images
	docker images --format "{{.Repository}} {{.Tag}} {{.ID}} {{.CreatedAt}}" \
		| sort -k1,1 -k4,4r \
		| awk '
	    {
	      repo=$1;
	      tag=$2;
	      id=$3;
	      if (!seen[repo]++) {
	        # 第一次出现的镜像（最新），保留
	        print "保留: " repo ":" tag " (" id ")";
	      } else {
	        # 其他的候选删除镜像
	        print id;
	      }
	    }
	  ' \
		| grep -v "^保留" \
		| while read img; do
			# 检查是否有容器在使用该镜像
			if docker ps -a --format "{{.Image}}" | grep -q "$img"; then
				echo "跳过: 镜像 $img 正在被容器使用"
			else
				echo "删除: 镜像 $img"
				docker rmi "$img"
			fi
		done

}

build() {
	local imageName=$1
	local buildContext=${2:-.}
	# --progress=plain --no-cache: to display full output during build
	# See in: https://stackoverflow.com/questions/52915701/displaying-help-messages-while-docker-build
	docker build --tag="$imageName" --progress=plain --no-cache "$buildContext"
}

"$@"
