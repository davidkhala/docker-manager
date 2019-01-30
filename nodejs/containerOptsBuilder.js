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

/**
 *
 * @param {containerOpts} opts
 * @param localBind `8051:7051`
 * @returns {containerOpts}
 */
exports.setPortBind = (opts, localBind) => {
	const [containerPort, HostPort] = localBind.split(':');
	opts.ExposedPorts[containerPort] = {};
	opts.Hostconfig.PortBindings[containerPort].push({
		HostPort
	});

	return opts;
};
exports.setNetwork = (opts, network, Aliases) => {
	opts.NetworkingConfig.EndpointsConfig[network] = {
		Aliases
	};
	return opts;
};


