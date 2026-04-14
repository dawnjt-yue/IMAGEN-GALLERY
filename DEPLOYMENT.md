# Vision Studio - Deployment Guide

This application is ready to be deployed to **GitHub Pages**.

## Deployment Steps

### 1. GitHub Actions (Recommended)
The project includes a `.github/workflows/deploy.yml` file. To deploy:
1. Push your code to a GitHub repository.
2. Go to your repository **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The application will automatically build and deploy whenever you push to the `main` branch.

### 2. Manual Configuration
If you are not using the provided GitHub Action:
1. Ensure `base: './'` is set in `vite.config.ts` (already configured).
2. Run `npm run build`.
3. Upload the contents of the `dist` folder to your hosting provider.

## API Key Security
**Important:** This application stores your API Key in the browser's `localStorage`. While convenient for a personal tool, be aware that anyone with access to your browser can see the key. Never share your deployed URL publicly if it contains sensitive configurations.
