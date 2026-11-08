import {uid, os} from '@davidkhala/light/devOps.js';

export const socketPath = (rootless) => {
	switch (os.platform) {
		case 'win32':
			return '\\\\.\\pipe\\docker_engine'; // provided by Docker Desktop
		case 'linux':
			return rootless ? `/run/user/${uid}/docker.sock` : '/var/run/docker.sock';
		case 'darwin':
			return '/var/run/docker.sock';
	}
};

/**
 * Convert a socket path to a DOCKER_HOST value for the Docker CLI.
 * @param {string} socket
 * @returns {string}
 */
export const dockerHost = (socket) => {
	if (os.platform === 'win32') {
		return `npipe://${socket.replace(/\\/g, '/')}`;
	}
	return `unix://${socket}`;
};

/**
 * @param {string} [host]
 * @param {boolean|{ca: Buffer|string, cert?: Buffer|string, key?: Buffer|string}} [tls] `true` for TLS with default trust store;
 * an object enables TLS with the given CA, and client cert/key for mutual TLS (daemon with `tlsverify`)
 */
export const DockerodeOption = (host = '127.0.0.1', tls) => {

	return {
		protocol: tls ? 'https' : 'http',
		host, port: tls ? 2376 : 2375,
		...(typeof tls === 'object' ? tls : {})
	};
};