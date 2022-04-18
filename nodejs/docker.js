import Dockerode from 'dockerode';

import { ContainerStatus, Reason } from './constants.js';
const { exited, created, dead } = ContainerStatus;
const { ContainerNotFound, ImageNotFound, NetworkNotFound, VolumeNotFound } = Reason;

/**
 * @typedef {Object} DockerodeOpts
 * @property {string} [socketPath]
 * @property {string} [protocol]
 * @property {string} [host]
 * @property {number} [port]
 */

export default class DockerManager {

	/**
	 *
	 * @param {DockerodeOpts} [opts]
	 * @param [logger]
	 */
	constructor(opts, logger = console) {
		if (opts && !opts.protocol && opts.host) {
			opts.protocol = 'ssh';
		}

		this.docker = new Dockerode(opts);
		this.logger = logger;
		this.prune = {
			containers: this.docker.pruneContainers,
			images: this.docker.pruneImages,
			networks: this.docker.pruneNetworks,
			volumes: this.docker.pruneVolumes,
			system: async () => {
				await this.docker.pruneContainers();
				await this.docker.pruneVolumes();
				await this.docker.pruneNetworks();
			}
		};
	}

	async info() {
		return this.docker.info();
	}

	async ping() {
		const result = await this.docker.ping();
		return result.toString();
	}

	async networkRemove(Name) {
		try {
			const network = this.docker.getNetwork(Name);
			await network.inspect();
			return await network.remove();
		} catch (err) {
			if (err.statusCode === 404 && err.reason === NetworkNotFound) {
				this.logger.info(err.json.message, 'deleting skipped');
			} else {
				throw err;
			}
		}
	}

	async networkCreate({ Name }, swarm) {
		const network = await this.docker.createNetwork({
			Name, CheckDuplicate: true,
			Driver: swarm ? 'overlay' : 'bridge',
			Internal: false,
			Attachable: true
		});
		return await network.inspect();
	}

	async networkCreateIfNotExist({ Name }, swarm) {
		try {
			const network = this.docker.getNetwork(Name);
			const status = await network.inspect();
			const { Scope, Driver, Containers } = status;
			this.logger.debug(`network[${Name}] exist`, {
				Scope,
				Driver,
				Containers: Containers ? Object.values(Containers).map(({ Name }) => Name) : undefined
			});
			if ((Scope === 'local' && swarm) || (Scope === 'swarm' && !swarm)) {
				this.logger.info(`network exist with unwanted ${Scope} ${swarm}`, 're-creating');
				await network.remove();
				return await this.networkCreate({ Name }, swarm);
			}
			return status;
		} catch (err) {
			if (err.statusCode === 404 && err.reason === NetworkNotFound) {
				this.logger.info(err.json.message, 'creating');
				return await this.networkCreate({ Name }, swarm);
			} else {
				throw err;
			}
		}
	}

	/**
	 *
	 * @param {string} containerName
	 * @return {Promise}
	 */
	async containerDelete(containerName) {
		const container = this.docker.getContainer(containerName);
		try {
			const containInfo = await container.inspect();
			const currentStatus = containInfo.State.Status;
			this.logger.debug('delete container', containerName, currentStatus);
			if (![exited, created, dead].includes(currentStatus)) {
				await container.kill();
			}
			await container.remove();
			return;
		} catch (err) {
			if (err.statusCode === 404 && err.reason === ContainerNotFound) {
				this.logger.info(err.json.message, 'deleting skipped');
			} else {
				throw err;
			}
		}
	};

	/**
	 * @param {string} containerName
	 */
	async containerRestart(containerName) {
		const container = this.docker.getContainer(containerName);
		const containInfo = await container.inspect();
		this.logger.debug('restart container', containerName, containInfo.State.Status);
		await container.restart();
	}

	/**
	 *
	 * @param {containerOpts} createOptions
	 * @param {number} [retryTimes]
	 * @returns {Promise<*>}
	 */
	async containerStart(createOptions, retryTimes = 1) {
		const { name: containerName, Image: imageName } = createOptions;
		let container = this.docker.getContainer(containerName);
		let info;

		try {
			info = await container.inspect();
			this.logger.debug('container found', containerName, info.State.Status);

		} catch (err) {
			if (err.reason === ContainerNotFound && err.statusCode === 404) {
				this.logger.info(err.json.message, 'creating');
				container = await this.docker.createContainer(createOptions);
				info = await container.inspect();
			} else {
				throw err;
			}
		}
		const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
		if ([exited, created].includes(info.State.Status)) {
			await start(container, retryTimes);
			info = await container.inspect();
		}
		return info;
	};

	async containerExec({ container_name, Cmd }) {
		const container = this.docker.getContainer(container_name);
		const exec = await container.exec({ Cmd });
		await exec.start();
		return await exec.inspect();
	}

	/**
	 * TODO how is options
	 * @param container_name
	 * @return {Promise<void>}
	 */
	async containerSolidify({ container_name }) {
		const container = this.docker.getContainer(container_name);
		await container.commit();
	};

	async containerList({ all, network, status } = { all: true }) {
		const filters = {
			network: network ? [network] : undefined,
			status: status ? [status] : undefined
		};
		return this.docker.listContainers({ all, filters });
	}

	async inflateContainerName(container_name) {
		const containers = await this.containerList();
		return containers.filter(container => container.Names.find(name => name.includes(container_name)));
	}

	async imageList({ all } = {}) {
		return this.docker.listImages({ all });
	}

	async imageDelete(imageName) {
		try {
			const image = this.docker.getImage(imageName);
			const imageInfo = await image.inspect();
			this.logger.info('delete image', imageInfo.RepoTags);
			return await image.remove({ force: true });
		} catch (err) {
			if (err.statusCode === 404 && err.reason === ImageNotFound) {
				this.logger.debug(err.json.message, 'skip deleting');
			} else {
				throw err;
			}
		}
	};

	async imageCreateIfNotExist(imageName) {
		const image = this.docker.getImage(imageName);
		try {
			return await image.inspect();
		} catch (err) {
			if (err.statusCode === 404 && err.reason === ImageNotFound) {
				this.logger.debug(err.json.message, 'pulling');
				await this.imagePull(imageName);
				return await image.inspect();
			} else {
				throw err;
			}
		}
	};

	async imagePull(imageName) {

		const stream = await this.docker.pull(imageName);
		return new Promise((resolve, reject) => {
			const onProgress = ({ status, progress }) => {
				this.logger.debug(status, imageName, progress);
			};
			const onFinished = (err, output) => {
				if (err) {
					this.logger.error('pull image error', { err, output });
					return reject(err);
				} else {
					return resolve(output);
				}
			};
			this.docker.modem.followProgress(stream, onFinished, onProgress);
		});

	};

	async volumeCreateIfNotExist({ Name, path }) {
		return this.docker.createVolume({
			Name,
			Driver: 'local',
			DriverOpts: {
				o: 'bind',
				device: path,
				type: 'none'
			}
		});
	};

	async volumeRemove(Name) {
		try {
			const volume = this.docker.getVolume(Name);
			const info = await volume.inspect();
			this.logger.info('delete volume', Name);
			this.logger.debug('delete volume', info);
			return await volume.remove();
		} catch (err) {
			if (err.statusCode === 404 && err.reason === VolumeNotFound) {
				this.logger.info(err.json.message, 'delete skipped');
			} else {
				throw err;
			}
		}
	};
}
