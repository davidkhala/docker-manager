import {socketPath, Podman, PodmanContainerOptsBuilder} from '../../podman.js'
import {filedirname} from '@davidkhala/light/es6.mjs'
import assert from 'assert'

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
});

