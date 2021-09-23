const DockerManager = require('../docker');
const assert = require('assert')

describe('remote docker', () => {

	it('local', async () => {
		const docker = new DockerManager();
		const info = await docker.ping();
		assert.strictEqual(info, "OK")
	});

});

