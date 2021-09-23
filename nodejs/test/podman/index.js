const DockerManager = require('../../docker');
const assert = require('assert')

describe('remote docker', () => {

	it('podman', async () => {
		const socketPath = '/run/podman/podman.sock'
		const docker = new DockerManager({socketPath})
		const info = await docker.ping();
		assert.strictEqual(info, "OK")
	})
});

