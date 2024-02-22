VERSION=0.0.2
DOCKER_IMAGE=spilikin/gemiverse
info:

.PHONY: version dockerbuild

version:
	$(info Version: ${VERSION})
	@echo "export const AppVersion = \"$(VERSION)\";" > src/lib/version.ts
	@echo "export const BuildDate = \"$(shell date +"%Y-%m-%d %H:%M")\";" >> src/lib/version.ts

dockerbuild:
	docker buildx build --platform linux/amd64 -t $(DOCKER_IMAGE) .