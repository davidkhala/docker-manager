const DockerManager = require('../docker');


describe('remote docker', () => {

	it('local', async () => {
		const docker = new DockerManager();
		const info = await docker.info();
		console.log(info);
	});
});

