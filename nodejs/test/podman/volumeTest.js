import {Podman, PodmanContainerOptsBuilder, socketPath} from "../../podman.js";
import {filedirname} from '@davidkhala/light/es6.mjs'
import assert from 'assert'
filedirname(import.meta)

describe('podman volume', function (){
	this.timeout(0)
	const podman = new Podman({socketPath})
	it('volume create and mount', async () => {
		const Name = 'vol'
		const path = __dirname
		const containerName = 'busyBoxV'

		await podman.volumeCreateIfNotExist({Name, path})
		const containerOptsBuilder = new PodmanContainerOptsBuilder('busybox');
		containerOptsBuilder.setVolume(Name, '/web')
		containerOptsBuilder.setName(containerName)
		await podman.containerStart(containerOptsBuilder.opts)


		await podman.containerDelete(containerName);
		await podman.volumeRemove(Name)
	})
})