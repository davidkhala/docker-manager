const Dockerode = require('dockerode');

const docker = new Dockerode();
const Log4js = require('log4js');
const logger = Log4js.getLogger('dockerode');
logger.level = 'debug';
// @return promise
exports.deleteContainer = containerName => {
	logger.debug(`--delete container ${containerName}`);
	const container = docker.getContainer(containerName);
	return container.inspect().then((containInfo) => {
		logger.info('---- before delete', containInfo.State);
		//TODO possible status:[created|restarting|running|removing|paused|exited|dead]
		if (['exited', 'created', 'dead'].includes(containInfo.State.Status)) {

			//remove() return no data in callback
			return container.remove();

		} else {
			return container.kill().then(container => container.remove());
		}
	}).catch(err => {
		if (err.reason === 'no such container' && err.statusCode === 404) {
			//swallow
			logger.info(`---- ${containerName} not found. deleting skipped`);
			return Promise.resolve();
		} else throw err;
	});
};
exports.startContainer = (createOptions) => {
	return module.exports.createContainer(createOptions).then(compositeContainer => {
		if (['exited', 'created'].includes(compositeContainer.State.Status)) {
			return compositeContainer.start();
		} else return compositeContainer;
	});
};
exports.createContainer = (createOptions) => {
	const { name: containerName, Image: imageName } = createOptions;
	const container = docker.getContainer(containerName);
	return container.inspect().then(containerInfo => {
		logger.info(`${containerName} exist `, containerInfo.State);
		container.State = containerInfo.State;
		return container;
	}).catch(err => {
		if (err.reason === 'no such container' && err.statusCode === 404) {
			//swallow
			logger.info(`${containerName} not exist. creating`);

			return createImage(imageName).
				then(image => docker.createContainer(createOptions).
					then(newContainer =>
						newContainer.inspect().then(containerInfo => {
							newContainer.State = containerInfo.State;
							return newContainer;
						})
					)
				);
		} else throw err;

	});
};

exports.deleteImage = (imageName) => {
	const image = docker.getImage(imageName);
	return image.inspect().then(imageInfo => {
		logger.info('delete image', imageInfo.RepoTags);
		return image.remove();
	}).catch(err => {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(`image ${imageName} not exist, skip deleting`);
			return Promise.resolve();
		} else throw err;
	});
};
const createImage = (imageName) => {
	const image = docker.getImage(imageName);
	return image.inspect().then(imageInfo => {
		logger.info('image exist', imageInfo.RepoTags);
		return image;
	}).catch(err => {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(`image ${imageName} not exist, pulling`);
			return module.exports.pullImage(image).then(pulloutput => image);
		} else throw err;
	});
};
exports.pullImage = (imageName) => {

	//FIXED: fatal bug: if immediately do docker operation after callback:
	// reason: 'no such container',
	// 		statusCode: 404,
	// 		json: { message: 'No such image: hello-world:latest' } }
	//See discussion in https://github.com/apocas/dockerode/issues/107
	return docker.pull(imageName).then(stream => {
		return new Promise((resolve, reject) => {
			const onProgress = (event) => { };
			const onFinished = (err, output) => {
				if (err) {
					logger.error('pull image error', { err, output });
					return reject(err);
				} else {
					return resolve(output);
				}
			};
			docker.modem.followProgress(stream, onFinished, onProgress);
		});

	});
};


