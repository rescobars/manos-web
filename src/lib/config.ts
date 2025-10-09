export const config = {
  api: {
    external: process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000',
    fastapi: process.env.FASTAPI_BASE_URL || 'http://localhost:8000',
  },
  google: {
    mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || '',
  },
  app: {
    name: 'Manos Platform',
    version: '1.0.0',
  },
};
