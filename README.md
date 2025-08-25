# Manos Web Application

A modern Next.js web application with authentication and dashboard functionality.

## Features

- Next.js 15 with App Router
- TypeScript support
- Tailwind CSS for styling
- Authentication system
- Dashboard layout
- Responsive design

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build the application for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint

## Deployment

### Deploy to Heroku

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Set the buildpack:
```bash
heroku buildpacks:set heroku/nodejs
```

3. Deploy:
```bash
git push heroku main
```

4. Open the app:
```bash
heroku open
```

## Environment Variables

Create a `.env.local` file in the root directory and add any necessary environment variables.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
