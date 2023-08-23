import {ContainerOptsBuilder, ContainerManager} from '../../podman.js';

async function podman(manager, {HostPort, password}) {
	const Image = 'postgres';
	const opts = new ContainerOptsBuilder(Image, ['postgres']);

	opts.setPortBind(`${HostPort}:5432`);
	opts.setName(Image);
	opts.setEnv([`POSTGRES_PASSWORD=${password}`]);
	await manager.containerStart(opts.opts, undefined, true);
}

describe('podman container start', function () {
	this.timeout(0);
	const manager = new ContainerManager();
	const password = 'password';
	it('postgre', async () => {
		await podman(manager, {HostPort: 6432, password});
		await manager.containerDelete('postgres');
	});

});