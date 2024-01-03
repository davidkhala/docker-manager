import assert from 'assert';
import {consoleLogger} from '@davidkhala/logger/log4.js';
import {ContainerManager, ContainerOptsBuilder} from '../docker.js';
import {hang, ping} from '../cmd.js';


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
		containerOptsBuilder.setName(containerName);
		const {opts} = containerOptsBuilder;
		await manager.containerStart(opts);
		await manager.containerRestart(containerName);
	});
	after(async () => {
		await manager.containerDelete(containerName);
		await manager.imageDelete(imageName);
	});

});
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
	it('ping', async () => {

		const result = await manager.containerExec(containerName, {Cmd: ping('google.com', 3)});
		console.info(result);
	});
	after(async () => {
		await manager.containerDelete(containerName);
	});
});
describe('postgres', function () {
	this.timeout(0);
	const HostPort = 6432;
	const password = 'password';
	it('container start, stop', async () => {
		const Image = 'postgres';
		const opts = new ContainerOptsBuilder(Image, []); // ['postgres']

		opts.setPortBind(`${HostPort}:5432`);
		opts.setName(Image);
		opts.setEnv([`POSTGRES_PASSWORD=${password}`]);
		const info = await manager.containerStart(opts.opts, undefined, true);
		console.debug(info);
		await manager.containerDelete(Image);
	});
});
