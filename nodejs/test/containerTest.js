import {consoleLogger} from 'khala-logger/log4js'
import DockerManager from '../docker.js';
const logger = consoleLogger('test:docker');
import ContainerOptsBuilder from '../containerOptsBuilder.js';

describe('container Opts builder', () => {
	it('constructor', () => {
		new ContainerOptsBuilder('image', 'sh');
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
		const containerOptsBuilder = new ContainerOptsBuilder(imageName, []);
		containerOptsBuilder.setName(containerName);
		const opts = containerOptsBuilder.build();
		await dockerManager.containerStart(opts);
		await dockerManager.containerRestart(containerName);
	});
	after(async () => {
		await dockerManager.containerDelete(containerName);
		await dockerManager.imageDelete(imageName);
	});

});
