package dockersdk

import (
	"testing"
)

func TestDocker_ContainerList(t *testing.T) {
	containers := GetClient().ContainerList()
	for _, container := range containers {
		t.Log(container)
	}
}
func TestDocker_ImageList(t *testing.T) {
	images := GetClient().ImageList()
	for _, image := range images {
		t.Log(image)
	}
}
func TestDocker_ImageInspect(t *testing.T) {
	a := GetClient().ImageInspect("redis:latest")
	t.Log("a", a)

}
func TestDocker_ImagePrune(t *testing.T) {
	result := GetClient().ImagePrune()
	t.Log(result)
}
