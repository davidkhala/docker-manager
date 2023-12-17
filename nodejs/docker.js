import {uid, os} from '@davidkhala/light/devOps.js';
import {OCI, OCIContainerOptsBuilder} from '@davidkhala/container/oci.js';
import {Reason, ContainerStatus} from '@davidkhala/container/constants.js';
import stream from 'stream';
import streamPromises from 'stream/promises';

const {NetworkNotFound} = Reason;
const {created, running, exited} = ContainerStatus;
export const socketPath = () => {
	switch (os.platform) {
		case 'win32':
			return '\\\\.\\pipe\\docker_engine'; // provided by Docker Desktop
		case 'linux':
			return `/run/user/${uid}/docker.sock`;
		case 'darwin':
			return '/var/run/docker.sock';
	}
};

/**
 * @typedef {Object} DockerodeOpts
 * @property {string} [socketPath]
 * @property {string} [protocol]
 * @property {string} [host]
 * @property {number} [port]
 */

export class ContainerManager extends OCI {

	constructor(opts = {socketPath: socketPath()}, logger) {
		super(opts, logger);
	}

	async networkCreate(Name, swarm) {
		const network = await this.client.createNetwork({
			Name, CheckDuplicate: true, Driver: swarm ? 'overlay' : 'bridge', Internal: false, Attachable: true
		});
		return await network.inspect();
	}

	async networkCreateIfNotExist(name, swarm) {
		try {
			const network = this.client.getNetwork(name);
			const status = await network.inspect();
			const {Scope, Driver, Containers} = status;
			this.logger.debug(`network[${name}] exist`, {
				Scope, Driver, Containers: Containers ? Object.values(Containers).map(({Name}) => Name) : undefined
			});
			if ((Scope === 'local' && swarm) || (Scope === 'swarm' && !swarm)) {
				this.logger.info(`network exist with unwanted ${Scope} ${swarm}`, 're-creating');
				await network.remove();
				return await this.networkCreate(name, swarm);
			}
			return status;
		} catch (err) {
			if (err.statusCode === 404 && err.reason === NetworkNotFound) {
				this.logger.info(err.json.message, 'creating');
				return await this.networkCreate(name, swarm);
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

	async containerExec(container_name, opts) {
		const {Cmd} = opts;
		const container = this.client.getContainer(container_name);
		const exec = await container.exec(Object.assign({
			AttachStderr: true,
			AttachStdout: true,
			Cmd,
		}, opts));

		const dockerExecStream = await exec.start({});

		const stdoutStream = new stream.PassThrough();
		const stderrStream = new stream.PassThrough();

		this.client.modem.demuxStream(dockerExecStream, stdoutStream, stderrStream);

		dockerExecStream.resume();

		await streamPromises.finished(dockerExecStream);

		const stderr = stderrStream.read() || '';// read might return null
		const stdout = stdoutStream.read() || '';// read might return null
		const errStr = stderr.toString();
		const outStr = stdout.toString();

		const {ExitCode} = await exec.inspect();

		if (stderr || ExitCode !== 0) {
			const err = Error(errStr);
			err.code = ExitCode;
			err.stderr = errStr;
			err.stdout = outStr;
			throw err;
		}
		return outStr;

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
			this.logger.debug(status, imageName, progress || '');
		};

		return super.imagePull(imageName, onProgress);

	}


	_afterCreate() {
		return [created];
	}

	_afterStart() {
		return [running, exited];
	}

	_beforeKill() {
		return [running];
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

		this.opts.HostConfig.ExtraHosts.push('host.docker.internal:host-gateway', // docker host auto-binding
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