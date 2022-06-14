import {socketPath, Podman} from '../../podman.js'
import {filedirname} from '@davidkhala/light/es6.mjs'
import assert from 'assert'
import ContainerOptsBuilder from "../../containerOptsBuilder.js";
filedirname(import.meta)

describe('podman', function () {
	this.timeout(0)
	const podman = new Podman({socketPath})
	it('ping', async () => {
		const ok = await podman.ping();
		assert.strictEqual(ok, "OK")
		const info = await podman.info()
		console.info(info)
	})
	it('pull', async () => {
		const image = 'couchdb:3.1.1'
		await podman.imageDelete(image)
		await podman.imagePull(image)
		await podman.imageDelete(image)
	})
	it('volume create and mount', async () => {
		const Name = 'vol'
		const path = __dirname
		const containerName = 'centosContainer'

		await podman.containerDelete(containerName);
		await podman.volumeRemove(Name)

		await podman.volumeCreateIfNotExist({Name, path})
		const containerOptsBuilder = new ContainerOptsBuilder('busybox');
		containerOptsBuilder.setVolume(Name, '/web')
		containerOptsBuilder.setName(containerName)
		await podman.containerStart(containerOptsBuilder.opts)
		await podman.containerStart(containerOptsBuilder.opts)

	})
});

