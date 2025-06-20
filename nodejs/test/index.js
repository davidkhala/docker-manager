import assert from 'assert';
import {ContainerManager} from '../docker.js';
import os from "os";

describe('docker', () => {

    it('ping', async () => {
        const docker = new ContainerManager();
        const info = await docker.ping();
        assert.strictEqual(info, 'OK');
    });
    it('test windows socket path', async () => {
        if (os.platform() !== 'win32') {
            return
        }
        const socketPath = 'npipe:////./pipe/docker_engine'
        const docker = new ContainerManager({socketPath});
        const expectedError = {
            "errno": -4058,
            "code": "ENOENT",
            "syscall": "connect",
            "address": socketPath
        }
        await assert.rejects(async () => docker.ping(), expectedError, 'AI error: This URI format socket path is only used for $env:DOCKER_HOST');
    })
});

