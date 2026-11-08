import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import {execFileSync} from 'child_process';
import {os as light} from '@davidkhala/light/devOps.js';
import {configDaemon} from '../dockerCmd.js';
import {DockerodeOption} from '../constants.js';
import {ContainerManager} from '../docker.js';

/**
 * Real dockerd with mutual TLS on 127.0.0.1:2376.
 * Rewrites /etc/docker/daemon.json and restarts the docker service, so it needs root.
 */
describe('mutual TLS on 2376', function () {
 this.timeout(0);
 if (light.platform !== 'linux' || process.getuid() !== 0) {
		return;
	}
	let dir, originalConfig;
	const run = (...args) => execFileSync('openssl', args, {cwd: dir, stdio: 'ignore'});
	const read = (name) => fs.readFileSync(path.join(dir, name));
	const restart = () => execFileSync('systemctl', ['restart', 'docker']);
	const waitReady = async (opts) => {
		for (let i = 0; i < 30; i++) {
			try {
				return await new ContainerManager(opts).ping();
			} catch (e) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
		throw Error('dockerd is not ready on 2376');
	};

	before(async () => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-mtls-'));
		run('genrsa', '-out', 'ca-key.pem', '2048');
		run('req', '-new', '-x509', '-days', '1', '-key', 'ca-key.pem', '-out', 'ca.pem', '-subj', '/CN=test-ca');
		for (const [name, subj, ext] of [
			['server', '/CN=localhost', 'subjectAltName = DNS:localhost,IP:127.0.0.1\nextendedKeyUsage = serverAuth'],
			['client', '/CN=client', 'extendedKeyUsage = clientAuth']]) {
			run('genrsa', '-out', `${name}-key.pem`, '2048');
			run('req', '-new', '-key', `${name}-key.pem`, '-out', `${name}.csr`, '-subj', subj);
			fs.writeFileSync(path.join(dir, `${name}.cnf`), ext);
			run('x509', '-req', '-days', '1', '-in', `${name}.csr`, '-CA', 'ca.pem', '-CAkey', 'ca-key.pem', '-CAcreateserial', '-out', `${name}-cert.pem`, '-extfile', `${name}.cnf`);
		}

		originalConfig = configDaemon();
		configDaemon((data) => ({
			...data,
			hosts: ['unix:///var/run/docker.sock', 'tcp://127.0.0.1:2376'],
			tlsverify: true,
			tlscacert: path.join(dir, 'ca.pem'),
			tlscert: path.join(dir, 'server-cert.pem'),
			tlskey: path.join(dir, 'server-key.pem')
		}));
		restart();
	});
	after(() => {
		if (originalConfig) {
			configDaemon(() => originalConfig);
			restart();
		}
		fs.rmSync(dir, {recursive: true, force: true});
	});

	it('accepts a client presenting a certificate signed by the CA', async () => {
		const opts = DockerodeOption('127.0.0.1', {ca: read('ca.pem'), cert: read('client-cert.pem'), key: read('client-key.pem')});
		assert.strictEqual(await waitReady(opts), 'OK');
	});
	it('rejects a client without a certificate', async () => {
		const docker = new ContainerManager(DockerodeOption('127.0.0.1', {ca: read('ca.pem')}));
		await assert.rejects(docker.ping());
	});
});
