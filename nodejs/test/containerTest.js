import assert from 'assert';
import {consoleLogger} from '@davidkhala/logger/log4.js';
import {ContainerManager, ContainerOptsBuilder} from '../docker.js';
import {hang, ping} from '../cmd.js';
import os from 'os';


const logger = consoleLogger('test:docker');
const manager = new ContainerManager(undefined, logger);

describe('hello-world', function () {
    this.timeout(0);

    const imageName = 'hello-world';
    const containerName = imageName;
    before(async () => {
        await manager.imagePull(imageName);
    });
    it('container start,restart,exec', async () => {

        const containerOptsBuilder = new ContainerOptsBuilder(imageName, []);
        containerOptsBuilder.name = containerName;
        const {opts} = containerOptsBuilder;
        await manager.containerStart(opts);
        await manager.containerRestart(containerName);
    });
    after(async () => {
        await manager.container.delete(containerName);
        await manager.image.delete(imageName);
    });

});

describe('run command', function () {
    this.timeout(0);
    if (os.platform() === 'win32') {
        return;
    }
    it('fabric-tools: command in lasting container', async () => {
        const imageName = 'hyperledger/fabric-tools';
        const containerName = 'cli';
        await manager.imagePull(imageName);
        const containerOptsBuilder = new ContainerOptsBuilder(imageName, ['cat']);
        containerOptsBuilder.name = containerName;
        containerOptsBuilder.tty = true;
        const {opts} = containerOptsBuilder;
        opts.AttachStdin = true;
        opts.AttachStdout = true;
        const info = await manager.containerStart(opts);
        console.debug({info});
        // run

        const result = await manager.containerExec(containerName, {Cmd: ['echo', 'x']});
        assert.equal(result, 'x\n');
        // cleanup
        await manager.container.delete(containerName);
    });

});


describe('busy box', function () {
    this.timeout(0);
    if (os.platform() === 'win32') {
        const Image = 'mcr.microsoft.com/windows/nanoserver:ltsc2025';
        const containerName = 'tool';
        before(async () => {
            await manager.imagePull(Image);
            // nanoserver has no `sleep`; use a looping ping to keep the container alive
            const containerOptsBuilder = new ContainerOptsBuilder(Image, ['ping', '-t', 'localhost']);
            containerOptsBuilder.name = containerName;
            const {opts} = containerOptsBuilder;
            await manager.containerStart(opts);
        });
        it('run-windows', async () => {
            // nanoserver shell is cmd.exe, not sh
            let [out, err] = await manager.run(Image, ['cmd', '/S', '/C', 'echo message'], true);
            assert.equal(err, '');
            assert.equal(out, 'message');

            [out, err] = await manager.run(Image, ['cmd', '/S', '/C', 'echo message 1>&2'], true);
            assert.equal(err, 'message');
            assert.equal(out, '');
        });
        if (!process.env.GITHUB_ACTIONS) {
            // GitHub runner in Azure doesn't allow ping
            it('ping-windows', async () => {
                // nanoserver containers have no external DNS by default — ping to a public host always fails
                // with a "could not find host" message written to stdout (not stderr).
                // containerExec throws because ping exits non-zero; the DNS error text is on e.stdout.
                try {
                    await manager.containerExec(containerName, {Cmd: ['ping', '-n', '3', 'google.com']});
                    assert.fail('should throw: nanoserver cannot resolve external hostnames');
                } catch (e) {
                    // assert the exact stdout to verify the DNS-unavailable behaviour of nanoserver
                    assert.equal(e.stdout, 'Ping request could not find host google.com. Please check the name and try again.\r\n');
                }
            });
        }
        after(async () => {
            await manager.container.delete(containerName);
        });
        return;
    }
    const Image = 'busybox';
    const containerName = 'tool';
    before(async () => {
        await manager.imagePull(Image);
        const containerOptsBuilder = new ContainerOptsBuilder(Image, hang);
        containerOptsBuilder.name = containerName;
        const {opts} = containerOptsBuilder;

        await manager.containerStart(opts);

    });
    it('run', async () => {
        let [out, err] = await manager.run(Image, ['sh', '-c', 'echo message'], true);
        assert.equal(err, '');
        assert.equal(out, 'message');

        [out, err] = await manager.run(Image, ['sh', '-c', 'echo message >&2'], true);
        assert.equal(err, 'message');
        assert.equal(out, '');
    });
    if (!process.env.GITHUB_ACTIONS) {
        // GitHub runner in Azure doesn't allow ping
        it('ping', async () => {
            const result = await manager.containerExec(containerName, {Cmd: ping('google.com', 3)});
            assert.ok(result.includes('PING google.com'));
            assert.ok(result.includes('--- google.com ping statistics ---'));

        });
    }


    after(async () => {
        await manager.container.delete(containerName);
    });
});