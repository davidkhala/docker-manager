package dockersdk

import (
	"github.com/docker/docker/client"
	"context"
	"github.com/docker/docker/api/types"
)

type Docker struct {
	client  *client.Client
	context context.Context
}

func GetClient() Docker {
	_client, err := client.NewEnvClient()
	if err != nil {
		panic(err)
	}
	return Docker{_client, context.Background()}
}
func (docker Docker) ContainerList() []types.Container {
	containers, err := docker.client.ContainerList(docker.context, types.ContainerListOptions{})
	if err != nil {
		panic(err)
	}
	return containers
}
func (docker Docker) ContainerCreate(containerName string, Env []string, Cmd []string) string{
	config := types.ExecConfig{Env: Env, Cmd: Cmd}
	var idResponse types.IDResponse
	idResponse, err := docker.client.ContainerExecCreate(docker.context, containerName, config)
	if err != nil {
		panic(err)
	}
	return idResponse.ID
}
func (docker Docker) ContainerDelete(containerID string) {
	options := types.ContainerRemoveOptions{false, false, true}
	err := docker.client.ContainerRemove(docker.context, containerID, options)
	if err != nil {
		panic(err)
	}
}
