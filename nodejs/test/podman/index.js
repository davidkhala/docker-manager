import DockerManager from '../../docker.js';
import {socketPath} from '../../podman.js'
import assert from 'assert'

describe('podman', function () {
	this.timeout(0)
	const docker = new DockerManager({socketPath})
	it('ping', async () => {
		const info = await docker.ping();
		assert.strictEqual(info, "OK")
	})
	it('pull', async () => {
		const image = 'couchdb:3.1.1'
		await docker.imageDelete(image)
		await docker.imagePull(image)
	})

});

