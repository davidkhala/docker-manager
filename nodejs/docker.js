import OCI from './oci.js'
import {Reason} from './constants.js';

const {ImageNotFound, NetworkNotFound} = Reason;

/**
 * @typedef {Object} DockerodeOpts
 * @property {string} [socketPath]
 * @property {string} [protocol]
 * @property {string} [host]
 * @property {number} [port]
 */

export default class DockerManager extends OCI {


	async networkCreate({Name}, swarm) {
		const network = await this.client.createNetwork({
			Name, CheckDuplicate: true,
			Driver: swarm ? 'overlay' : 'bridge',
			Internal: false,
			Attachable: true
		});
		return await network.inspect();
	}

	async networkCreateIfNotExist({Name}, swarm) {
		try {
			const network = this.client.getNetwork(Name);
			const status = await network.inspect();
			const {Scope, Driver, Containers} = status;
			this.logger.debug(`network[${Name}] exist`, {
				Scope,
				Driver,
				Containers: Containers ? Object.values(Containers).map(({Name}) => Name) : undefined
			});
			if ((Scope === 'local' && swarm) || (Scope === 'swarm' && !swarm)) {
				this.logger.info(`network exist with unwanted ${Scope} ${swarm}`, 're-creating');
				await network.remove();
				return await this.networkCreate({Name}, swarm);
			}
			return status;
		} catch (err) {
			if (err.statusCode === 404 && err.reason === NetworkNotFound) {
				this.logger.info(err.json.message, 'creating');
				return await this.networkCreate({Name}, swarm);
			} else {
				throw err;
			}
		}
	}

	/**
	 * @param {string} containerName
	 */
	async containerRestart(containerName) {
		const container = this.client.getContainer(containerName);
		const containInfo = await container.inspect();
		this.logger.debug('restart container', containerName, containInfo.State.Status);
		await container.restart();
	}

	async containerExec({container_name, Cmd}) {
		const container = this.client.getContainer(container_name);
		const exec = await container.exec({Cmd});
		await exec.start();
		return await exec.inspect();
	}

	/**
	 * TODO how is options
	 * @param container_name
	 * @return {Promise<void>}
	 */
	async containerSolidify({container_name}) {
		const container = this.client.getContainer(container_name);
		await container.commit();
	}

	async containerList({all, network, status} = {all: true}) {
		const filters = {
			network: network ? [network] : undefined,
			status: status ? [status] : undefined
		};
		return this.client.listContainers({all, filters});
	}

	async inflateContainerName(container_name) {
		const containers = await this.containerList();
		return containers.filter(container => container.Names.find(name => name.includes(container_name)));
	}

	async imageList({all} = {}) {
		return this.client.listImages({all});
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

	async imageCreateIfNotExist(imageName) {
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

	async imagePull(imageName) {

		const stream = await this.client.pull(imageName);
		return new Promise((resolve, reject) => {
			const onProgress = (event) => {
				const {status, progress, progressDetail, id} = event
				if (progress) {
					// docker event
					this.logger.debug(status, imageName, progress);
				} else {
					// podman event
					this.logger.debug(status, imageName, progressDetail, id);
				}

			};
			const onFinished = (err, output) => {
				if (err) {
					this.logger.error('pull image error', {err, output});
					return reject(err);
				} else {
					return resolve(output);
				}
			};
			this.client.modem.followProgress(stream, onFinished, onProgress);
		});

	}

	async volumeCreateIfNotExist({Name, path}) {
		return this.client.createVolume({
			Name,
			Driver: 'local',
			DriverOpts: {
				o: 'bind',
				device: path,
				type: 'none'
			}
		});
	}

}
