const {docker, containerDelete} = require('./dockerode-util');

const logger = require('khala-logger').new('dockerode-swarm');
const {nodeSelf, advertiseAddr, swarmWorkerInfo} = require('./dockerCmd');

exports.nodeList = async (pretty) => {
	let nodes = await docker.listNodes();
	if (pretty) {
		nodes = nodes.map(node => {
			const {
				ID, Spec, Status, ManagerStatus, Description: {
					Hostname, Platform, Engine: {EngineVersion}
				}
			} = node;
			return {
				ID, Spec, Status, ManagerStatus, Hostname, Platform, EngineVersion
			};
		});
	}
	return nodes;
};
exports.swarmTouch = async () => {
	try {
		const {ID} = await docker.swarmInspect();
		return {result: true, ID};
	} catch (err) {
		if (err.statusCode === 500) {
			if (err.reason === 'server error' && err.json.message.includes('The swarm does not have a leader')) {
				logger.error('swarm consensus corrupted');
				return {result: false, reason: 'consensus'};
			}
		}
		if (err.statusCode === 503) {
			if (err.json.message.includes('This node is not a swarm manager.')) {
				logger.error('swarm not exist');
				return {result: false, reason: 'noexist'};
			}
		}
		throw err;
	}

};
exports.swarmInit = async ({AdvertiseAddr}) => {
	const opts = {
		ListenAddr: '0.0.0.0:2377',
		AdvertiseAddr,
		ForceNewCluster: false
	};
	try {
		await docker.swarmInit(opts);
		logger.info('swarmInit', {AdvertiseAddr});
	} catch (err) {
		if (err.statusCode === 503 && err.json.message.includes('This node is already part of a swarm.')) {
			const {address, AdvertiseAddr: existAddr} = await advertiseAddr();
			if (address === AdvertiseAddr || existAddr === AdvertiseAddr) {
				logger.info('swarmInit: exist swarm with matched AdvertiseAddr', AdvertiseAddr);
				return;
			}
			// not to handle consensus problem
		}
		throw err;
	}
};
exports.swarmBelongs = async ({ID} = {}, token) => {
	try {
		const info = await docker.swarmInspect();
		if (ID === info.ID) {
			logger.info('swarm belong: ID matched', ID);
			return {result: true, swarm: info};
		}
		const {JoinTokens} = info;
		const {Worker, Manager} = JoinTokens;
		if (Worker === token || Manager === token) {
			return {result: true, swarm: info};
		}
		return {result: false, swarm: info};
	} catch (err) {
		if (err.statusCode === 503 && err.json.message.includes('This node is not a swarm manager')) {
			logger.warn('swarm Belongs', err.json.message);
			return {result: false};
		} else {
			throw err;
		}
	}
};
/**
 *
 * @param {string} AdvertiseAddr must be in form of <ip>:2377
 * @param {string} JoinToken token only
 * @param {string} selfIp
 * @returns {*}
 */
exports.swarmJoin = async ({AdvertiseAddr, JoinToken}, selfIp) => {
	logger.debug('swarmJoin', {AdvertiseAddr, JoinToken});
	const opts = {
		ListenAddr: `${selfIp}:2377`,
		JoinToken,
		RemoteAddrs: [AdvertiseAddr]
	};
	try {
		return await docker.swarmJoin(opts);
	} catch (err) {
		if (err.statusCode === 503) {
			if (err.json.message.includes('This node is already part of a swarm.')) {
				// check if it is same swarm
				const {result, swarm} = await exports.swarmBelongs(undefined, JoinToken);
				if (!result) {
					if (swarm) {
						throw Error(`belongs to another swarm ${swarm.ID}`);
					} else {
						logger.info('swarm joined already', 'as worker');
						return swarmWorkerInfo();
					}
				}
				logger.info('swarm joined already', swarm.ID);
				return swarm;
			} else if (err.json.message.includes('Timeout was reached before node joined')) {
				logger.warn(err.json.message);
				// TODO to test when will happened
				let retryCounter = 0;
				const retryMax = 5;
				const timeInterval = 1000;
				const selfInspectLooper = () => new Promise((resolve, reject) => {
					setTimeout(async () => {
						try {
							resolve(await nodeSelf());
						} catch (inspectErr) {
							retryCounter++;
							logger.warn(`retry node self inspect after ${timeInterval}ms `);
							if (retryCounter < retryMax) {
								resolve(selfInspectLooper());
							} else {
								reject(inspectErr);
							}
						}

					}, timeInterval);

				});
				return await selfInspectLooper();
			}
		}
		throw err;
	}

};

exports.swarmLeave = async () => {
	try {
		await docker.swarmLeave({force: true});
		logger.info('swarm leave finished');
	} catch (err) {
		if (err.statusCode === 503 && err.json.message === 'This node is not part of a swarm') {
			logger.info('swarmLeave skipped:', err.json.message);
		} else {
			throw err;
		}
	}
};

