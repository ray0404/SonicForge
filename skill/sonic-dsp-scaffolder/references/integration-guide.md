# Integration Guide

## 1. Register Descriptor
File: `src/audio/module-descriptors.ts`
Action: Add to `DESCRIPTORS` object.

```typescript
{{SCREAMING_SNAKE_CASE}}: {
    params: [
        { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 },
        // Add other params matching Processor/Node
    ]
},

```

## 2. Register Factory

File: `src/audio/core/node-factory.ts`
Action:

1. Import the Node: `import { {{PascalName}}Node } from "../worklets/{{PascalName}}Node";`
2. Add Switch Case inside `NodeFactory.create`:

```typescript
case '{{SCREAMING_SNAKE_CASE}}': node = new {{PascalName}}Node(context); break;

```
