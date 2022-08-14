import assert from 'assert'
import {socketPath, Container, ContainerOptsBuilder} from '../../podman.js'
import {filedirname} from '@davidkhala/light/es6.mjs'

filedirname(import.meta)

describe('podman', function () {
	this.timeout(0)
	const podman = new Container({socketPath})
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

