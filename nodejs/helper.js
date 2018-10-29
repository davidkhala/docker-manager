const os = require('os');
exports.ips = () => {
	const allInterfaces = os.networkInterfaces();
	const ips = [];
	for (const interfaceName in allInterfaces) {
		if (interfaceName.includes('docker')) continue;
		const Interface = allInterfaces[interfaceName];
		for (const each of Interface) {
			if (each.family === 'IPv4' && !each.internal) {
				ips.push(each.address);
			}
		}
	}
	return ips;
};
exports.hostname = os.hostname;