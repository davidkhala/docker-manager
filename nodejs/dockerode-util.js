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

	return docker.listImages({ all: true, limit: 1, filter: imageName }).
			then(images => {
						if (images.length) {
							const image = docker.getImage(imageName)
							return image.remove()
						} else {
							const message = `No such image: ${imageName}`
							console.warn(message)
							return {
								reason: 'no such image',
								statusCode: 404,
								json: { message }
							}
						}
					}
			)

}

exports.pullImage = (imageName) => {

	//FIXED: fatal bug: if immediately do docker operation after callback:
	// reason: 'no such container',
	// 		statusCode: 404,
	// 		json: { message: 'No such image: hello-world:latest' } }
	//See discussion in https://github.com/apocas/dockerode/issues/107
	return docker.pull(imageName).then(stream => {
		return new Promise((resolve, reject) => {
			const onProgress = (event) => {}
			const onFinished = (err, output) => {
				if(err){
					//FIXME swallow, do not reject
					console.error(err)
					return resolve(output)
				}else {
					return resolve(output)
				}
			}
			docker.modem.followProgress(stream, onFinished, onProgress)
		})

	})
}


