/**
 * @typedef containerOpts
 * @property {string} name container name
 * @property {string[]} Env
 * @property {string} Cmd
 * @property {string} Image
 * @property {Object} ExposedPorts
 * sample: {
			'7054': {}
		},
 * @property {Object} Volumes
 * sample: {
			[containerPath]: {}
		};
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
 * @property {Object} NetworkingConfig: {
			EndpointsConfig: {
				[network]: {
					Aliases: [container_name]
				}
			}
		}
 */

class containerOptsBuilder {

	/**
	 *
	 * @param {string} Image
	 * @param {string[]} Cmd
	 * @param logger
	 */
	constructor(Image, Cmd, logger = console) {
		this.opts = {
			Image,
			Cmd
		};
		this.logger = logger;
	}

	/**
	 * @param {string} name
	 * @returns {containerOptsBuilder}
	 */
	setName(name) {
		this.opts.name = name;
		return this;
	}

	/**
	 * @param {string[]} Env
	 * @returns {containerOptsBuilder}
	 */
	setEnv(Env) {
		this.opts.Env = Env;
		return this;
	}

	/**
	 * @param {object} env
	 * @returns {containerOptsBuilder}
	 */
	setEnvObject(env) {
		this.opts.Env = Object.entries(env).map(([key, value]) => `${key}=${value}`);
		return this;
	}

	/**
	 * Expose a port used within docker network only
	 * @param {string} containerPort
	 */
	setExposedPort(containerPort) {
		this.opts.ExposedPorts[containerPort] = {};
		return this;
	}

	/**
	 * @param {string} localBind `8051:7051`
	 * @returns {containerOptsBuilder}
	 */
	setPortBind(localBind) {
		const [HostPort, containerPort] = localBind.split(':');
		this.logger.info(`container:${containerPort} => localhost:${HostPort}`);
		if (!this.opts.ExposedPorts) {
			this.opts.ExposedPorts = {};
		}
		if (!this.opts.Hostconfig) {
			this.opts.Hostconfig = {};
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
	 * @param {string} network
	 * @param {string[]} Aliases
	 * @returns {containerOptsBuilder}
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
	};

	/**
	 *
	 * @param {string} volumeName or a bind-mount absolute path
	 * @param {string} containerPath
	 * @returns {containerOptsBuilder}
	 */
	setVolume(volumeName, containerPath) {
		if (!this.opts.Volumes) {
			this.opts.Volumes = {};
		}
		if (!this.opts.Hostconfig) {
			this.opts.Hostconfig = {};
		}
		if (!this.opts.Hostconfig.Binds) {
			this.opts.Hostconfig.Binds = [];
		}
		this.opts.Volumes[containerPath] = {};
		this.opts.Hostconfig.Binds.push(`${volumeName}:${containerPath}`);
		return this;
	}

	/**
	 *
	 * @returns {containerOpts}
	 */
	build() {
		return this.opts;
	}
}

module.exports = containerOptsBuilder;



