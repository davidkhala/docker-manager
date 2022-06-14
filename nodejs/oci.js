import Dockerode from "dockerode";
import {ContainerStatus, Reason} from "./constants.js";
import {sleep} from '@davidkhala/light/index.js'

const {ContainerNotFound, VolumeNotFound, NetworkNotFound} = Reason;
const {exited, created, dead, initialized} = ContainerStatus
/**
 * @typedef {Object} DockerodeOpts
 * @property {string} [socketPath]
 * @property {string} [protocol]
 * @property {string} [host]
 * @property {number} [port]
 */


/**
 * Open Container Initiative: OCI
 */
export default class OCI {
	/**
	 *
	 * @param {DockerodeOpts} [opts]
	 * @param [logger]
	 */
	constructor(opts, logger = console) {
		if (opts && !opts.protocol && opts.host) {
			opts.protocol = 'ssh';
		}

		this.client = new Dockerode(opts);
		this.logger = logger;

		this.prune = {
			images: this.client.pruneImages,
			system: async () => {
				await this.client.pruneContainers();
				await this.client.pruneVolumes();
				await this.client.pruneNetworks();
			}
		};
	}

	async info() {
		return this.client.info();
	}

	async ping() {
		const result = await this.client.ping();
		return result.toString();
	}

	async volumeRemove(Name) {
		try {
			const volume = this.client.getVolume(Name);
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
	}

	/**
	 *
	 * @param {string} containerName
	 * @return {Promise}
	 */
	async containerDelete(containerName) {
		const container = this.client.getContainer(containerName);
		try {
			const containInfo = await container.inspect();
			const currentStatus = containInfo.State.Status;
			this.logger.debug('delete container', containerName, currentStatus);
			if (![exited, created, dead, initialized].includes(currentStatus)) {
				await container.kill();
			}
			return await container.remove();

		} catch (err) {
			if (err.statusCode === 404 && err.reason === ContainerNotFound) {
				this.logger.info(err.json.message, 'deleting skipped');
			} else {
				throw err;
			}
		}
	}

	/**
	 * @param {containerOpts} createOptions
	 * @param {number} [retryTimes]
	 * @returns {Promise<*>}
	 */
	async containerStart(createOptions, retryTimes = 1) {
		const {name: containerName, Image: imageName} = createOptions;
		let container = this.client.getContainer(containerName);
		let info;

		try {
			info = await container.inspect();
			this.logger.info('container found', {containerName, status: info.State.Status});

		} catch (err) {
			if (err.reason === ContainerNotFound && err.statusCode === 404) {
				this.logger.info(err.json.message);
				this.logger.info(`creating container [${containerName}]`)
				container = await this.client.createContainer(createOptions);
				info = await container.inspect();
			} else {
				throw err;
			}
		}
		const start = async (c, retryCountDown) => {
			try {
				await c.start();
			} catch (e) {
				if (e.message.includes('port is already allocated')
					&& e.reason === 'server error'
					&& e.statusCode === 500
					&& retryCountDown > 0) {
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
	}

	async networkRemove(Name) {
		try {
			const network = this.client.getNetwork(Name);
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
}