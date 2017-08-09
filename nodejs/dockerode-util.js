const Dockerode = require('dockerode')

const docker = new Dockerode()

// @return promise
const deleteContainer = containerName => {
	const container = docker.getContainer(containerName)
	return container.inspect().then((containInfo) => {
		console.log('delete status', containInfo.State)
		//TODO possible status:[created|restarting|running|removing|paused|exited|dead]
		if (['exited', 'created', 'dead'].includes(containInfo.State.Status)) {

			//remove() return no data in callback
			return container.remove()

		} else {
			return container.kill().then(container => container.remove())
		}
	})
}
const startContainer = (containerName, imageName) => {
	return createContainer(containerName, imageName).then(compositeContainer => {
		if (['exited', 'created'].includes(compositeContainer.State.Status)) {
			return compositeContainer.start()
		} else return compositeContainer
	})
}
const createContainer = (containerName, imageName) => {
	const container = docker.getContainer(containerName)
	return container.inspect().then(containerInfo => {
		console.info(`${containerName} exist`, containerInfo.State)
		container.State = containerInfo.State
		return container
	}).catch(err => {
		if (err.reason === 'no such container' && err.statusCode === 404) {
			//swallow
			console.info(`${containerName} not exist. creating`)

			return createImage(imageName).
					then(image => docker.createContainer({ Image: imageName, name: containerName }).
							then(newContainer =>
									newContainer.inspect().then(containerInfo => {
										newContainer.State = containerInfo.State
										return newContainer
									})
							)
					)
		} else throw err

	})
}
const createDummy = (dummyName = 'hello-world') => {
	const imageName='hello-world'
	return startContainer(dummyName,imageName)
}
const deleteImage = (imageName) => {
	const image = docker.getImage(imageName)
	return image.inspect().then(imageInfo => {
		console.info('delete image', imageInfo.RepoTags)
		return image.remove()
	}).catch(err => {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			console.info(`image ${imageName} not exist, skip deleting`)
		} else throw err
	})
}
const createImage = (imageName) => {
	const image = docker.getImage(imageName)
	return image.inspect().then(imageInfo => {
		console.info('image exist', imageInfo.RepoTags)
		return image
	}).catch(err => {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			console.info(`image ${imageName} not exist, pulling`)
			return pullImage(image).then(pulloutput => image)
		} else throw err
	})
}
const pullImage = (imageName) => {

	//FIXED: fatal bug: if immediately do docker operation after callback:
	// reason: 'no such container',
	// 		statusCode: 404,
	// 		json: { message: 'No such image: hello-world:latest' } }
	//See discussion in https://github.com/apocas/dockerode/issues/107
	return docker.pull(imageName).then(stream => {
		return new Promise((resolve, reject) => {
			const onProgress = (event) => {}
			const onFinished = (err, output) => {
				if (err) {
					console.error('pull image error', { err, output })
					return reject(err)
				} else {
					return resolve(output)
				}
			}
			docker.modem.followProgress(stream, onFinished, onProgress)
		})

	})
}
exports.deleteContainer = deleteContainer
exports.createHelloworld = createDummy
exports.deleteImage = deleteImage
exports.pullImage = pullImage
exports.createContainer = createContainer
exports.startContainer = startContainer


