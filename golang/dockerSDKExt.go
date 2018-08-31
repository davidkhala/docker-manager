package dockersdk

import (
	"strings"
	"fmt"
	. "github.com/davidkhala/goutils"
)

func (docker Docker) ContainerStartExt(config ContainerConfig, force bool) {
	var handler = func(errString string) bool {
		if strings.Contains(errString, "Conflict. The container name") {
			if force {
				fmt.Println("to recreate, " + errString)
				docker.ContainerRemove(config.Name)
				docker.ContainerStartExt(config, force)
			}
			return false
		}
		return true
	}
	defer Deferred(handler)
	var id = docker.ContainerCreate(config)
	docker.ContainerStart(id)
}
func (docker Docker) ContainerRemoveIfExist(container string) {
	var handler = func(errString string) bool {
		if strings.Contains(errString, "No such container: ") {
			fmt.Println(errString)
			return false
		} else {
			return true
		}
	}
	defer Deferred(handler)
	docker.ContainerRemove(container)
}
func (docker Docker) ImageExist(imageID string) (exist bool) {
	var handler = func(errString string) bool{
		if strings.Contains(errString, "No such image: "+imageID) {
			fmt.Println(errString)
			exist = false
			return false
		}
		return true
	}
	defer Deferred(handler)
	docker.ImageInspect(imageID)
	exist = true
	return
}