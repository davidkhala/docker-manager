const Dockerode = require('dockerode')

const docker = new Dockerode()

// @return promise
const deleteContainer = containerName =>
		docker.listContainers({ all: true, limit: 1, filters: { name: [containerName] } }).
				then(containers => {
							console.info('matched', containers)
							if (containers.length) {
								const container0Info = containers[0]
								if (container0Info.State = 'exited') {
									return docker.getContainer(container0Info.Id).remove()
								} else {
									return docker.getContainer(container0Info.Id).kill().remove()
								}

							} else {
								//FIXME:
								throw new Error({status: 204,desc:`empty array`,message:`no container found matching ${containerName}`})
							}

						}
				)

const createDummy = () =>
		docker.createContainer({ Image: 'hello-world', name: 'hello-world' }).then(container => {
			return container.start()
		})
exports.deleteContainer = deleteContainer
exports.createHelloworld = createDummy


