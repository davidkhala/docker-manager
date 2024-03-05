import {configDaemon, hosts} from '../dockerCmd.js';
import {os} from '@davidkhala/light/devOps.js';
import {DockerodeOption} from '../constants.js';
import {ContainerManager} from '../docker.js';
import assert from 'assert';

describe('docker cli', function () {
	this.timeout(0);

	if (!process.env.CI) {
		// TODO WIP
		if (os.platform === 'linux') {
			const originalConfig = configDaemon();
			console.info(originalConfig);
			it('set Hosts', async () => {

				const content = configDaemon((data) => {
					data.hosts = hosts[os.platform];
					return data;
				});
				console.info(content);
				// TODO restart docker

			});
		}

		it('connect', async () => {

			const docker = new ContainerManager(DockerodeOption());
			const info = await docker.ping();
			assert.strictEqual(info, 'OK');
		});
	}

});