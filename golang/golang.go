package dockersdk

import (
	"github.com/docker/docker/client"
)

func GetClient()  {
	cli, err := client.NewEnvClient()
	if err != nil {
		panic(err)
	}
}
