import {uid} from '@davidkhala/light/devOps.js';
import {OCI, OCIContainerOptsBuilder} from './oci.js';
import {Reason, ContainerStatus} from './constants.js';

const {NetworkNotFound} = Reason;
const {created, running} = ContainerStatus;
export const socketPath = `/run/user/${uid}/docker.sock`;

/**
 * @typedef {Object} DockerodeOpts
 * @property {string} [socketPath]
 * @property {string} [protocol]
 * @property {string} [host]
 * @property {number} [port]
 */

export class ContainerManager extends OCI {

	constructor(...params) {
		super(...params);
		this.containerStatus.beforeKill = [running];
		this.containerStatus.afterCreate = [created];
	}

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


	async imagePull(imageName) {

		const onProgress = (event) => {
			const {status, progress} = event;
			// docker event
			this.logger.debug(status, imageName, progress);
		};

		return super.imagePull(imageName, onProgress);

	}


}

export class ContainerOptsBuilder extends OCIContainerOptsBuilder {
	constructor(Image, Cmd, logger) {
		super(Image, Cmd, logger);
		this.opts.ExposedPorts = {};
		this.opts.Volumes = {};
	}

	setHostGateway() {
		if (!this.opts.HostConfig.ExtraHosts) {
			this.opts.HostConfig.ExtraHosts = [];
		}

		this.opts.HostConfig.ExtraHosts.push(
			'host.docker.internal:host-gateway',// docker host auto-binding
		);
	}

	/**
	 * Expose a port used within docker network only
	 * @param {string} containerPort
	 * @return {ContainerOptsBuilder}
	 */
	setExposedPort(containerPort) {
		this.opts.ExposedPorts[containerPort] = {};
		return this;
	}

	/**
	 * @param {string} network
	 * @param {string[]} Aliases
	 * @returns {ContainerOptsBuilder}
	 */
	setNetwork(network, Aliases) {
		if (!this.opts.NetworkingConfig) {
			this.opts.NetworkingConfig = {};
		}
		if (!this.opts.NetworkingConfig.EndpointsConfig) {
			this.opts.NetworkingConfig.EndpointsConfig = {};
		}
		this.opts.NetworkingConfig.EndpointsConfig[network] = {
			Aliases
		};
		return this;
	}

	/**
	 *
	 * @param {string} volumeName or a bind-mount absolute path
	 * @param {string} containerPath
	 * @returns {ContainerOptsBuilder}
	 */
	setVolume(volumeName, containerPath) {
		super.setVolume(volumeName, containerPath);
		this.opts.Volumes[containerPath] = {};// docker only
		return this;
	}
}