exports.swarmServiceName = (serviceName) => {
	return serviceName.replace(/\./g, '-');
};
const taskList = ({services, nodes} = {}) => {
	return docker.listTasks({
		filters: {
			service: Array.isArray(services) ? services : [],
			node: Array.isArray(nodes) ? nodes : []
		}
	});
};
exports.taskList = taskList;
exports.serviceDelete = async serviceName => {
	try {
		const service = docker.getService(serviceName);
		const info = await service.inspect();
		logger.debug('service delete', serviceName);
		await service.remove();
		return info;
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'no such service') {
			// swallow
			logger.info(err.json.message, 'deleting skipped');
		} else {
			throw err;
		}
	}
};
exports.serviceClear = async serviceName => {
	try {
		const tasks = await taskList({services: [serviceName]});
		await exports.serviceDelete(serviceName);
		logger.debug('service clear', serviceName, 'tasks', tasks.length);
		for (const task of tasks) {
			await exports.taskDeadWaiter(task);
		}
	} catch (err) {
		if (err.statusCode === 404 && err.json.message === `service ${serviceName} not found`) {
			// swallow
			logger.info(err.json.message, 'clear skipped');
		} else {
			throw err;
		}
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
			logger.info(err.json.message, 'creating');
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
								Type
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
	const result = await taskList({
		services: service ? [service] : [],
		nodes: node ? [node] : []
	});
	return result.find(({Status}) => {
		return state ? Status.State === state : true;
	});
};

exports.taskLiveWaiter = async (service) => {
	const task = await exports.findTask({service: service.ID, state: 'running'});
	if (task) {
		return task;
	}
	await new Promise(resolve => {
		setTimeout(() => {
			logger.warn('task wait until live', 'for service', service.Spec.Name);
			resolve(exports.taskLiveWaiter(service));
		}, 3000);
	});
};
exports.taskDeadWaiter = async (task) => {
	const {ID} = task;
	try {
		const taskInfo = await docker.getTask(ID).inspect();
		const {Status: {ContainerStatus: {ContainerID}}} = taskInfo;
		if (taskInfo.Status.State === 'failed') {
			logger.error('rare case caught: State === failed', taskInfo);
			return;
		}
		logger.info('task locked', taskInfo.ID, taskInfo.Spec.ContainerSpec.Image, `at node ${taskInfo.NodeID}`, `for container ${ContainerID}`);
		if (ContainerID) {
			try {
				await docker.getContainer(ContainerID).inspect();
				logger.info('container legacy', ContainerID);
				await containerDelete(ContainerID);
			} catch (err) {
				if (err.statusCode === 404 && err.reason === 'no such container') {
					logger.info(err.json.message, 'cleaned');
				} else {
					throw err;
				}
			}
		}
		return new Promise(resolve => {
			setTimeout(() => {
				resolve(exports.taskDeadWaiter(task));
			}, 1000);
		});
	} catch (err) {
		if (err.statusCode === 404 && err.reason === 'unknown task') {
			logger.info(err.json.message, 'skipped');
		} else {
			throw err;
		}
	}
};

exports.nodeDelete = async (id) => {
	const node = await docker.getNode(id);
	await node.remove();
	logger.info(`node ${id} deleted`);
};
exports.prune = {
	nodes: async () => {
		const nodes = await exports.nodeList(true);
		for (const node of nodes) {
			const {ID, Status: {State}} = node;
			if (State === 'down') {
				await exports.nodeDelete(ID);
			}
		}
	},
	services: async () => {
		const node = await nodeSelf(true);
		const tasks = await taskList({nodes: [node.ID]});

		for (const task of tasks) {
			await exports.taskDeadWaiter(task);
		}
	},
	system: async () => {
		await exports.prune.services();
		await exports.prune.nodes();
	}
};
/**
 * node.id    Node ID    node.id==2ivku8v2gvtg4
 node.hostname    Node hostname    node.hostname!=node-2
 node.role    Node role    node.role==manager
 node.labels    user defined node labels    node.labels.security==high
 engine.labels    Docker Engine's labels    engine.labels.operatingsystem==ubuntu 14.04
 * not support '!=' constraints yet
 * @param ID
 * @param hostname
 * @param role
 * @param labels
 * @param engineLabels
 * @constructor
 */
exports.constraintsBuilder = ({ID, hostname, role}, labels, engineLabels) => {

	const constraints = [];
	if (ID) {
		constraints.push(`node.id==${ID}`);
	}
	if (hostname) {
		constraints.push(`node.hostname==${hostname}`);
	}
	if (role) {
		constraints.push(`node.role==${role}`);
	}
	if (labels) {
		for (const key in labels) {
			const value = labels[key];
			constraints.push(`node.labels.${key}==${value}`);
		}
	}
	if (engineLabels) {
		for (const key in engineLabels) {
			const value = engineLabels[key];
			constraints.push(`engine.labels.${key}==${value}`);
		}
	}
	return constraints;
};
exports.constraintSelf = async () => {
	const {ID} = await nodeSelf(true);
	return exports.constraintsBuilder({ID});
};