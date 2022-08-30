# fastify-openapi-docs

[![Version](https://img.shields.io/npm/v/fastify-openapi-docs.svg)](https://npm.im/fastify-openapi-docs)
[![Dependencies](https://img.shields.io/librariesio/release/npm/fastify-openapi-docs)](https://libraries.io/npm/fastify-openapi-docs)
[![Build](https://github.com/ShogunPanda/fastify-openapi-docs/workflows/CI/badge.svg)](https://github.com/ShogunPanda/fastify-openapi-docs/actions?query=workflow%3ACI)
[![Coverage](https://img.shields.io/codecov/c/gh/ShogunPanda/fastify-openapi-docs?token=RUV24SG0GL)](https://codecov.io/gh/ShogunPanda/fastify-openapi-docs)

A simple plugin for Fastify that generates OpenAPI spec automatically.

http://sw.cowtech.it/fastify-openapi-docs

## Installation

Just run:

```bash
npm install fastify-openapi-docs --save
```

## Usage

Register as a plugin as early as possible (in order to track all routes), optional providing any of the following options:

- `openapi`: The OpenAPI document header.
- `prefix`: Where to serve the OpenAPI files. The default value is `/docs/`.
- `skipUI`: If set `true`, the the OpenAPI / Swagger UI will not be served.

Routes should contain a `openapi` object inside the `config` with all desired OpenAPI annotations.

Non JSON responses can be generated by setting the `$raw` key in the response schema to the appropriate MIME type.

Empty responses can be generated by setting the `$empty` key in the response schema to `true`.

Routes can be omitted from spec by the list by setting `hide` option to `true` inside their `config`.

Once the server is started, it will serve the OpenAPI specification on both `/{prefix}/openapi.json` and `/{prefix}/openapi.yaml`.

If the UI is enabled, it will be reachable at `/${prefix}`.

## Example

```js
import fastify from 'fastify'
import fastifyOpenapiDocs from 'fastify-openapi-docs'

const server = fastify()

/*
Since fastify-openapi-docs uses an onRoute hook, you have to either:

* use `await register...`
* wrap you routes definitions in a plugin

See: https://www.fastify.io/docs/latest/Guides/Migration-Guide-V4/#synchronous-route-definitions
*/
await server.register(fastifyOpenapiDocs, {
  openapi: {
    // All these fields are optional, but they should be provided to satisfy OpenAPI specification.
    openapi: '3.0.3',
    info: {
      title: 'Title',
      description: 'Description',
      contact: {
        name: 'Shogun',
        url: 'https://cowtech.it',
        email: 'shogun@cowtech.it'
      },
      license: {
        name: 'ISC',
        url: `https://choosealicense.com/licenses/isc/`
      },
      version: '1.0.0'
    },
    servers: [
      { url: 'https://example.com', description: 'Production Server' },
      { url: 'https://dev.example.com', description: 'Development Server' }
    ],
    tags: [{ name: 'service', description: 'Service' }],
    components: {
      securitySchemes: {
        jwtBearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
})

server.addSchema({
  type: 'object',
  $id: 'request',
  description: 'The request payload',
  properties: {
    id: {
      type: 'string',
      description: 'The operation id',
      pattern: '^.+$'
    }
  },
  required: ['id'],
  additionalProperties: false
})

server.addSchema({
  type: 'object',
  $id: 'response',
  description: 'The response payload',
  properties: {
    ok: {
      type: 'boolean',
      description: 'The operation response'
    }
  },
  required: ['ok'],
  additionalProperties: false
})

server.route({
  method: 'POST',
  url: '/path',
  schema: {
    body: { $ref: 'request#' },
    response: {
      200: { $ref: 'response#' }
    }
  },
  config: {
    openapi: {
      description: 'Makes a request',
      summary: 'Main route',
      tags: ['service'],
      security: [{ jwtBearer: [] }]
    }
  },
  handler(_, reply) {
    reply.send({ ok: true })
  }
})

server.listen({ port: 3000 })
```

Once started, the following routes will be available:

- `http://localhost:3000/docs/openapi.yaml`
- `http://localhost:3000/docs/openapi.json`
- `http://localhost:3000/docs` (OpenAPI UI)

Note that `$ref` in the schemas will be resolved and replaced accordingly to OpenAPI spec.

## ESM Only

This package only supports to be directly imported in a ESM context.

For informations on how to use it in a CommonJS context, please check [this page](https://gist.github.com/ShogunPanda/fe98fd23d77cdfb918010dbc42f4504d).

## Contributing to fastify-openapi-docs

- Check out the latest master to make sure the feature hasn't been implemented or the bug hasn't been fixed yet.
- Check out the issue tracker to make sure someone already hasn't requested it and/or contributed it.
- Fork the project.
- Start a feature/bugfix branch.
- Commit and push until you are happy with your contribution.
- Make sure to add tests for it. This is important so I don't break it in a future version unintentionally.

## Copyright

Copyright (C) 2021 and above Shogun (shogun@cowtech.it).

Licensed under the ISC license, which can be found at https://choosealicense.com/licenses/isc.
