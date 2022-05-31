import DockerManager from '../../docker.js';
import assert from 'assert'
import os from 'os'
describe('remote docker', () => {

	it('show uid', async () => {
		const userInfo = os.userInfo();

		const uid = userInfo.uid;
		console.debug({uid})
	})
	it('podman', async () => {
		const userInfo = os.userInfo();

		const socketPath = `/run/user/${userInfo.uid}/podman/podman.sock`
		const docker = new DockerManager({socketPath})
		const info = await docker.ping();
		assert.strictEqual(info, "OK")
	})
});

