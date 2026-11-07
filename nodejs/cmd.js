import {execFileSync} from "@davidkhala/light/devOps.js";

export function ping(domain, count = 3) {
	return ['ping', `${domain}`, '-c', `${count}`];
}

export const hang = ['sleep', 'infinity'];

export const info = () => execFileSync('docker', ['info', '--format', '{{json .}}']);