const DockerManager = require('../docker');


describe('remote docker', () => {

	it('local', async () => {
		const docker = new DockerManager();
		const info = await docker.ping();
		console.log(info);
	});
	it.skip('podman', async () => {
		const socketPath = '/run/podman/podman.sock'
		const docker = new DockerManager({socketPath})
		const info = await docker.ping();
		console.log(info);
	})
});

