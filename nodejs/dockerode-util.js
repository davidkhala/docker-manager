const Dockerode = require('dockerode');

const docker = new Dockerode();
const Log4js = require('log4js');
const logger = Log4js.getLogger('dockerode');
logger.level = 'debug';
exports.containerDelete = containerName => {
	logger.debug(`--delete container ${containerName}`);
	const container = docker.getContainer(containerName);
	return container.inspect().then((containInfo) => {
		logger.debug('--before delete', containInfo.State.Status);
		//possible status:[created|restarting|running|removing|paused|exited|dead]
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
exports.containerStart = (createOptions) => {
	return module.exports.containerCreate(createOptions).then(compositeContainer => {
		if (['exited', 'created'].includes(compositeContainer.State.Status)) {
			return compositeContainer.start();
		} else return compositeContainer;
	});
};
exports.containerExec = ({container_name, Cmd}) => {
	const container = docker.getContainer(container_name);
	return container.exec({Cmd}).then(exec =>
		exec.start().then(() => exec.inspect())
	);
};
exports.containerList = ({all, network, status} = {}) => {
	// status=(created 	restarting 	running 	paused 	exited 	dead)
	const filters = {
		network: network ? [network] : undefined,
		status: status ? [status] : undefined
	};
	return docker.listContainers({all, filters});
};
exports.swarmInit = ({AdvertiseAddr}) => {
	const opts = {
		AdvertiseAddr,
		'ForceNewCluster': false,
		'Spec': {
			'Orchestration': {},
			'Raft': {},
			'Dispatcher': {},
			'CAConfig': {}
		}
	};

	return docker.swarmInit(opts);
};
exports.swarmJoin = ({AdvertiseAddr, JoinToken}) => {
	const opts = {
		AdvertiseAddr,
		JoinToken
	};
	return docker.swarmJoin(opts);
};
exports.swarmLeave = () => {
	return docker.swarmLeave({'force': true});
};
exports.nodeInspect = (id) => {
	const optsf = {
		path: `/nodes/${id}`,
		method: 'GET',
		options: {},
		statusCodes: {
			200: true,
			404: 'no such node',
			406: 'node is not part of a swarm',
			500: 'server error'
		}
	};
	const modem = docker.getNode(id).modem;
	return new modem.Promise((resolve, reject) => {
		modem.dial(optsf, (err, data) => {
			if (err) {
				return reject(err);
			}
			resolve(data);
		});
	});
};

exports.swarmServiceName = (serviceName) => {
	return serviceName.replace(/\./g, '-');
};
exports.serviceExist = ({Name}) => {
	const serviceName = module.exports.swarmServiceName(Name);
	return docker.getService(serviceName).inspect().catch(err => {
		if (err.toString().includes(`service ${serviceName} not found`)) {
			return false;
		} else {
			throw err;
		}
	});
};
exports.serviceInspect = ({Name}) => {
	const serviceName = module.exports.swarmServiceName(Name);
	return docker.getService(serviceName).inspect();
};
exports.serviceCreate = ({Image, Name, Cmd, network, Constraints, volumes, ports, Env, Aliases}) => {
	const serviceName = module.exports.swarmServiceName(Name);
	if (Name !== serviceName) {
		if (Array.isArray(Aliases)) {
			Aliases = Aliases.concat([Name]);
		} else {
			Aliases = [Name];
		}
	}
	const opts = {
		Name: serviceName,
		TaskTemplate: {
			ContainerSpec: {
				Image,
				Env,
				Command: Cmd,
				Mounts: volumes.map(({volumeName, volume, Type = 'volume'}) => {
					return {
						'ReadOnly': false,
						'Source': volumeName,
						'Target': volume,
						Type,
						// "VolumeOptions": {
						//     "DriverConfig": {
						//     },
						// }
					};
				})
			},
			Networks: [{Target: network, Aliases}],
			Resources: {
				Limits: {},
				Reservations: {}
			},
			RestartPolicy: {
				Condition: 'on-failure',
				MaxAttempts: 0
			},
			Placement: {Constraints}
		},
		Mode: {
			Replicated: {
				Replicas: 1
			}
		},
		EndpointSpec: {
			Ports: ports.map(({host, container}) => {
				return {
					'Protocol': 'tcp',
					'PublishedPort': host,
					'TargetPort': container
				};
			})
		}
	};
	const service = docker.getService(Name);
	return service.inspect().then((info) => {
		Object.assign(service, info);
		logger.debug(`service ${Name} exist `, service);
		return service;
	}).catch(err => {
		if (err.statusCode === 404) {
			return docker.createService(opts);
		} else {
			throw err;
		}
	});

};
exports.serviceList = () => {
	return docker.listServices();
};
exports.swarmInspect = () => {
	return docker.swarmInspect();
};
exports.containerCreate = (createOptions) => {
	const {name: containerName, Image: imageName} = createOptions;
	const container = docker.getContainer(containerName);
	return container.inspect().then(containerInfo => {
		logger.info(`${containerName} exist `, containerInfo.State);
		container.State = containerInfo.State;
		return container;
	}).catch(err => {
		if (err.reason === 'no such container' && err.statusCode === 404) {
			//swallow
			logger.info(`${containerName} not exist. creating`);

			return module.exports.imageCreate(imageName).then(() => docker.createContainer(createOptions))
				.then(newContainer => newContainer.inspect().then(containerInfo => {
					newContainer.State = containerInfo.State;
					return newContainer;
				}));
		} else throw err;
	});
};

exports.imageDelete = (imageName) => {
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
exports.imageCreate = (imageName) => {
	const image = docker.getImage(imageName);
	return image.inspect().then(imageInfo => {
		logger.info('image exist', imageInfo.RepoTags);
		return image;
	}).catch(err => {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(`image ${imageName} not exist, pulling`);
			return module.exports.imagePull(imageName).then(() => image);
		} else throw err;
	});
};
exports.imagePull = (imageName) => {

	//FIXED: fatal bug: if immediately do docker operation after callback:
	// reason: 'no such container',
	// 		statusCode: 404,
	// 		json: { message: 'No such image: hello-world:latest' } }
	//See discussion in https://github.com/apocas/dockerode/issues/107
	return docker.pull(imageName).then(stream => {
		return new Promise((resolve, reject) => {
			const onProgress = (event) => {
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
exports.volumeRemove = ({Name}) => {
	const volume = docker.getVolume(Name);
	return volume.inspect().then(()=>volume.remove())
		.catch(err=>{
			if(err.toString().includes('no such volume')){
				return;
			}
			throw err;
		});
};
exports.taskList = ({services, nodes}) => {
	return docker.listTasks({
		filters: {
			service: Array.isArray(services) ? services : [],
			node: Array.isArray(nodes) ? nodes : [],
		}
	});
};
exports.networkCreate = ({Name}, swarm) => {
	return docker.createNetwork({
		Name, CheckDuplicate: true,
		Driver: swarm ? 'overlay' : 'bridge',
		Internal: false,
		Attachable: true,
	});
};
exports.networkInspect = ({Name}) => {
	return docker.getNetwork(Name).inspect();
};
exports.networkRemove = ({Name}) => {
	const network = docker.getNetwork(Name);
	return network.inspect().then(() => network.remove())
		.catch(err => {
			if (err.toString().includes('no such network')) {
				return;
			}
			throw err;
		});
};
exports.prune = {
	container: docker.pruneContainers,
	image: docker.pruneImages,
	network: docker.pruneNetworks,
	volume: docker.pruneVolumes,
	system: async () => {
		await docker.pruneContainers();
		await docker.pruneVolumes();
		await docker.pruneNetworks();
	}
};