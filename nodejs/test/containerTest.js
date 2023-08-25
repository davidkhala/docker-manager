import {consoleLogger} from '@davidkhala/logger/log4.js';
import {ContainerManager, ContainerOptsBuilder} from '../docker.js';
import assert from 'assert';

const logger = consoleLogger('test:docker');

describe('container Opts builder', () => {
	it('constructor', () => {
		assert.throws(() => {
			new ContainerOptsBuilder('image', 'sh');
		});

	});
});
describe('hello-world', function () {
	this.timeout(0);
	const dockerManager = new ContainerManager(undefined, logger);
	const imageName = 'hello-world';
	const containerName = imageName;
	before(async () => {
		await dockerManager.imagePull(imageName);
	});
	it('container start:restart', async () => {

		const containerOptsBuilder = new ContainerOptsBuilder(imageName, []);
		containerOptsBuilder.setName(containerName);
		const {opts} = containerOptsBuilder;
		await dockerManager.containerStart(opts);
		await dockerManager.containerRestart(containerName);
	});
	after(async () => {
		await dockerManager.containerDelete(containerName);
		await dockerManager.imageDelete(imageName);
	});

});
describe('postgres', function () {
	this.timeout(0);
	const manager = new ContainerManager(undefined, logger);
	const HostPort = 6432;
	const password = 'password';
	it('container start, stop', async () => {
		const Image = 'postgres';
		const opts = new ContainerOptsBuilder(Image, []); // ['postgres']

		opts.setPortBind(`${HostPort}:5432`);
		opts.setName(Image);
		opts.setEnv([`POSTGRES_PASSWORD=${password}`]);
		let info = await manager.containerStart(opts.opts, undefined, true);
		console.debug(info);
		await manager.containerDelete(Image);
	});
});
