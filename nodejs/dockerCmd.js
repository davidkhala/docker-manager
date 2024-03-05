import fs from 'fs';

import {execSync, homedir, os} from '@davidkhala/light/devOps.js';

export const daemonJsonFile = {
	linux: '/etc/docker/daemon.json',
	win32: `${homedir}\\.docker\\daemon.json` // for Docker Desktop on Windows Desktop
};
export const hosts = {
	linux: ['unix:///var/run/docker.sock', 'tcp://127.0.0.1:2375', 'tcp://0.0.0.0:2376'],
	win32: ['tcp://127.0.0.1:2375', 'tcp://0.0.0.0:2376'] // TODO not tested yet
};
export const configDaemon = (decorator = data => data) => {
	const configFile = daemonJsonFile[os.platform];
	const data = fs.readFileSync(configFile).toString();
	const processedData = decorator(JSON.parse(data));
	fs.writeFileSync(configFile, JSON.stringify(processedData));
	return processedData;
};

export const systemPrune = () => execSync('docker system prune -a --force');

export const systemInfo = () => execSync('docker info --format \'{{json .}}\'');

export const copy = (containerName, from, to, toContainer) => {
	const cmd = toContainer ? `docker cp ${from} ${containerName}:${to}` : `docker cp ${containerName}:${from} ${to}`;
	return execSync(cmd);
};

