package dockersdk

import (
	"github.com/docker/docker/client"
	"context"
	"github.com/docker/docker/api/types"
	"github.com/davidkhala/delphi-fabric/common/docker/golang/golang"
	"github.com/docker/docker/api/types/filters"
)

type Docker struct {
	client  *client.Client
	context context.Context
}

func GetClient() Docker {
	_client, err := client.NewEnvClient()
	golang.PanicError(err)
	return Docker{_client, context.Background()}
}
func (docker Docker) ContainerList() []types.Container {
	containers, err := docker.client.ContainerList(docker.context, types.ContainerListOptions{})
	golang.PanicError(err)
	return containers
}
func (docker Docker) ImageList() []types.ImageSummary {
	var listOpts = types.ImageListOptions{All: false}
	var imageSummary, err = docker.client.ImageList(docker.context, listOpts)
	golang.PanicError(err)
	return imageSummary
}
func (docker Docker) ImageInspect(imageID string) (*types.ImageInspect) {
	info, _, err := docker.client.ImageInspectWithRaw(docker.context, imageID) //ignore the raw, which is replica of info
	golang.PanicError(err)
	if info.ID == "" {
		return nil
	}
	return &info
}
func (docker Docker) ImagePrune() types.ImagesPruneReport {
	imagesPruneReport, err := docker.client.ImagesPrune(docker.context, filters.Args{})
	golang.PanicError(err)
	return imagesPruneReport
}

func (docker Docker) ImagePull(imageName string, force bool) {
	var opts = types.ImagePullOptions{All: false}
	if !force {
		var exist = docker.ImageInspect(imageName)
		if exist != nil {
			return
		}
	}
	docker.client.ImagePull(docker.context, imageName, opts)
}
func (docker Docker) ContainerCreate(containerName string, Env []string, Cmd []string) string {
	config := types.ExecConfig{Env: Env, Cmd: Cmd}
	var idResponse types.IDResponse
	idResponse, err := docker.client.ContainerExecCreate(docker.context, containerName, config)
	golang.PanicError(err)
	return idResponse.ID
}
func (docker Docker) ContainerDelete(containerID string) {
	options := types.ContainerRemoveOptions{false, false, true}
	err := docker.client.ContainerRemove(docker.context, containerID, options)
	golang.PanicError(err)
}
