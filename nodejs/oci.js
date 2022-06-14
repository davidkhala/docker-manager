import Dockerode from "dockerode";
import {ContainerStatus, Reason} from "./constants.js";
import {sleep} from '@davidkhala/light/index.js'

const {ContainerNotFound, VolumeNotFound, NetworkNotFound, ImageNotFound} = Reason;
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
export class OCI {
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
	 * @param {ContainerOpts} createOptions
	 * @param {number} [retryTimes]
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

	async inflateContainerName(container_name) {
		const containers = await this.containerList();
		return containers.filter(container => container.Names.find(name => name.includes(container_name)));
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

	async imageList(opts = {all: undefined}) {
		return this.client.listImages(opts);
	}

	async imagePullIfNotExist(imageName) {
		const image = this.client.getImage(imageName);
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
	}

	async containerList({all, network, status} = {all: true}) {
		const filters = {
			network: network ? [network] : undefined,
			status: status ? [status] : undefined
		};
		return this.client.listContainers({all, filters});
	}

	async imageDelete(imageName) {
		try {
			const image = this.client.getImage(imageName);
			const imageInfo = await image.inspect();
			this.logger.info('delete image', imageInfo.RepoTags);
			return await image.remove({force: true});
		} catch (err) {
			if (err.statusCode === 404 && err.reason === ImageNotFound) {
				this.logger.debug(err.json.message, 'skip deleting');
			} else {
				throw err;
			}
		}
	}

	async imagePull(imageName, onProgressCallback) {

		const stream = await this.client.pull(imageName);
		return new Promise((resolve, reject) => {
			const onFinished = (err, output) => {
				if (err) {
					this.logger.error('pull image error', {err, output});
					return reject(err);
				} else {
					return resolve(output);
				}
			};
			this.client.modem.followProgress(stream, onFinished, onProgressCallback);
		});

	}
}




/**
 * @typedef {Object} ContainerOpts
 * @property {string} name container name
 * @property {string[]} Env
 * @property {string} Cmd
 * @property {string} Image
 * @property {Object} Hostconfig
 * sample: {
            Binds:[
                `${hostPath}:${containerPath}`
            ]
			PortBindings: {
				'7054': [
					{
						HostPort: port.toString()
					}
				]
			}

		},
 */
export class OCIContainerOptsBuilder {

	/**
	 *
	 * @param {string} Image
	 * @param {string[]} Cmd
	 * @param [logger]
	 */
	constructor(Image, Cmd, logger = console) {
		/**
		 * @type {ContainerOpts}
		 */
		this.opts = {
			Image,
			Cmd,
			Hostconfig: {}
		};
		this.logger = logger;
	}

	/**
	 * @param {string} name
	 * @returns {OCIContainerOptsBuilder}
	 */
	setName(name) {
		this.opts.name = name;
		return this;
	}

	/**
	 * @param {string[]} Env
	 * @returns {OCIContainerOptsBuilder}
	 */
	setEnv(Env) {
		this.opts.Env = Env;
		return this;
	}

	/**
	 * @param {object} env
	 * @returns {OCIContainerOptsBuilder}
	 */
	setEnvObject(env) {
		this.opts.Env = Object.entries(env).map(([key, value]) => `${key}=${value}`);
		return this;
	}

	/**
	 * @param {string} localBind `8051:7051`
	 * @returns {OCIContainerOptsBuilder}
	 */
	setPortBind(localBind) {
		const [HostPort, containerPort] = localBind.split(':');
		this.logger.info(`container:${containerPort} => localhost:${HostPort}`);
		if (!this.opts.ExposedPorts) {
			this.opts.ExposedPorts = {};
		}

		if (!this.opts.Hostconfig.PortBindings) {
			this.opts.Hostconfig.PortBindings = {};
		}
		this.opts.ExposedPorts[containerPort] = {};
		this.opts.Hostconfig.PortBindings[containerPort] = [{
			HostPort
		}];

		return this;
	};

	/**
	 *
	 * @param {string} volumeName or a bind-mount absolute path
	 * @param {string} containerPath
	 * @returns {OCIContainerOptsBuilder}
	 */
	setVolume(volumeName, containerPath) {
		if (!this.opts.Hostconfig.Binds) {
			this.opts.Hostconfig.Binds = [];
		}
		this.opts.Hostconfig.Binds.push(`${volumeName}:${containerPath}`);

		return this;
	}

}




