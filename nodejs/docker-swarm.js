import ContainerManager from './docker.js';
import {execSync} from '@davidkhala/light/devOps.js'
import {systemInfo} from './dockerCmd.js'
export const swarmWorkerInfo = () => {
	const {Swarm} = JSON.parse(systemInfo());
	return Swarm;
};
export const nodeInspect = (id) => {
	const stdout = execSync(`docker node inspect ${id}`);

	return JSON.parse(stdout)[0];
};
export const nodeSelf = (pretty) => {
	const info = nodeInspect('self');
	if (pretty) {
		const {
			ID, Status, ManagerStatus,
			Description: {Hostname, Platform, Engine: {EngineVersion}},
		} = info;
		return {ID, Hostname, Platform, EngineVersion, Status, ManagerStatus};
	}
	return info;
};
export const joinToken =(role = 'manager') => {
	const cmd = `docker swarm join-token ${role} | grep docker`;
	const stdout = execSync(cmd);

	return stdout.trim();
};

export const advertiseAddr = (fullToken) => {
	if (!fullToken) {
		fullToken = joinToken();
	}
	const address = fullToken.split(' ')[5];
	const token = fullToken.split(' ')[4];
	const addressSlices = address.split(':');
	return {address: addressSlices[0], token, port: addressSlices[1], AdvertiseAddr: address};
};

/**
 * https://docs.docker.com/engine/swarm/how-swarm-mode-works/swarm-task-states/
 * @enum
 */
export const TaskStatus = {
	NEW: 'NEW',         //The task was initialized.
	PENDING: 'PENDING', //Resources for the task were allocated.
	ASSIGNED: 'ASSIGNED',//Docker assigned the task to nodes.
	ACCEPTED: 'ACCEPTED',//The task was accepted by a worker node. If a worker node rejects the task, the state changes to REJECTED.
	PREPARING: 'PREPARING',//Docker is preparing the task.
	STARTING: 'STARTING',//Docker is starting the task.
	RUNNING: 'RUNNING',//The task is executing.
	COMPLETE: 'COMPLETE',//The task exited without an error code.
	FAILED: 'FAILED',//The task exited with an error code.
	SHUTDOWN: 'SHUTDOWN',//Docker requested the task to shut down.
	REJECTED: 'REJECTED',//The worker node rejected the task.
	ORPHANED: 'ORPHANED',//The node was down for too long.
	REMOVE: 'REMOVE'//The task is not terminal but the associated service was removed or scaled down.
};
/**
 * @enum
 */
export const NodeStatus = {
	down: 'down'
};

export class DockerSwarmManager extends ContainerManager {

	constructor(opts, logger = console) {
		super(opts, logger);

	}

	async taskList({services, nodes} = {}) {
		return this.client.listTasks({
			filters: {
				service: Array.isArray(services) ? services : [],
				node: Array.isArray(nodes) ? nodes : []
			}
		});
	}

	async serviceDelete(serviceName) {
		try {
			const service = this.client.getService(serviceName);
			const info = await service.inspect();
			this.logger.debug('service delete', serviceName);
			await service.remove();
			return info;
		} catch (err) {
			if (err.statusCode === 404 && err.reason === 'no such service') {
				// swallow
				this.logger.info(err.json.message, 'deleting skipped');
			} else {
				throw err;
			}
		}
	}

	async serviceClear(serviceName) {
		try {
			const tasks = await this.taskList({services: [serviceName]});
			await this.serviceDelete(serviceName);
			this.logger.debug('service clear', serviceName, 'tasks', tasks.length);
			for (const task of tasks) {
				await this.taskDeadWaiter(task);
			}
		} catch (err) {
			if (err.statusCode === 404 && err.json.message === `service ${serviceName} not found`) {
				// swallow
				this.logger.info(err.json.message, 'clear skipped');
			} else {
				throw err;
			}
		}
	}


