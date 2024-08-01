VERSION=2.0.0-beta5
DOCKER_IMAGE=spilikin/gemiverse:latest
info:

.PHONY: version dockerbuild

version:
	$(info Version: ${VERSION})
	@echo "export const AppVersion = \"$(VERSION)\";" > src/lib/version.ts
	@echo "export const BuildDate = \"$(shell date +"%Y-%m-%d %H:%M")\";" >> src/lib/version.ts

dockerbuild: version
	npm update
	docker buildx build --no-cache --platform linux/amd64 -t $(DOCKER_IMAGE) .

dockerpush: dockerbuild
	docker push $(DOCKER_IMAGE)

deploy: 
	scp docker-compose-deployment.yaml gemiverse.spilikin.dev:docker-compose.yaml
	scp -r ./controller gemiverse.spilikin.dev:.
	ssh gemiverse.spilikin.dev docker-compose pull
	ssh gemiverse.spilikin.dev docker-compose build
	ssh gemiverse.spilikin.dev docker-compose down --remove-orphans
	ssh gemiverse.spilikin.dev docker-compose up -d
