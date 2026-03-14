export const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.apiKey',
  'req.body.password',
  'req.body.token',
  'res.body.token',
  'res.body.accessToken',
  'res.body.refreshToken',
];

export const redactCensor = '[REDACTED]';
