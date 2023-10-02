# Docker Desktop for linux
- https://docs.docker.com/desktop/install/linux-install/
- Docker Desktop on Linux runs a Virtual Machine (VM) so creates and uses a custom docker context `desktop-linux` on startup.
  - images and containers deployed on the Linux Docker Engine (before installation) are not available in Docker Desktop for Linux.
# Docker Desktop alternative
- Podman
- Moby: Docker Engine
  - Use [minikube](https://minikube.sigs.k8s.io/docs/tutorials/docker_desktop_replacement/) as client
  - Use [Docker Composer v2](https://docs.docker.com/compose/gettingstarted/) as client
- [Docker ToolBox](https://github.com/docker-archive/toolbox/tree/master)
  - last commit at Oct 20, 2020
  - public archived
  - Support legacy Windows

