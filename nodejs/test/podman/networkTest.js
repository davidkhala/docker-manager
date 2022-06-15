import {Podman, PodmanContainerOptsBuilder, socketPath} from "../../podman.js";

describe('podman network', function () {
	this.timeout(0)
	const podman = new Podman({socketPath})
	const Name = 'testnet' // network name
	it('create macvlan', async () => {

		const info = await podman.networkCreate({Name}, true)
		console.info(info)

	})
	it('create default', async () => {
		const info = await podman.networkCreate({Name})
		console.info(info)
	})

	it('create and attach a container', async () => {
		const info = await podman.networkCreate({Name})
		const containerName = 'busyBoxN'

		const containerOptsBuilder = new PodmanContainerOptsBuilder('busybox', ['sleep', 'infinity']);
		containerOptsBuilder.setName(containerName)
		containerOptsBuilder.setNetwork(Name)
		await podman.containerStart(containerOptsBuilder.opts)
		await podman.containerDelete(containerName)

	})
	it('duplicate network create', async () => {
		await podman.networkCreate({Name})
	})
	afterEach(async () => {
		await podman.networkRemove(Name)
	})
})