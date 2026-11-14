import assert from 'node:assert';
import {ContainerManager} from '../docker.js';
import os from "node:os";
import {isRootless} from "../dockerCmd.js";
import {socketPath} from "../constants.js";

describe('docker', function () {
    this.timeout(0)
    assert.equal(os.platform(), 'linux')
    assert.ok(isRootless)

    it('round-trip', async () => {
        const docker = new ContainerManager({socketPath: socketPath(true)});
        assert.strictEqual(await docker.ping(), 'OK');
        assert.ok(await docker.isRootless())
    });

});

