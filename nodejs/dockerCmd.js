const util = require('util');
const exec = util.promisify(require('child_process').exec);
const executor = async (cmd) => {
	const {stdout, stderr} = await exec(cmd);
	if (stderr) {
		throw stderr;
	}
	return stdout;
};
exports.systemPrune = async () => {
	return await executor('docker system prune -a --force');
};
exports.systemInfo = async () => {
	return await executor('docker info --format \'{{json .}}\'');
};
exports.swarmWorkerInfo = async () => {
	const {Swarm} = JSON.parse(await exports.systemInfo());
	return Swarm;
};
exports.nodeInspect = async (id) => {
	const stdout = await executor(`docker node inspect ${id}`);
	return JSON.parse(stdout)[0];
};
exports.nodeSelf = async (pretty) => {
	const info = await exports.nodeInspect('self');
	if (pretty) {
		const {
			ID, Status, ManagerStatus,
			Description: {Hostname, Platform, Engine: {EngineVersion}}
		} = info;
		return {ID, Hostname, Platform, EngineVersion, Status, ManagerStatus};
	}
	return info;
};
exports.copy = async (containerName, from, to, toContainer) => {
	const cmd = toContainer ? `docker cp ${from} ${containerName}:${to}` : `docker cp ${containerName}:${from} ${to}`;
	return await executor(cmd);
};
exports.joinToken = async (role = 'manager') => {
	const cmd = `docker swarm join-token ${role} | grep docker`;
	const stdout = await executor(cmd);
	return stdout.trim();
};
exports.advertiseAddr = async (fullToken) => {
	if (!fullToken) {
		fullToken = await exports.joinToken();
	}
	const address = fullToken.split(' ')[5];
	const token = fullToken.split(' ')[4];
	const addressSlices = address.split(':');
	return {address: addressSlices[0], token, port: addressSlices[1], AdvertiseAddr: address};
};
exports.imageBuild = async (DockerFileDir, imageName) => {
	const cmd = `docker build --tag=${imageName} ${DockerFileDir}`;
	return await executor(cmd);
};