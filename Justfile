set export := true
VERSION := "2.3.5"
DOCKER_IMAGE := "spilikin/gemiverse"

# Display available commands
info:
	just -l

# Generate version files
version:
	@echo "export const AppVersion = \"${VERSION}\";" > src/lib/version.ts
	@echo "export const BuildDate = \"$(date +"%Y-%m-%d %H:%M")\";" >> src/lib/version.ts

# Build docker image
dockerbuild: version
	npm update
	docker buildx build --no-cache --platform linux/amd64 -t {{DOCKER_IMAGE}} .
	docker tag {{DOCKER_IMAGE}} {{DOCKER_IMAGE}}:{{VERSION}}
	docker tag {{DOCKER_IMAGE}} {{DOCKER_IMAGE}}:latest

# Push docker image to registry
dockerpush: dockerbuild
	docker push {{DOCKER_IMAGE}}:{{VERSION}}
	docker push {{DOCKER_IMAGE}}:latest

# Deploy app to VM
deploy: 
	ssh gemiverse.spilikin.dev docker-compose down --remove-orphans
	scp docker-compose-deployment.yaml gemiverse.spilikin.dev:docker-compose.yaml
	scp -r ./controller gemiverse.spilikin.dev:.
	ssh gemiverse.spilikin.dev docker-compose pull
	ssh gemiverse.spilikin.dev docker-compose build
	ssh gemiverse.spilikin.dev docker-compose up -d
