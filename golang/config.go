package dockersdk

import (
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"strconv"
	. "github.com/davidkhala/goutils"
)

// this is a mimic of nat.portSet
type portSet map[string]struct{}

// this is a mimic of container.Config
type containerConfig struct {
	container.Config
	ExposedPorts portSet
}

func BuildContainerConfig(image string, Env []string, Cmd []string, volumes map[string]string, portMap map[int]int) (config *container.Config, hostConfig *container.HostConfig, networkingConfig *network.NetworkingConfig) {

	var portSet = portSet{}
	for k := range portMap {
		portSet[strconv.Itoa(k)] = struct{}{}
	}
	var Volumes = map[string]struct{}{}
	var Binds []string
	for k, v := range volumes {
		Volumes[v] = struct{}{}
		Binds = append(Binds, k+":"+v)
	}

	var mimicConfig = containerConfig{
		container.Config{
			Image:   image,
			Env:     Env,
			Cmd:     Cmd,
			Volumes: Volumes,
		},
		portSet,
	}
	var jsonTemp = ToJson(mimicConfig)
	FromJson(jsonTemp, &config)
	hostConfig = &container.HostConfig{
		Binds:Binds,
		PortBindings:
	}
}

//
//name: container_name,
//Env,
//Volumes: {
//[peerUtil.container.MSPROOT]: {},
//[ordererUtil.container.CONFIGTX]: {},
//[ordererUtil.container.state]: {}
//},
//Cmd,
//Image,
//ExposedPorts: {
//'7050': {},
//},
//Hostconfig: {
//Binds: [
//`MSPROOT:${peerUtil.container.MSPROOT}`,
//`CONFIGTX:${ordererUtil.container.CONFIGTX}`,
//`ledger:${ordererUtil.container.state}`
//],
//PortBindings: {
//'7050': [
//{
//HostPort: '9050'
//						}
//]
//},
//},
//NetworkingConfig: {
//EndpointsConfig: {
//[network]: {
//Aliases: [container_name]
//}
//}
//}
//config *container.Config, hostConfig *container.HostConfig, networkingConfig *network.NetworkingConfig, containerName string
