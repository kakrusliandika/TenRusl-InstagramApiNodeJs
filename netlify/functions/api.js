import serverless from 'serverless-http';
import app from '../../src/app.js';

// Adaptor preview Netlify. Waktu jalan lokal memakai src/server.js; root netlify.toml mengarahkan lalu lintas ke sini.
export const handler = serverless(app);
