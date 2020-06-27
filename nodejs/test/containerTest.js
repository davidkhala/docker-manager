const logger = require('khala-logger/log4js').consoleLogger('test:docker');
const DockerManager = require('../docker');
const ContainerOptsBuilder = require('../containerOptsBuilder');

describe('container Opts builder', () => {
	it('constructor', () => {
		new ContainerOptsBuilder('image', 'sh');
	});
});
describe('container test', () => {
	const dockerManager = new DockerManager(undefined, logger);
	const imageName = 'hello-world';
	const containerName = imageName;
	it('container start:restart', async () => {
		const containerOptsBuilder = new ContainerOptsBuilder(imageName, []);
		containerOptsBuilder.setName(containerName);
		const opts = containerOptsBuilder.build();
		await dockerManager.containerStart(opts);
		await dockerManager.containerRestart(containerName);
	});
	after(async () => {
		await dockerManager.containerDelete(containerName);
	});

});
