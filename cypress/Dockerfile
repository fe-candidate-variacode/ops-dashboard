# syntax=docker/dockerfile:1

# The tag MUST match the `cypress` version pinned in package.json: the image
# ships the matching Cypress binary, and the build below fails fast otherwise.
ARG CYPRESS_VERSION
FROM cypress/included:${CYPRESS_VERSION}

ARG CYPRESS_VERSION
WORKDIR /e2e

# The binary already lives in the image, so skip the npm postinstall download.
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json package-lock.json ./
RUN npm ci

RUN installed="$(node -p "require('cypress/package.json').version")" \
  && if [ "$installed" != "$CYPRESS_VERSION" ]; then \
       echo "Cypress version mismatch: package.json resolves $installed but the image is $CYPRESS_VERSION" >&2; \
       exit 1; \
     fi

COPY cypress.config.ts ./
COPY cypress ./cypress

# `cypress/included` already uses `cypress run` as its entrypoint.
