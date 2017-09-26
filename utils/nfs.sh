#!/usr/bin/env bash
fcn=$1
nfsIP=$2
nfsDIR=$3
localDIR=$4
setting="nfs rsize=8192,wsize=8192,timeo=14,intr"
fstab="/etc/fstab"
function add() {
	if ! grep $localDIR $fstab; then
		echo "$nfsIP:$nfsDIR $localDIR $setting" | sudo tee -a $fstab
	fi
}
function rm() {
	# TODO to test
	sed -i "/${localDIR}/d" $fstab
}
function update(){
    rm
    add
}
$fcn
