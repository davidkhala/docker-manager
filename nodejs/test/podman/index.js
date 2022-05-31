import DockerManager from '../../docker.js';
import {socketPath} from '../../podman.js'
import assert from 'assert'

describe('remote docker', () => {

	it('podman', async () => {

		const docker = new DockerManager({socketPath})
		const info = await docker.ping();
		assert.strictEqual(info, "OK")
	})
});

