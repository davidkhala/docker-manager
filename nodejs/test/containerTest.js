import assert from 'assert';
import {consoleLogger} from '@davidkhala/logger/log4.js';
import {ContainerManager, ContainerOptsBuilder} from '../docker.js';
import {hang, ping} from '../cmd.js';
import os from 'os';
import {sleep} from "@davidkhala/light";


const logger = consoleLogger('test:docker');
const manager = new ContainerManager(undefined, logger);

/**
 * Register `containerSolidify` tests against an already running container
 * @param {string} containerName
 */
const solidify = (containerName) => describe('solidify', function () {
    const repo = 'docker-manager-solidify-test';
    const imageName = `${repo}:latest`;
    afterEach(async () => {
        await manager.image.delete(imageName);
        await manager.image.delete(`${repo}:v1`);
    });
    it('defaults', async () => {
        const {Id} = await manager.containerSolidify({container_name: containerName, repo});
        assert.ok(Id.startsWith('sha256:'));
        const {RepoTags, Author} = await manager.client.getImage(imageName).inspect();
        assert.deepEqual(RepoTags, [imageName]);
        assert.equal(Author, 'David Liu <david-khala@hotmail.com>');
    });
    it('override author, with comment and changes', async () => {
        const author = 'Tester <tester@example.com>';
        const comment = 'solidify test';
        await manager.containerSolidify({
            container_name: containerName, repo, tag: 'v1', author, comment, changes: 'ENV SOLIDIFY=1'
        });
        const {RepoTags, Author, Comment, Config} = await manager.client.getImage(`${repo}:v1`).inspect();
        assert.deepEqual(RepoTags, [`${repo}:v1`]);
        assert.equal(Author, author);
        assert.equal(Comment, comment);
        assert.ok(Config.Env.includes('SOLIDIFY=1'));
    });
});

if (os.platform() === 'win32') {
    describe('nanoserver', function () {
        this.timeout(5 * 60 * 1000); // fail instead of hanging forever
        const Image = 'mcr.microsoft.com/windows/nanoserver:ltsc2025'; // align to windows-latest runner (Aug 2026)
        const containerName = 'tool';
        before(async () => {
            await manager.imagePull(Image);
            // nanoserver has no `sleep`; use a looping ping to keep the container alive
            const containerOptsBuilder = new ContainerOptsBuilder(Image, ['ping', '-t', 'localhost']);
            containerOptsBuilder.name = containerName;
            const {opts} = containerOptsBuilder;
            await manager.containerStart(opts);
        });
        it('run', async () => {
            // Use containerExec instead of manager.run() — on Windows named pipe,
            const out = await manager.containerExec(containerName, {Cmd: ['cmd', '/S', '/C', 'echo message']});
            assert.equal(out.trim(), 'message');
        });
        if (!process.env.GITHUB_ACTIONS) {
            // GitHub runner in Azure doesn't allow ping
            it('ping-dns', async () => {
                const out = await manager.containerExec(containerName, {Cmd: ['ping', '-n', '3', 'google.com']});
                console.log(out)
            });
        }
        solidify(containerName);
        after(async () => {
            await manager.container.delete(containerName);
        });
    })
} else {
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
        solidify(containerName);
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
}




