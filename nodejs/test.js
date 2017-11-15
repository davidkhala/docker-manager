const dockerAPIVersion = 'v1.30'
const dockerUtil = require('./dockerode-util')

const containerName = 'hello-world-rename'
const imageName = 'hello-world:latest'
const delay = (t) => {

	return new Promise(resolve => {
		setTimeout(resolve, t)
	})
}

const createDummy = (dummyName = 'hello-world') => {
	const imageName = 'hello-world'

	return dockerUtil.startContainer({ name: dummyName, Image: imageName })
}
const test1 = () => {
	return dockerUtil.pullImage(imageName).
			then((output) => {
				console.log(`pullImage success`)
				return createDummy(containerName)
			}).
			then(() => {
				return createDummy(containerName)
			}).
			then(container => {
				console.log('container create success', container)
				return dockerUtil.deleteContainer(containerName)
			}).
			then(container => {
				console.log('container delete success', container)
				return dockerUtil.deleteImage(imageName)
			}).
			then(data => console.log('final data', data)).

			then(() => dockerUtil.deleteImage(imageName)).
			catch(err => {
				console.error(err)
			})
}

const testVolume = () => {
	const Docker = require('dockerode')
	const docker = new Docker()
	return docker.run('ubuntu', [''], null, {
		AttachStdout:false,

		AttachStderr:false,
		'Volumes': {
			'/stuff': {}
		},
		'ExposedPorts': {
			'80': {}
		},
		name:"fine",
		'Hostconfig': {
			'Binds': ['/home/david/Documents/docker-manager:/stuff'],
			'PortBindings': {
				"80": [
					{
						"HostPort": "8081"
					}
				]
			}
		}
	}).then((err,data,container)=>{
		if (err) {
			console.error(err)
		} else {

			console.log(data.StatusCode)
		}
	})
}
testVolume()
//dev-peer0.pm.delphi.com-delphichaincode-v1

