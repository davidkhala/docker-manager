const Dockerode = require('dockerode');

const docker = new Dockerode();
const Log4js = require('log4js');
const logger = Log4js.getLogger('dockerode');
logger.level = 'debug';
const dockerCmd = require('./dockerCmd');
exports.containerDelete = containerName => {
	const container = docker.getContainer(containerName);
	return container.inspect().then((containInfo) => {
		logger.debug('delete container', containerName, containInfo.State.Status);
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
			logger.info(err.json.message,'deleting skipped');
			return Promise.resolve();
		} else throw err;
	});
};
exports.containerStart = async (createOptions) => {
	const containerInfo = await exports.containerCreateIfNotExist(createOptions);
	if (['exited', 'created'].includes(containerInfo.State.Status)) {
		const {name} = createOptions;
		let container = docker.getContainer(name);
		container = await container.start();
		return await container.inspect();
	} else return containerInfo;
};
exports.containerExec = async ({container_name, Cmd}) => {
	const container = docker.getContainer(container_name);
	let exec = await container.exec({Cmd});
	exec = await exec.start();
	return await exec.inspect();
};
exports.containerList = ({all, network, status} = {all: true}) => {
	// status=(created 	restarting 	running 	paused 	exited 	dead)
	const filters = {
		network: network ? [network] : undefined,
		status: status ? [status] : undefined
	};
	return docker.listContainers({all, filters});
};
exports.imageList = ({all} = {}) => {
	return docker.listImages({all});
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

exports.swarmServiceName = (serviceName) => {
	return serviceName.replace(/\./g, '-');
};
exports.serviceDelete = async serviceName => {
	try {
		const service = docker.getService(serviceName);
		await service.inspect();
		logger.debug('service delete', serviceName);
		return await service.remove();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such service') {
			//swallow
			logger.info(`${serviceName} not found. deleting skipped`);
			return;
		} else throw err;
	}
};
exports.serviceCreateIfNotExist = async ({Image, Name, Cmd, network, Constraints, volumes = [], ports = [], Env, Aliases}) => {


	try {
		const service = docker.getService(Name);
		const info = await service.inspect();
		logger.info('service found', Name);
		return info;
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such service') {
			const opts = {
				Name,
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
			const service = await docker.createService(opts);
			return await service.inspect();
		} else {
			throw err;
		}
	}
};
exports.containerCreateIfNotExist = async (createOptions) => {
	const {name: containerName, Image: imageName} = createOptions;

	try {
		const container = docker.getContainer(containerName);
		const info = await container.inspect();
		logger.info('container found', containerName, info.State);
		return info;
	} catch (err) {
		if (err.reason === 'no such container' && err.statusCode === 404) {
			logger.info('container not found.', containerName, 'creating');
			await module.exports.imageCreate(imageName);
			const container = await docker.createContainer(createOptions);
			return await container.inspect();
		} else throw err;
	}
};

