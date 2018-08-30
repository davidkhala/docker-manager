package dockersdk

import (
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"strconv"
	. "github.com/docker/go-connections/nat"
)

type ContainerConfig struct {
	Name        string
	Image       string
	Env         []string
	Cmd         []string
	Volumes     map[string]string
	PortMap     map[int]int
	NetworkName string
	Alias       []string
}

func (t ContainerConfig) Build() (config container.Config, hostConfig container.HostConfig, networkingConfig network.NetworkingConfig) {
	var portSet = PortSet{}
	var PortBindings = PortMap{}
	for k, v := range t.PortMap {
		var port = Port(strconv.Itoa(k)) //TODO is this OK
		portSet[port] = struct{}{}
		PortBindings[port] = []PortBinding{{HostPort: strconv.Itoa(v)}}
	}
	var Volumes = map[string]struct{}{}
	var Binds []string
	for k, v := range t.Volumes {
		Volumes[v] = struct{}{}
		Binds = append(Binds, k+":"+v)
	}

	config = container.Config{
		Image:        t.Image,
		Env:          t.Env,
		Cmd:          t.Cmd,
		Volumes:      Volumes,
		ExposedPorts: portSet,
	}

	hostConfig = container.HostConfig{
		Binds:        Binds,
		PortBindings: PortBindings,
	}
	if t.NetworkName != "" {
		if t.Alias == nil {
			t.Alias = []string{t.Name}
		}
		var EndpointsConfig = map[string]*network.EndpointSettings{
			t.NetworkName: {Aliases: t.Alias},
		}
		networkingConfig = network.NetworkingConfig{
			EndpointsConfig: EndpointsConfig,
		}
	}
	return
}
