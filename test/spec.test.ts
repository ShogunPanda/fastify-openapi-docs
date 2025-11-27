import type { FastifyReply, FastifyRequest } from 'fastify'
import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'
import fastify from 'fastify'
import { plugin as fastifyOpenApiDocs } from '../src/index.ts'

const openapi = {
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
      url: 'https://choosealicense.com/licenses/isc/'
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

test('Spec generation', async () => {
  await test('should correctly generate a OpenAPI spec in JSON and YAML format', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, { openapi })

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
        headers: {
          type: 'object',
          properties: {
            why: { description: 'The reason' }
          },
          required: ['x-app-id']
        },
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
          operationId: 'create-request'
        }
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: yamlSpec } = await server.inject('/docs/openapi.yaml')
    const { body: jsonSpec } = await server.inject('/docs/openapi.json')

    deepStrictEqual(
      yamlSpec,
      `openapi: 3.0.3
info:
  title: Title
  description: Description
  contact:
    name: Shogun
    url: https://cowtech.it
    email: shogun@cowtech.it
  license:
    name: ISC
    url: https://choosealicense.com/licenses/isc/
  version: 1.0.0
servers:
  - url: https://example.com
    description: Production Server
  - url: https://dev.example.com
    description: Development Server
tags:
  - name: service
    description: Service
components:
  securitySchemes:
    jwtBearer:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    request:
      type: object
      description: The request payload
      properties:
        id:
          type: string
          description: The operation id
          pattern: ^.+$
      required:
        - id
      additionalProperties: false
    response:
      type: object
      description: The response payload
      properties:
        ok:
          type: boolean
          description: The operation response
      required:
        - ok
      additionalProperties: false
paths:
  /path:
    post:
      summary: Main route
      description: Makes a request
      operationId: create-request
      tags:
        - service
      parameters:
        - name: why
          in: header
          description: The reason
          schema:
            type: string
          required: false
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response'
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/request'
`
    )

    deepStrictEqual(JSON.parse(jsonSpec), {
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
          url: 'https://choosealicense.com/licenses/isc/'
        },
        version: '1.0.0'
      },
      servers: [
        {
          url: 'https://example.com',
          description: 'Production Server'
        },
        {
          url: 'https://dev.example.com',
          description: 'Development Server'
        }
      ],
      tags: [
        {
          name: 'service',
          description: 'Service'
        }
      ],
      components: {
        securitySchemes: {
          jwtBearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          request: {
            type: 'object',
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
          },
          response: {
            type: 'object',
            description: 'The response payload',
            properties: {
              ok: {
                type: 'boolean',
                description: 'The operation response'
              }
            },
            required: ['ok'],
            additionalProperties: false
          }
        }
      },
      paths: {
        '/path': {
          post: {
            summary: 'Main route',
            description: 'Makes a request',
            tags: ['service'],
            operationId: 'create-request',
            parameters: [
              {
                name: 'why',
                in: 'header',
                description: 'The reason',
                required: false,
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/response' }
                  }
                }
              }
            },
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/request'
                  }
                }
              }
            }
          }
        }
      }
    })
  })

  await test('should accept routes with no OpenAPI annotations and hide routes', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {
      prefix: 'another',
      openapi: {
        components: {
          schemas: {}
        },
        paths: {}
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
      method: ['POST'],
      url: '/path/:id',
      schema: {
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            }
          },
          required: ['id']
        },
        body: { $ref: 'request#' },
        response: {
          200: { $ref: 'response#' }
        }
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    server.route({
      method: 'POST',
      url: '/another',
      config: {
        hide: true
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: jsonSpec } = await server.inject('/another/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: {
        schemas: {
          request: {
            type: 'object',
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
          },
          response: {
            type: 'object',
            description: 'The response payload',
            properties: {
              ok: {
                type: 'boolean',
                description: 'The operation response'
              }
            },
            required: ['ok'],
            additionalProperties: false
          }
        }
      },
      paths: {
        '/path/{id}': {
          post: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/response'
                    }
                  }
                }
              }
            },
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/request'
                  }
                }
              }
            }
          }
        }
      }
    })
  })

  await test('should accept routes with no schema', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {})

    server.route({
      method: 'GET',
      url: '/path',
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    server.route({
      method: 'POST',
      url: '/path',
      schema: {},
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: jsonSpec } = await server.inject('/docs/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: {
        schemas: {}
      },
      paths: {
        '/path': {
          get: {},
          head: {},
          post: {}
        }
      }
    })
  })

  await test('should accept routes and hide HEAD routes', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {
      prefix: 'another',
      openapi: {
        components: {
          schemas: {}
        },
        paths: {}
      }
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
      method: 'GET',
      url: '/path/:id',
      schema: {
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            }
          },
          required: ['id']
        },
        response: {
          200: { $ref: 'response#' }
        }
      },
      config: {
        hideHead: true
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: jsonSpec } = await server.inject('/another/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: {
        schemas: {
          response: {
            type: 'object',
            description: 'The response payload',
            properties: {
              ok: {
                type: 'boolean',
                description: 'The operation response'
              }
            },
            required: ['ok'],
            additionalProperties: false
          }
        }
      },
      paths: {
        '/path/{id}': {
          get: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/response'
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  })

  await test('should resolve $ref in params', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {})

    server.addSchema({
      type: 'object',
      $id: 'params'
    })

    server.route({
      method: 'GET',
      url: '/path',
      schema: {
        params: {
          $ref: 'params#'
        }
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: jsonSpec } = await server.inject('/docs/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: {
        schemas: {
          params: {
            type: 'object'
          }
        }
      },
      paths: {
        '/path': {
          get: {},
          head: {}
        }
      }
    })
  })

  await test('should recognize $raw and $empty', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {})

    server.route({
      method: 'GET',
      url: '/path',
      schema: {
        response: {
          200: {
            type: 'object',
            $raw: 'text/yaml'
          },
          204: {
            type: 'object',
            $empty: true
          }
        }
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.code(204)
        reply.send('')
      }
    })

    const { body: jsonSpec } = await server.inject('/docs/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: {
        schemas: {}
      },
      paths: {
        '/path': {
          get: {
            responses: {
              200: {
                content: {
                  'text/yaml': {}
                }
              },
              204: {}
            }
          },
          head: {
            responses: {
              200: {
                content: {
                  'text/yaml': {}
                }
              },
              204: {}
            }
          }
        }
      }
    })
  })

  await test('should replace multiple types with anyOf', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {})

    server.route({
      method: 'GET',
      url: '/path',
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              ok: {
                type: ['boolean', 'null']
              }
            }
          }
        }
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: jsonSpec } = await server.inject('/docs/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: { schemas: {} },
      paths: {
        '/path': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        ok: {
                          anyOf: [{ type: 'null' }, { type: 'boolean' }]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          head: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        ok: {
                          anyOf: [{ type: 'null' }, { type: 'boolean' }]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  })

  await test('should accept routes with non JSON request body', async () => {
    const server = fastify()

    await server.register(fastifyOpenApiDocs, {
      prefix: 'another',
      openapi: {
        components: {
          schemas: {}
        },
        paths: {}
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
      method: ['POST'],
      url: '/path/:id',
      schema: {
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            }
          },
          required: ['id']
        },
        body: { $ref: 'request#' },
        response: {
          200: { $ref: 'response#' }
        }
      },
      config: {
        bodyMime: 'multipart/form-data'
      },
      handler(_: FastifyRequest, reply: FastifyReply): void {
        reply.send({ ok: true })
      }
    })

    const { body: jsonSpec } = await server.inject('/another/openapi.json')

    deepStrictEqual(JSON.parse(jsonSpec), {
      components: {
        schemas: {
          request: {
            type: 'object',
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
          },
          response: {
            type: 'object',
            description: 'The response payload',
            properties: {
              ok: {
                type: 'boolean',
                description: 'The operation response'
              }
            },
            required: ['ok'],
            additionalProperties: false
          }
        }
      },
      paths: {
        '/path/{id}': {
          post: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/response'
                    }
                  }
                }
              }
            },
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: {
                    $ref: '#/components/schemas/request'
                  }
                }
              }
            }
          }
        }
      }
    })
  })
})
