import {uid} from '@davidkhala/light/devOps.js'
import OCI from './oci.js'

export const socketPath = `/run/user/${uid}/podman/podman.sock`


export class Podman extends OCI {
	/**
	 *
	 * @param Name
	 * @param path
	 */
	async volumeCreateIfNotExist({Name, path}) {
		const opts = {
			Name,
			Driver: 'local',
			DriverOpts: {}
		}
		if (path) {
			opts.DriverOpts.device = path
		}
		return this.client.createVolume(opts);
	}

	async networkCreate({Name}, rootless) {
		const network = await this.client.createNetwork({
			Name, CheckDuplicate: true,
			Driver: rootless? 'macvlan' : 'bridge',
			Internal: false,
			Attachable: true
		});
		return await network.inspect();
	}

}