	async taskDeadWaiter(task) {
		const {ID} = task;
		try {
			const taskInfo = await this.client.getTask(ID).inspect();
			const {Status: {ContainerStatus: {ContainerID}}} = taskInfo;
			if (taskInfo.Status.State === 'failed') {
				this.logger.error('rare case caught: State === failed', taskInfo);
				return;
			}
			this.logger.info('task locked', taskInfo.ID, taskInfo.Spec.ContainerSpec.Image, `at node ${taskInfo.NodeID}`, `for container ${ContainerID}`);
			if (ContainerID) {
				try {
					await this.client.getContainer(ContainerID).inspect();//TODO do we have a ping way?
					this.logger.info('container legacy', ContainerID);
					await this.containerDelete(ContainerID);
				} catch (err) {
					if (err.statusCode === 404 && err.reason === 'no such container') {
						this.logger.info(err.json.message, 'cleaned');
					} else {
						throw err;
					}
				}
			}
			return new Promise(resolve => {
				setTimeout(() => {
					resolve(this.taskDeadWaiter(task));
				}, 1000);
			});
		} catch (err) {
			if (err.statusCode === 404 && err.reason === 'unknown task') {
				this.logger.info(err.json.message, 'skipped');
			} else {
				throw err;
			}
		}
	}

	/**
	 *
	 * @param {string} [service] service name, not service id
	 * @param {string} [node] node id or node name
	 * @param {TaskStatus} state
	 * @return {Promise<*|number|bigint>}
	 */
	async findTask({service, node, state} = {}) {
		if (state && !TaskStatus[state]) {
			this.logger.warn('invalid state', state);
			state = undefined;
		}
		const result = await this.taskList({
			services: service ? [service] : [],
			nodes: node ? [node] : []
		});
		return result.find(({Status}) => {
			return state ? Status.State === state : true;
		});
	}

	async taskLiveWaiter(service) {
		const task = await this.findTask({service: service.ID, state: TaskStatus.RUNNING});
		if (task) {
			return task;
		}
		await new Promise(resolve => {
			setTimeout(() => {
				this.logger.warn('task wait until live', 'for service', service.Spec.Name);
				resolve(this.taskLiveWaiter(service));
			}, 3000);
		});
	}

