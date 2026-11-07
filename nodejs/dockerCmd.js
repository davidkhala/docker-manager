import fs from 'fs';

import {execFile, execFileSync, homedir, os} from '@davidkhala/light/devOps.js';
import {dockerHost} from './constants.js';

/**
 * Environment for Docker CLI calls so that they can target the specified socket path
 * @param {string} [socketPath] the socket path
 */
const cliEnv = (socketPath) => socketPath
    ? {...process.env, DOCKER_HOST: dockerHost(socketPath)}
    : process.env;

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

/**
 * Pull an image.
 * dockerode's pull stream hangs forever on Windows named pipe: the HTTP response never emits 'end'/'close'.
 * See known issue apocas/docker-modem#83
 * @param {string} name
 * @param {string} [socketPath]
 */
export const pull = (name, socketPath) => {
    execFileSync('docker', ['pull', name], {stdio: 'inherit', env: cliEnv(socketPath)});
};

/**
 * Run a command in a running container.
 * dockerode's exec stream hangs forever on Windows named pipe: it never emits 'end'/'close'.
 * See known issue apocas/docker-modem#83
 * @param {string} containerName
 * @param {{Cmd: string[], Env?: string[], WorkingDir?: string, User?: string}} opts
 * @param {string} [socketPath]
 * @returns {Promise<string>} stdout
 * @throws {Error} with `code`, `stdout`, `stderr` when exit code is non-zero or anything is written to stderr
 */
export const exec = async (containerName, {Cmd, Env = [], WorkingDir, User}, socketPath) => {
    const args = ['exec'];
    if (User) args.push('--user', User);
    if (WorkingDir) args.push('--workdir', WorkingDir);
    for (const e of Env) args.push('--env', e);
    args.push(containerName, ...Cmd);

    
    // On non-zero exit, execFile rejects with err.code (exit code), err.stdout and err.stderr
    const {stdout, stderr} = await execFile('docker', args, {env: cliEnv(socketPath)});
    if (stderr) {
        const err = Error(stderr);
        err.code = 0;
        err.stdout = stdout;
        err.stderr = stderr;
        throw err;
    }
    return stdout;
};

export const systemPrune = () => execFileSync('docker', ['system', 'prune', '-a', '--force']);

export const systemInfo = () => execFileSync('docker', ['info', '--format', '{{json .}}']);

export const copy = (containerName, from, to, toContainer) => {
    const args = toContainer ? [from, `${containerName}:${to}`] : [`${containerName}:${from}`, to];
    return execFileSync('docker', ['cp', ...args]);
};

