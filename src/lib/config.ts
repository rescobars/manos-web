export const config = {
  api: {
    external: process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000',
    fastapi: process.env.FASTAPI_BASE_URL || 'http://localhost:8000',
  },
  google: {
    mapsApiKey: 'AIzaSyClvIum6qxkhDZeUsGtNHYQP8VZioOgtAE',
  },
  app: {
    name: 'Manos Platform',
    version: '1.0.0',
  },
};
