const Dockerode = require('dockerode');

const docker = new Dockerode();
exports.docker = docker;
const logger = require('khala-logger').new('dockerode', process.env.deployment === 'debug' ? 4 : 2);

const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 *
 * @enum {string}
 */
const ContainerStatus = {
	created: 'created',
	restarting: 'restarting',
	running: 'running',
	removing: 'removing',
	paused: 'paused',
	exited: 'exited',
	dead: 'dead'
};
exports.ContainerStatus = ContainerStatus;
exports.containerDelete = async containerName => {
	const container = docker.getContainer(containerName);
	try {
		const containInfo = await container.inspect();
		const currentStatus = containInfo.State.Status;
		logger.debug('delete container', containerName, currentStatus);
		if (![ContainerStatus.exited, ContainerStatus.created, ContainerStatus.dead].includes(currentStatus)) {
			await container.kill();
		}
		return await container.remove();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such container') {
			logger.info(err.json.message, 'deleting skipped');
		} else {
			throw err;
		}
	}
};

/**
 *
 * @param {containerOpts} createOptions
 * @returns {Promise<*>}
 */
exports.containerStart = async (createOptions) => {
	const {name: containerName, Image: imageName} = createOptions;
	let container = docker.getContainer(containerName);
	let info;

	try {
		info = await container.inspect();
		logger.info('container found', containerName, info.State.Status);

	} catch (err) {
		if (err.reason === 'no such container' && err.statusCode === 404) {
			logger.info(err.json.message, 'creating');
			await exports.imageCreateIfNotExist(imageName);
			container = await docker.createContainer(createOptions);
			info = await container.inspect();
		} else {
			throw err;
		}
	}
	const start = async (c, retryCountDown) => {
		try {
			await c.start();
		} catch (e) {
			if (e.message.includes('port is already allocated') && e.reason === 'server error' && e.statusCode === 500 &&
				retryCountDown > 0) {
				await sleep(1000);
				await start(c, retryCountDown - 1);
			} else {
				throw e;
			}
		}
	};
	if (['exited', 'created'].includes(info.State.Status)) {
		await start(container, 1);
		info = await container.inspect();
	}
	return info;
};
exports.containerExec = async ({container_name, Cmd}) => {
	const container = docker.getContainer(container_name);
	let exec = await container.exec({Cmd});
	exec = await exec.start();
	return await exec.inspect();
};
// TODO how is options
exports.containerSolidify = async ({container_name}) => {
	const container = docker.getContainer(container_name);
	await container.commit();
};
exports.containerList = ({all, network, status} = {all: true}) => {
	// status=(created 	restarting 	running 	paused 	exited 	dead)
	const filters = {
		network: network ? [network] : undefined,
		status: status ? [status] : undefined
	};
	return docker.listContainers({all, filters});
};
exports.inflateContainerName = async (container_name) => {
	const containers = await exports.containerList();
	return containers.filter(container => container.Names.find(name => name.includes(container_name)));
};

exports.imageList = ({all} = {}) => {
	return docker.listImages({all});
};

exports.imageDelete = async (imageName) => {
	try {
		const image = docker.getImage(imageName);
		const imageInfo = await image.inspect();
		logger.info('delete image', imageInfo.RepoTags);
		return await image.remove({force: true});
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(err.json.message, 'skip deleting');
		} else {
			throw err;
		}
	}
};
exports.imageCreateIfNotExist = async (imageName) => {
	const image = docker.getImage(imageName);
	try {
		return await image.inspect();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(err.json.message, 'pulling');
			await exports.imagePull(imageName);
			return await image.inspect();
		} else {
			throw err;
		}
	}
};
exports.imagePull = async (imageName) => {

	const stream = await docker.pull(imageName);
	return new Promise((resolve, reject) => {
		const onProgress = (progress) => {
			logger.debug('pull', imageName, progress);
		};
		const onFinished = (err, output) => {
			if (err) {
				logger.error('pull image error', {err, output});
				return reject(err);
			} else {
				return resolve(output);
			}
		};
		docker.modem.followProgress(stream, onFinished, onProgress);
	});

};

exports.volumeCreateIfNotExist = ({Name, path}) => {
	return docker.createVolume({
		Name,
		Driver: 'local',
		DriverOpts: {
			o: 'bind',
			device: path,
			type: 'none'
		}
	});
};
exports.volumeRemove = async (Name) => {
	try {
		const volume = docker.getVolume(Name);
		const info = await volume.inspect();
		logger.info('delete volume', Name);
		logger.debug('delete volume', info);
		return await volume.remove();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such volume') {
			logger.info(err.json.message, 'delete skipped');
		} else {
			throw err;
		}
	}
};

exports.networkCreate = async ({Name}, swarm) => {
	const network = await docker.createNetwork({
		Name, CheckDuplicate: true,
		Driver: swarm ? 'overlay' : 'bridge',
		Internal: false,
		Attachable: true
	});
	return await network.inspect();
};
exports.networkCreateIfNotExist = async ({Name}, swarm) => {
	try {
		const network = docker.getNetwork(Name);
		const status = await network.inspect();
		const {Scope, Driver, Containers} = status;
		logger.info('network exist', Name, {
			Scope,
			Driver,
			Containers: Containers ? Object.values(Containers).map(({Name}) => Name) : undefined
		});
		if ((Scope === 'local' && swarm) || (Scope === 'swarm' && !swarm)) {
			logger.info(`network exist with unwanted ${Scope} ${swarm}`, 're creating');
			await network.remove();
			return await exports.networkCreate({Name}, swarm);
		}
		return status;
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such network') {
			logger.info(err.json.message, 'creating');
			return await exports.networkCreate({Name}, swarm);
		} else {
			throw err;
		}
	}
};
exports.networkRemove = async (Name) => {
	try {
		const network = docker.getNetwork(Name);
		await network.inspect();
		return await network.remove();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such network') {
			logger.info(err.json.message, 'deleting skipped');
		} else {
			throw err;
		}
	}
};

exports.prune = {
	containers: docker.pruneContainers,
	images: docker.pruneImages,
	networks: docker.pruneNetworks,
	volumes: docker.pruneVolumes,
	system: async () => {
		await docker.pruneContainers();
		await docker.pruneVolumes();
		await docker.pruneNetworks();
	}
};
exports.ContainerOptsBuilder = require('./containerOptsBuilder');
