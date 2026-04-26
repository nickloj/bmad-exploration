export const createTodoSchema = {
  type: 'object',
  required: ['text'],
  properties: {
    text: { type: 'string', minLength: 1, maxLength: 200 },
  },
  additionalProperties: false,
} as const;

export const updateTodoSchema = {
  type: 'object',
  required: ['completed'],
  properties: {
    completed: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

export const todoParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    },
  },
  additionalProperties: false,
} as const;
