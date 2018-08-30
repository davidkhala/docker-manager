package dockersdk

import (
	"strings"
	"fmt"
)

func (docker Docker) ContainerCreateStart(config ContainerConfig) {
	var id = docker.ContainerCreate(config)
	docker.ContainerStart(id)
}
func (docker Docker) ContainerDeleteIfExist(container string){
//	No such container: abc
	defer func() {
		err := recover()
		var errString = err.(error).Error()
		if strings.Contains(errString, "No such container: ") {
			fmt.Println(errString)
		} else {
			panic(err)
		}
	}()
	docker.ContainerRemove(container)
}
func (docker Docker) ImageExist(imageID string) (exist bool) {
	defer func() {
		err := recover()
		var errString = err.(error).Error()
		if strings.Contains(errString, "No such image: "+imageID) {
			fmt.Println(errString)
			exist = false
		} else {
			panic(err)
		}
	}()
	docker.ImageInspect(imageID)
	exist = true
	return
}