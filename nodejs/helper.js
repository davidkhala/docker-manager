const os = require('os');

const ips = () => {
	const allInterfaces = os.networkInterfaces();
	const ips = [];
	for (const interfaceName in allInterfaces) {
		if (interfaceName.includes('docker')) {
			continue;
		}
		const Interface = allInterfaces[interfaceName];
		for (const each of Interface) {
			if (each.family === 'IPv4' && !each.internal) {
				ips.push(each.address);
			}
		}
	}
	return ips;
};
exports.ips = ips;
exports.ip = () => {
	const ips = ips();
	if (ips.length === 1) {
		return ips[0];
	} else if (ips.length > 1) {
		throw `multiple ip found ${ips}`;
	} else {
		throw 'no ip found';
	}
};