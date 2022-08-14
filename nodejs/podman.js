import {uid} from '@davidkhala/light/devOps.js'
import {OCI, OCIContainerOptsBuilder} from './oci.js'

export const socketPath = `/run/user/${uid}/podman/podman.sock`

export class Container extends OCI {

	async networkCreate({Name}, rootless) {
		const network = await this.client.createNetwork({
			Name,
			Driver: rootless ? 'macvlan' : 'bridge',
		});
		return await network.inspect();
	}

	async imagePull(imageName) {

		const onProgress = (event) => {
			const {status, progressDetail, id} = event
			// Podman event
			this.logger.debug(status, imageName, progressDetail, id);
		};

		return super.imagePull(imageName, onProgress)

	}

}

export class ContainerOptsBuilder extends OCIContainerOptsBuilder {
	/**
	 * TODO
	 * @param {string} network
	 * @returns {ContainerOptsBuilder}
	 */
	setNetwork(network) {

		this.opts.HostConfig.NetworkMode = network

		return this;
	}
}