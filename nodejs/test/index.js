import DockerManager from '../docker.js';
import assert from 'assert'

describe('remote docker', () => {

	it('local', async () => {
		const docker = new DockerManager();
		const info = await docker.ping();
		assert.strictEqual(info, "OK")
	});

});

