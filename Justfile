# Helper recipes for snapify development.

set shell := ["/bin/bash", "-cu"]

install:
	npm install

build:
	npm run build

test:
	npm test

release-dry-run:
	npx semantic-release --dry-run

changelog:
	git cliff -c cliff.toml --output CHANGELOG.md
