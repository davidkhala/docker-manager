import {os, uid} from '@davidkhala/light/devOps.js';
import {ContainerStatus} from './constants.js';
import {OCI, OCIContainerOptsBuilder} from './oci.js';

const {initialized, running} = ContainerStatus;

export const socketPath = () => {
	switch (os.platform) {
		case 'win32':
			return '\\\\.\\pipe\\docker_engine'; // conflict with Docker Desktop
		case 'linux':
			return `/run/user/${uid}/podman/podman.sock`;
	}
};

export class ContainerManager extends OCI {

	/**
	 *
	 * @param {DockerodeOpts} [opts]
	 * @param [logger]
	 */
	constructor(opts = {socketPath: socketPath()}, logger) {
		super(opts, logger);
		this.containerStatus.afterCreate = [initialized];
		this.containerStatus.beforeKill = [running];
	}

	async networkCreate({Name}, rootless) {
		const network = await this.client.createNetwork({
			Name,
			Driver: rootless ? 'macvlan' : 'bridge',
		});
		return await network.inspect();
	}

	async imagePull(imageName) {

		const onProgress = (event) => {
			const {status, progressDetail, id} = event;
			// Podman event
			this.logger.debug(status, imageName, progressDetail, id);
		};

		return super.imagePull(imageName, onProgress);

	}

}

export class ContainerOptsBuilder extends OCIContainerOptsBuilder {
	/**
	 * TODO
	 * @param {string} network
	 * @returns {ContainerOptsBuilder}
	 */
	setNetwork(network) {

		this.opts.HostConfig.NetworkMode = network;

		return this;
	}
}