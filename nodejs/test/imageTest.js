import {consoleLogger} from '@davidkhala/logger/log4.js'
const logger = consoleLogger('test:docker');
import DockerManager from '../docker.js';
describe('docker image', () => {
	const dockerManager = new DockerManager(undefined, logger);
	it('pull hello-world', async function () {
		this.timeout(30000);
		const imageName = 'hello-world';
		await dockerManager.imagePull(imageName);
		await dockerManager.imageDelete(imageName);
	});
	it('pull if not exist', async function () {
		this.timeout(30000);
		const imageName = 'hello-world';
		await dockerManager.imageCreateIfNotExist(imageName);
		await dockerManager.imageCreateIfNotExist(imageName);
		let imageList = await dockerManager.imageList();
		logger.debug('imageList', imageList);
		imageList = await dockerManager.imageList({all: true});
		logger.debug('imageList: including intermediate images', imageList);
		await dockerManager.imageDelete(imageName);
	});

});
