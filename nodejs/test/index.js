import assert from 'assert';
import {ContainerManager} from '../docker.js';

describe('docker', () => {

	it('ping', async () => {
		const docker = new ContainerManager();
		const info = await docker.ping();
		assert.strictEqual(info, 'OK');
	});

});

