import {execSync} from "@davidkhala/light/devOps.js";

export function ping(domain, count = 3) {
	return ['ping', `${domain}`, '-c', `${count}`];
}

export const hang = ['sleep', 'infinity'];

export const info = () => execSync('docker info --format \'{{json .}}\'');