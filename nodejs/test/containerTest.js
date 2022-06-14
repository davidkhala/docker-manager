import {consoleLogger} from '@davidkhala/logger/log4.js'
import {default as DockerManager, DockerContainerOptsBuilder} from '../docker.js';
const logger = consoleLogger('test:docker');

describe('container Opts builder', () => {
	it('constructor', () => {
		new DockerContainerOptsBuilder('image', 'sh');
	});
});
describe('container test', () => {
	const dockerManager = new DockerManager(undefined, logger);
	const imageName = 'hello-world';
	const containerName = imageName;
	before(async function () {
		this.timeout(0);
		await dockerManager.imagePull(imageName);
	});
	it('container start:restart', async function () {
		this.timeout(0);
		const containerOptsBuilder = new DockerContainerOptsBuilder(imageName, []);
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
