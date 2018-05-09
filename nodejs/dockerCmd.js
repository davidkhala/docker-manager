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
	if(stderr) throw stderr;
	return JSON.parse(stdout)[0];
};