import { build } from 'vite';

try {
  await build();
  // The app currently leaves a Vite/esbuild child handle open after a successful
  // production build. Force a clean exit only after Vite resolves the build so
  // CI/CD can continue to deployment instead of hanging indefinitely.
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
