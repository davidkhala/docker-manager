import {uid, os} from '@davidkhala/light/devOps.js';

export const socketPath = () => {
	switch (os.platform) {
		case 'win32':
			return '\\\\.\\pipe\\docker_engine'; // provided by Docker Desktop
		case 'linux':
			return `/run/user/${uid}/docker.sock`;
		case 'darwin':
			return '/var/run/docker.sock';
	}
};

export const DockerodeOption = (host = '127.0.0.1', tls) => {

	return {
		protocol: tls ? 'https' : 'http',
		host, port: tls ? 2376 : 2375
	};
};