const util = require('util');
const exec = util.promisify(require('child_process').exec);
exports.systemPrune = async () => {
	const {stdout, stderr} = await exec('docker system prune --force');
	if (stderr) {
		throw stderr;
	}
	return stdout;
};
exports.nodeInspect = async (id) => {
	const {stdout, stderr} = await exec(`docker node inspect ${id}`);
	if (stderr) throw stderr;
	return JSON.parse(stdout)[0];
};
exports.nodeSelf = async (pretty) => {
	const info = await exports.nodeInspect('self');
	if (pretty) {
		const {
			ID, Status, ManagerStatus,
			Description: {Hostname, Platform, Engine: {EngineVersion}},
		} = info;
		return {ID, Hostname, Platform, EngineVersion, Status, ManagerStatus};
	}
	return info;
};
exports.copy = async (containerName, from, to, toContainer) => {
	const cmd = toContainer ? `docker cp ${from} ${containerName}:${to}` : `docker cp ${containerName}:${from} ${to}`;
	const {stdout, stderr} = await exec(cmd);
	if (stderr) throw stderr;
	return stdout;
};