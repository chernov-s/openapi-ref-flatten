# OpenAPI Ref Flatten

Resolve $ref values in JSON Schema, OpenAPI (Swagger),
and any other objects with $ref values inside them.

### Project status: `draft`

## TODOs

- [x] resolve $ref;
- [ ] add README;
- [ ] make the code more elegant;
- [ ] add tests;
- [ ] add yaml reader;
- [ ] (???) support `--dereference` flag;

## Installation

Supported in modern browsers and node.

```bash
npm i openapi-ref-flatten
```

## Example

For the convenience of examples, I will use YAML-files (see TODOs). Currently only JSON is supported.

### Input

For example, we have the following project structure:
```
super-project/
    |--- api/
          |--- example.yml
    |--- models/
          |--- pet-model.yml
          |--- kind-model.yml
  
```

The files contain the following:
```yaml
# file: super-project/api/example.yml
pet1:
  $ref: ../models/pet-model.yml#/components/schemas/Pet
pet2:
  $ref: ../models/pet-model.yml#/components/schemas/Pet
kind1:
  $ref: ../models/kind-model.yml#/components/schemas/Kind
```
```yaml
# file: super-project/models/pet-model.yml
components:
  schemas:
    Pet:
      type: object
      properties:
        name:
          type: string
        kind:
          $ref: ./kind-model.yml#/components/schemas/Kind
```
```yaml
# file: super-project/models/kind-model.yml
components:
  schemas:
    Kind:
      type: object
      properties:
        name:
          type: string
```
### Output

Run command:

```bash
node cli.js --input ./super-project/api/example.yml --output ./dist/result.yml
```

```yaml
# file: dist/result.yml
pet1:
  $ref: #/components/schemas/Pet
pet2:
  $ref: #/components/schemas/Pet
kind1:
  $ref: #/components/schemas/Kind

components:
  schemas:
    Pet:
      type: object
      properties:
        name:
          type: string
        kind:
          $ref: #/components/schemas/Kind
    Kind:
      type: object
      properties:
        name:
          type: string
```

## Classic dereference

#### In a simple dereference, we will have the following output:

`node cli.js --input ./super-project/api/example.yml --output ./dist/result.yml --derefence`

The `--derefence` flag is not supported now.

```yaml
pet1:
  type: object
  properties:
    name:
      type: string
    kind:
      type: object
      properties:
        name:
          type: string
pet2:
  type: object
  properties:
    name:
      type: string
    kind:
      type: object
      properties:
        name:
          type: string
kind1:
  type: object
  properties:
    name:
      type: string
```