	async nodeList(pretty) {
		let nodes = await this.client.listNodes();
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

	async nodeDelete(id) {
		const node = await this.client.getNode(id);
		await node.remove();
		this.logger.info(`node ${id} deleted`);
	}

	async pruneNodes() {
		const nodes = await this.nodeList(true);
		for (const node of nodes) {
			const {ID, Status: {State}} = node;
			if (State === NodeStatus.down) {
				await this.nodeDelete(ID);
			}
		}
	}

	//TODO which step we delete service
	async pruneServices(node) {
		if (!node) {
			node = await nodeSelf(true);
		}

		const tasks = await this.taskList({nodes: [node.ID]});

		for (const task of tasks) {
			await this.taskDeadWaiter(task);
		}
	}

	async swarmTouch() {
		try {
			const {ID} = await this.client.swarmInspect();
			return {result: true, ID};
		} catch (err) {
			if (err.statusCode === 500) {
				if (err.reason === 'server error' && err.json.message.includes('The swarm does not have a leader')) {
					this.logger.error('swarm consensus corrupted');
					return {result: false, reason: 'consensus'};
				}
			}
			if (err.statusCode === 503) {
				if (err.json.message.includes('This node is not a swarm manager.')) {
					this.logger.error('swarm not exist');
					return {result: false, reason: 'noexist'};
				}
			}
			throw err;
		}
	}

	async swarmInit({AdvertiseAddr}) {
		const opts = {
			ListenAddr: '0.0.0.0:2377',
			AdvertiseAddr,
			ForceNewCluster: false
		};
		try {
			await this.client.swarmInit(opts);
			this.logger.info('swarmInit', {AdvertiseAddr});
		} catch (err) {
			if (err.statusCode === 503 && err.json.message.includes('This node is already part of a swarm.')) {
				const {address, AdvertiseAddr: existAddr} = await advertiseAddr();
				if (address === AdvertiseAddr || existAddr === AdvertiseAddr) {
					this.logger.info('swarmInit: exist swarm with matched AdvertiseAddr', AdvertiseAddr);
					return;
				}
				// not to handle consensus problem
			}
			throw err;
		}
	}

	async swarmBelongs({ID} = {}, token) {
		try {
			const info = await this.client.swarmInspect();
			if (ID === info.ID) {
				this.logger.info('swarm belong: ID matched', ID);
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
				this.logger.warn('swarm Belongs', err.json.message);
				return {result: false};
			} else {
				throw err;
			}
		}
	}

	/**
	 *
	 * @param {string} AdvertiseAddr must be in form of <ip>:2377
	 * @param {string} JoinToken token only
	 * @param {string} selfIp
	 * @returns {*}
	 */
	async swarmJoin({AdvertiseAddr, JoinToken}, selfIp) {
		this.logger.debug('swarmJoin', {AdvertiseAddr, JoinToken});
		const opts = {
			ListenAddr: `${selfIp}:2377`,
			JoinToken,
			RemoteAddrs: [AdvertiseAddr]
		};
		try {
			return await this.client.swarmJoin(opts);
		} catch (err) {
			if (err.statusCode === 503) {
				if (err.json.message.includes('This node is already part of a swarm.')) {
					// check if it is same swarm
					const {result, swarm} = await this.swarmBelongs(undefined, JoinToken);
					if (!result) {
						if (swarm) {
							throw Error(`belongs to another swarm ${swarm.ID}`);
						} else {
							logger.info('swarm joined already', 'as worker');
							return swarmWorkerInfo();
						}
					}
					this.logger.info('swarm joined already', swarm.ID);
					return swarm;
				} else if (err.json.message.includes('Timeout was reached before node joined')) {
					this.logger.warn(err.json.message);
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
								this.logger.warn(`retry node self inspect after ${timeInterval}ms `);
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

	}

	async swarmLeave() {
		try {
			await this.client.swarmLeave({force: true});
			this.logger.info('swarm leave finished');
		} catch (err) {
			if (err.statusCode === 503 && err.json.message === 'This node is not part of a swarm') {
				this.logger.info('swarmLeave skipped:', err.json.message);
			} else {
				throw err;
			}
		}
	}

	async serviceCreateIfNotExist({Image, Name, Cmd, network, Constraints, volumes = [], ports = [], Env, Aliases}) {
		try {
			const service = this.client.getService(Name);
			const info = await service.inspect();
			this.logger.info('service found', Name);
			return info;
		} catch (err) {
			if (err.statusCode === 404 && err.reason === 'no such service') {
				this.logger.info(err.json.message, 'creating');
				const opts = {
					Name,
					TaskTemplate: {
						ContainerSpec: {
							Image,
							Env,
							Command: Cmd,
							Mounts: volumes.map(({volumeName, volume, Type = 'volume'}) => {
								return {
									ReadOnly: false,
									Source: volumeName,
									Target: volume,
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
				const service = await this.client.createService(opts);
				return await service.inspect();
			} else {
				throw err;
			}
		}
	};

	static swarmServiceName(serviceName) {
		return serviceName.replace(/\./g, '-');
	}

	/**
	 * Does not support '!=' constraints yet
	 * @param {string} [ID] Node ID, node.id==2ivku8v2gvtg4
	 * @param {string} [hostname] Node hostname, node.hostname==node-2
	 * @param [role] Node role, node.role==manager
	 * @param {Object} [labels] user defined node labels, node.labels.security==high
	 * @param [engineLabels] Docker Engine's labels, engine.labels.operatingsystem==ubuntu 14.04
	 * @constructor
	 */
	static constraintsBuilder({ID, hostname, role}, labels, engineLabels) {

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
			for (const [key, value] of Object.entries(labels)) {
				constraints.push(`node.labels.${key}==${value}`);
			}
		}
		if (engineLabels) {
			for (const [key, value] of Object.entries(engineLabels)) {
				constraints.push(`engine.labels.${key}==${value}`);
			}
		}
		return constraints;
	}

	async static constraintSelf() {
		const {ID} = await nodeSelf(true);
		return DockerSwarmManager.constraintsBuilder({ID});
	}
}
