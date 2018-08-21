package dockersdk

import (
	"testing"
	"fmt"
)

func TestDocker_ContainerList(t *testing.T) {
	containers:=GetClient().ContainerList()
	for _, container := range containers {
		fmt.Printf("%s %s\n", container.ID, container.Image)
	}
}