import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import {execFileSync} from 'child_process';
import {os as light} from '@davidkhala/light/devOps.js';
import {DockerodeOption} from '../constants.js';
import {ContainerManager} from '../docker.js';

const isRootful = () => {
    try {
        return !execFileSync('docker', ['info', '--format', '{{json .SecurityOptions}}']).toString().includes('rootless');
    } catch {
        return false;
    }
};

/**
 * Real rootful dockerd with mutual TLS on 127.0.0.1:2376.
 * A systemd drop-in appends the TLS flags to the original `ExecStart` of docker.service, so `-H fd://` is kept.
 * (`hosts` in daemon.json is not used: it conflicts with the `-H` flag of docker.service and dockerd refuses to start.)
 * Needs root or passwordless sudo; skipped for rootless dockerd.
 */
describe('mutual TLS on 2376', function () {
    this.timeout(0);
    if (light.platform !== 'linux' || !isRootful()) {
        return;
    }
    const exec = (cmd, args, opts) => process.getuid() === 0
        ? execFileSync(cmd, args, opts)
        : execFileSync('sudo', [cmd, ...args], opts);
    const dropInDir = '/etc/systemd/system/docker.service.d';
    const dropIn = `${dropInDir}/mtls-test.conf`;

    let dir;
    const run = (...args) => execFileSync('openssl', args, {cwd: dir, stdio: 'ignore'});
    const read = (name) => fs.readFileSync(path.join(dir, name));
    const reload = () => {
        exec('systemctl', ['daemon-reload']);
        exec('systemctl', ['restart', 'docker']);
    };
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

    before(() => {
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

        // e.g. { path=/usr/bin/dockerd ; argv[]=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock ; ignore_errors=no ; ... }
        const show = execFileSync('systemctl', ['show', 'docker', '-p', 'ExecStart', '--value']).toString();
        const [, command] = show.match(/argv\[\]=(.*?) ; ignore_errors=/);
        const flags = [
            '-H tcp://127.0.0.1:2376', '--tlsverify',
            `--tlscacert=${path.join(dir, 'ca.pem')}`,
            `--tlscert=${path.join(dir, 'server-cert.pem')}`,
            `--tlskey=${path.join(dir, 'server-key.pem')}`
        ];
        exec('mkdir', ['-p', dropInDir]);
        exec('tee', [dropIn], {input: `[Service]\nExecStart=\nExecStart=${command} ${flags.join(' ')}\n`, stdio: ['pipe', 'ignore', 'inherit']});
        reload();
    });
    after(() => {
        if (dir) {
            exec('rm', ['-f', dropIn]);
            reload();
            fs.rmSync(dir, {recursive: true, force: true});
        }
    });

    it('accepts a client presenting a certificate signed by the CA', async () => {
        const opts = DockerodeOption('127.0.0.1', {
            ca: read('ca.pem'),
            cert: read('client-cert.pem'),
            key: read('client-key.pem')
        });
        assert.strictEqual(await waitReady(opts), 'OK');
    });
    it('rejects a client without a certificate', async () => {
        const docker = new ContainerManager(DockerodeOption('127.0.0.1', {ca: read('ca.pem')}));
        await assert.rejects(docker.ping());
    });
});
