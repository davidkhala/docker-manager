const Dockerode = require('dockerode')

const docker = new Dockerode()

// @return promise
const deleteContainer = containerName =>
		docker.listContainers({ all: true, limit: 1, filters: { name: [containerName] } }).
				then(containers => {
							if (containers.length) {
								const container0Info = containers[0]
								console.info('matched', container0Info)
								const container0 = docker.getContainer(container0Info.Id)
								if (container0Info.State === 'exited') {
									return container0.remove()
								} else {
									return container0.kill().then(container => container.remove())
								}

							} else {
								const message = `no container found matching ${containerName}`
								console.warn(message)
								return ({ statusCode: 204, reason: `empty array`, json: { message } })
							}

						}
				)

const createDummy = (dummyName = 'hello-world') =>
		docker.listContainers({ all: true, limit: 1, filters: { name: [dummyName] } }).
				then(containers => {
					if (containers.length) {
						//when existing
						return docker.getContainer(containers[0].Id)
					} else {
						return docker.createContainer({ Image: 'hello-world', name: dummyName })
					}
				}).
				then(container => container.start())

exports.deleteContainer = deleteContainer
exports.createHelloworld = createDummy

exports.deleteImage = (imageName) => {
	const image = docker.getImage(imageName)
	return image.remove()
}
exports.pullImage = (imageName) => {
	return docker.pull(imageName)
}


