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
    id: { type: 'string', minLength: 1, maxLength: 36 },
  },
  additionalProperties: false,
} as const;
