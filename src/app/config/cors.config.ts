export function createCorsConfig(allowedOrigins?: string[]) {
  return {
    origin: allowedOrigins ?? [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'Link', 'Location'],
    credentials: true,
    maxAge: 3600,
  };
}
