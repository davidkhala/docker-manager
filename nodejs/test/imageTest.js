import {consoleLogger} from '@davidkhala/logger/log4.js';

const logger = consoleLogger('test:docker');
import {ContainerManager} from '../docker.js';

describe('docker image', function () {
	this.timeout(0);
	const dockerManager = new ContainerManager(undefined, logger);
	it('pull hello-world', async () => {

		const imageName = 'hello-world';
		await dockerManager.imagePull(imageName);
		await dockerManager.image.delete(imageName);
	});
	it('pull if not exist', async () => {
		const imageName = 'hello-world';
		await dockerManager.image.pullIfNotExist(imageName);
		await dockerManager.image.pullIfNotExist(imageName);
		let imageList = await dockerManager.image.list();
		logger.debug('imageList', imageList);
		imageList = await dockerManager.image.list({all: true});
		logger.debug('imageList: including intermediate images', imageList);
		await dockerManager.image.delete(imageName);
	});

});
