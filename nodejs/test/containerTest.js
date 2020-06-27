const logger = require('khala-logger/log4js').consoleLogger('test:docker');
const DockerManager = require('../docker');
describe('container test', () => {
	const dockerManager = new DockerManager(undefined, logger);
	before(async function () {
		this.timeout(30000);
		const imageName = 'hello-world';
		await dockerManager.imagePull(imageName);
	});
	it('container start:restart', async () => {
		await dockerManager.containerStart()
	});

});
