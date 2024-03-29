import assert from 'assert';
import {consoleLogger} from '@davidkhala/logger/log4.js';
import {ContainerManager, ContainerOptsBuilder} from '../docker.js';
import {hang, ping} from '../cmd.js';
import os from 'os';


const logger = consoleLogger('test:docker');
const manager = new ContainerManager(undefined, logger);

describe('hello-world', function () {
	this.timeout(0);

	const imageName = 'hello-world';
	const containerName = imageName;
	before(async () => {
		await manager.imagePull(imageName);
	});
	it('container start,restart,exec', async () => {

		const containerOptsBuilder = new ContainerOptsBuilder(imageName, []);
		containerOptsBuilder.name = containerName;
		const {opts} = containerOptsBuilder;
		await manager.containerStart(opts);
		await manager.containerRestart(containerName);
	});
	after(async () => {
		await manager.containerDelete(containerName);
		await manager.imageDelete(imageName);
	});

});
if (!(process.env.CI && os.platform() === 'win32')) {

	describe('fabric-tools', function () {
		this.timeout(0);
		const imageName = 'hyperledger/fabric-tools';
		const containerName = 'cli';
		before(async () => {
			await manager.imagePull(imageName);
			const containerOptsBuilder = new ContainerOptsBuilder(imageName, ['cat']);
			containerOptsBuilder.name = containerName;
			containerOptsBuilder.tty = true;
			const {opts} = containerOptsBuilder;
			opts.AttachStdin = true;
			opts.AttachStdout = true;

			await manager.containerStart(opts);
		});
		it('container exec', async () => {
			const result = await manager.containerExec(containerName, {Cmd: ['echo', 'x']});
			assert.equal(result, 'x\n');
		});
		after(async () => {
			await manager.containerDelete(containerName);
		});
	});
}

describe('busy box', function () {
	this.timeout(0);
	const imageName = 'busybox';
	const containerName = 'tool';
	before(async () => {
		await manager.imagePull(imageName);
		const containerOptsBuilder = new ContainerOptsBuilder(imageName, hang);
		containerOptsBuilder.name = containerName;
		const {opts} = containerOptsBuilder;

		await manager.containerStart(opts);

	});
	if (!process.env.GITHUB_ACTIONS) {
		// GitHub runner in Azure doesn't allow ping
		it('ping', async () => {
			const result = await manager.containerExec(containerName, {Cmd: ping('google.com', 3)});
			assert.ok(result.includes('PING google.com'));
			assert.ok(result.includes('--- google.com ping statistics ---'));

		});
	}


	after(async () => {
		await manager.containerDelete(containerName);
	});
});