exports.imageDelete = async (imageName) => {
	try {
		const image = docker.getImage(imageName);
		const imageInfo = await image.inspect();
		logger.info('delete image', imageInfo.RepoTags);
		return await image.remove();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(`image ${imageName} not found, skip deleting`);
		} else throw err;
	}
};
exports.imageCreate = (imageName) => {
	const image = docker.getImage(imageName);
	return image.inspect().then(imageInfo => {
		logger.info('image found', imageInfo.RepoTags);
		return image;
	}).catch(err => {
		if (err.statusCode === 404 && err.reason === 'no such image') {
			logger.info(`image ${imageName} not found, pulling`);
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
exports.volumeRemove = async (Name) => {
	try {
		const volume = docker.getVolume(Name);
		const info = await volume.inspect();
		logger.info('delete volume', Name, info);
		return await volume.remove();
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such volume') {
			logger.info('volume not found', Name);
		} else throw err;
	}
};
exports.taskList = ({services, nodes} = {}) => {
	return docker.listTasks({
		filters: {
			service: Array.isArray(services) ? services : [],
			node: Array.isArray(nodes) ? nodes : [],
		}
	});
};
/**
 * service=<service name>, not ID
 node=<node id or name>
 https://docs.docker.com/engine/swarm/how-swarm-mode-works/swarm-task-states/
 NEW    The task was initialized.
 PENDING    Resources for the task were allocated.
 ASSIGNED    Docker assigned the task to nodes.
 ACCEPTED    The task was accepted by a worker node. If a worker node rejects the task, the state changes to REJECTED.
 PREPARING    Docker is preparing the task.
 STARTING    Docker is starting the task.
 RUNNING    The task is executing.
 COMPLETE    The task exited without an error code.
 FAILED    The task exited with an error code.
 SHUTDOWN    Docker requested the task to shut down.
 REJECTED    The worker node rejected the task.
 ORPHANED    The node was down for too long.
 REMOVE    The task is not terminal but the associated service was removed or scaled down.
 */
exports.findTask = async ({service, node, state} = {}) => {
	const stateEnums = ['NEW', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'PREPARING', 'STARTING', 'RUNNING', 'COMPLETE', 'FAILED', 'SHUTDOWN', 'REJECTED', 'ORPHANED', 'REMOVE'];
	if (state && !stateEnums.includes(state.toUpperCase())) {
		logger.warn('invalid state', state);
		state = undefined;
	}
	const result = await exports.taskList({
		services: service ? [service] : [],
		nodes: node ? [node] : [],
	});
	return result.find(({Status}) => {
		return state ? Status.State === state : true;
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
exports.networkCreateIfNotExist = async ({Name}, swarm) => {
	try {
		const network = docker.getNetwork(Name);
		const status = await network.inspect();
		logger.info('network exist', Name, status);
		return status;
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such network') {
			logger.info(err.json.message, 'creating');
			const network = await exports.networkCreate({Name}, swarm);
			return await network.inspect();
		} else throw err;
	}
};
exports.networkRemove = async (Name) => {
	try {
		const network = docker.getNetwork(Name);
		await network.inspect();
		return await network.remove();
	}catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such network') {
			logger.info(err.json.message, 'deleting skipped');
		} else throw err;
	}
};
exports.tasksWaitUntilLive = async (services) => {

	const taskLooper = async (service) => {
		const task = await exports.findTask({service: service.ID, state: 'running'});
		if (task) return task;
		await new Promise(resolve => {
			setTimeout(() => {
				logger.warn('task wait until live', `for service `, service.Spec.Name);
				resolve(taskLooper(service));
			}, 3000);
		});
	};

	return Promise.all(services.map(service => {
		return taskLooper(service);
	}));
};
exports.tasksWaitUntilDead = async ({services, nodes} = {}) => {
	const tasks = await exports.taskList({services, nodes});

	logger.debug('tasksWaitUtilDead', tasks.length);
	for (let i = 0; i < tasks.length; i++) {
		const {ID} = tasks[i];
		const task = await docker.getTask(ID).inspect();

		if (task && task.Status.State !== 'failed') {
			logger.info('task locked', task.ID, task.Spec.ContainerSpec.Image, `at node ${task.NodeID}`);
			return new Promise(resolve => {
				setTimeout(() => {
					resolve(exports.tasksWaitUntilDead({services, nodes}));
				}, 3000);
			});
		}
	}
};
exports.prune = {
	container: docker.pruneContainers,
	image: docker.pruneImages,
	network: docker.pruneNetworks,
	volume: docker.pruneVolumes,
	system: async (swarm) => {
		if (swarm) {
			const node = await dockerCmd.nodeSelf(true);
			await exports.tasksWaitUntilDead({nodes: [node.ID]});
		}
		await docker.pruneContainers();
		await docker.pruneVolumes();
		await docker.pruneNetworks();
	}
};
exports.getTask = docker.getTask;