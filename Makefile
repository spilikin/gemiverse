VERSION=0.0.8
DOCKER_IMAGE=spilikin/gemiverse:latest
info:

.PHONY: version dockerbuild

version:
	$(info Version: ${VERSION})
	@echo "export const AppVersion = \"$(VERSION)\";" > src/lib/version.ts
	@echo "export const BuildDate = \"$(shell date +"%Y-%m-%d %H:%M")\";" >> src/lib/version.ts

dockerbuild: version
	docker buildx build --no-cache --platform linux/amd64 -t $(DOCKER_IMAGE) .

dockerpush: dockerbuild
	docker push $(DOCKER_IMAGE)

deploy: 
	scp docker-compose.yaml gemiverse.spilikin.dev:.
	ssh gemiverse.spilikin.dev docker-compose pull
	ssh gemiverse.spilikin.dev docker-compose down
	ssh gemiverse.spilikin.dev docker-compose up -d
