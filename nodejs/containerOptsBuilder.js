/**
 * @typedef containerOpts
 * @property {string} name container name
 * @property {string[]} Env
 * @property {string} Cmd
 * @property {string} Image
 * @property {object} ExposedPorts
 * sample: {
			'7054': {}
		},
 * @property {object} Hostconfig
 * sample: {
			PortBindings: {
				'7054': [
					{
						HostPort: port.toString()
					}
				]
			}

		},
 * @property {object} NetworkingConfig: {
			EndpointsConfig: {
				[network]: {
					Aliases: [container_name]
				}
			}
		}
 */
const logger = require('khala-nodeutils').logger().new('containerOptsBuilder');
/**
 *
 * @param {containerOpts} opts
 * @param localBind `8051:7051`
 * @returns {containerOpts}
 */
exports.setPortBind = (opts, localBind) => {
	const [HostPort, containerPort] = localBind.split(':');
	logger.info(`container:${containerPort}=>localhost:${HostPort}`);
	if (!opts.ExposedPorts) {
		opts.ExposedPorts = {};
	}
	if (!opts.Hostconfig) {
		opts.Hostconfig = {};
	}
	if (!opts.Hostconfig.PortBindings) {
		opts.Hostconfig.PortBindings = {};
	}
	opts.ExposedPorts[containerPort] = {};
	opts.Hostconfig.PortBindings[containerPort] = [{
		HostPort: HostPort.toString()
	}];

	return opts;
};
exports.setNetwork = (opts, network, Aliases) => {
	if (!opts.NetworkingConfig) {
		opts.NetworkingConfig = {};
	}
	if (!opts.NetworkingConfig.EndpointsConfig) {
		opts.NetworkingConfig.EndpointsConfig = {};
	}
	opts.NetworkingConfig.EndpointsConfig[network] = {
		Aliases
	};
	return opts;
};


