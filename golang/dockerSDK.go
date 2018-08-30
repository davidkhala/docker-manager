package dockersdk

import (
	"github.com/docker/docker/client"
	"context"
	"github.com/docker/docker/api/types"
	. "github.com/davidkhala/goutils"
	"github.com/docker/docker/api/types/filters"
	"fmt"
	"io"
	"os"
)

type Docker struct {
	client  *client.Client
	context context.Context
}

func GetClient() Docker {
	_client, err := client.NewEnvClient()
	PanicError(err)
	return Docker{_client, context.Background()}
}
func (docker Docker) ContainerList() []types.Container {
	containers, err := docker.client.ContainerList(docker.context, types.ContainerListOptions{})
	PanicError(err)
	return containers
}
func (docker Docker) ImageList() []types.ImageSummary {
	var listOpts = types.ImageListOptions{All: false}
	var imageSummary, err = docker.client.ImageList(docker.context, listOpts)
	PanicError(err)
	return imageSummary
}

func (docker Docker) ImageInspect(imageID string) (types.ImageInspect) {
	info, _, err := docker.client.ImageInspectWithRaw(docker.context, imageID) //ignore the raw, which is replica of info
	PanicError(err)
	return info
}
func (docker Docker) ImagePrune() types.ImagesPruneReport {
	imagesPruneReport, err := docker.client.ImagesPrune(docker.context, filters.Args{})
	PanicError(err)
	return imagesPruneReport
}

func (docker Docker) ImagePull(imageName string, force bool) {
	var opts = types.ImagePullOptions{All: false}
	if !force {
		var exist = docker.ImageExist(imageName)
		if exist {
			fmt.Println("image " + imageName + " already exist")
			return
		}
	}
	fmt.Println("start image pull " + imageName)
	reader, err := docker.client.ImagePull(docker.context, imageName, opts)
	PanicError(err)
	defer reader.Close()
	io.Copy(os.Stdout, reader)
}

func (docker Docker) ContainerCreate(config ContainerConfig) string {
	mainConfig, hostConfig, networkingConfig := config.Build()
	idResponse, err := docker.client.ContainerCreate(docker.context, &mainConfig, &hostConfig, &networkingConfig, config.Name)
	PanicError(err)
	return idResponse.ID
}
func (docker Docker) ContainerRemove(container string) {
	err := docker.client.ContainerRemove(docker.context, container, types.ContainerRemoveOptions{Force: true})
	PanicError(err)
}

func (docker Docker) ContainerStart(containerID string) {
	err := docker.client.ContainerStart(docker.context, containerID, types.ContainerStartOptions{})
	PanicError(err)
}

//resp, err := cli.ContainerCreate(ctx, &container.Config{
//Image: "alpine",
//Cmd:   []string{"echo", "hello world"},
//Tty:   true,
//}, nil, nil, "")
//if err != nil {
//panic(err)
//}
//
//if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
//panic(err)
//}
//
//statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
//select {
//case err := <-errCh:
//if err != nil {
//panic(err)
//}
//case <-statusCh:
//}
//
//out, err := cli.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true})
//if err != nil {
//panic(err)
//}
//
//io.Copy(os.Stdout, out)
func (docker Docker) ContainerDelete(containerID string) {
	options := types.ContainerRemoveOptions{false, false, true}
	err := docker.client.ContainerRemove(docker.context, containerID, options)
	PanicError(err)
}
