const dockerAPIVersion = 'v1.30'
const dockerUtil = require('./dockerode-util')

const containerName = 'hello-world-rename'
const imageName = 'hello-world:latest'
const delay = (t) => {

	return new Promise(resolve => {
		setTimeout(resolve, t)
	})
}

dockerUtil.pullImage(imageName).
		then((output) => {
			console.log(`pullImage success`)
			return dockerUtil.createHelloworld(containerName)
		}).
		then(container => {
			console.log('container create success', container)
			return dockerUtil.deleteContainer(containerName)
		}).
		then(container => {
			console.log('container delete success', container)
			return dockerUtil.deleteImage(imageName)
		}).
		then(data => console.log(data)).

		then(() => dockerUtil.deleteImage(imageName)).
		catch(err => {
			console.error(err)
		})
//dev-peer0.pm.delphi.com-delphichaincode-v1