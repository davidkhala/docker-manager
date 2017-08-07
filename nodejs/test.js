const dockerAPIVersion = 'v1.30'
const dockerUtil = require('./dockerode-util')

const containerName = 'hello-world-rename'
const imageName = 'hello-world'

dockerUtil.pullImage(imageName).
		then(data => {
			console.log('pullImage success')
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
		catch(err => {
			console.error(err)
		})
//dev-peer0.pm.delphi.com-delphichaincode-v1