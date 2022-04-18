import {execSync} from '@davidkhala/light/devOps.js'
import fs from 'fs'

export const daemonJsonFile = '/etc/docker/daemon.json'
export const hosts = ["unix:///var/run/docker.sock", "tcp://127.0.0.1:2375", "tcp://127.0.0.1:2376"]
export const setHosts = (callback = data => data) => {
	const data = fs.existsSync(daemonJsonFile) ? fs.readFileSync(daemonJsonFile).toString() : JSON.stringify({hosts})
	fs.writeFileSync(daemonJsonFile, callback(data))

}

export const systemPrune = () => execSync('docker system prune -a --force');

export const systemInfo = () => execSync('docker info --format \'{{json .}}\'');

export const copy = (containerName, from, to, toContainer) => {
	const cmd = toContainer ? `docker cp ${from} ${containerName}:${to}` : `docker cp ${containerName}:${from} ${to}`;
	return execSync(cmd);
};

