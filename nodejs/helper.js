const os = require('os');

const ips = () => {
	const allInterfaces = os.networkInterfaces();
	const results = [];
	for (const interfaceName in allInterfaces) {
		if (interfaceName.includes('docker')) {
			continue;
		}
		const Interface = allInterfaces[interfaceName];
		for (const each of Interface) {
			if (each.family === 'IPv4' && !each.internal) {
				results.push(each.address);
			}
		}
	}
	return results;
};
exports.ips = ips;
exports.ip = () => {
	const ipList = ips();
	if (ipList.length === 1) {
		return ipList[0];
	} else if (ipList.length > 1) {
		throw Error(`multiple ip found ${ipList}`);
	} else {
		throw Error('no ip found');
	}
};