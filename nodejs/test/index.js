import assert from 'node:assert';
import { ContainerManager } from '../docker.js';
import os from "node:os";
import fs from "node:fs";

describe('docker', function () {
    this.timeout(0)
    it('ping', async () => {
        const docker = new ContainerManager();
        assert.strictEqual(await docker.ping(), 'OK');
        const info = await docker.info()
        fs.writeFileSync(`test/artifacts/info-${os.platform()}.json`, JSON.stringify(info, null, 2));

    });
    if (os.platform() === 'win32') {
        it('test windows socket path', async function () {

            const socketPath = 'npipe:////./pipe/docker_engine'
            const docker = new ContainerManager({ socketPath });
            const expectedError = {
                "errno": -4058,
                "code": "ENOENT",
                "syscall": "connect",
                "address": socketPath
            }
            await assert.rejects(async () => docker.ping(), expectedError, 'AI error: This URI format socket path is only used for $env:DOCKER_HOST');
        })
    }


});

