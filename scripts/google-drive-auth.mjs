import { createServer } from 'node:http';
import { google } from 'googleapis';

const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://127.0.0.1:45678/oauth2callback';

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET first.');
  process.exit(1);
}

const redirect = new URL(redirectUri);
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', redirectUri);
  if (url.pathname !== redirect.pathname) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    response.writeHead(400);
    response.end('Missing authorization code');
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('No refresh token returned. Run the script again with prompt=consent.');
    }
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Authorization complete. You can close this tab.');
    console.log('\nGOOGLE_DRIVE_REFRESH_TOKEN=');
    console.log(tokens.refresh_token);
    console.log('\nCopy that value into .env.local. Keep it secret.');
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end('Authorization failed. Check the terminal for details.');
    console.error(error instanceof Error ? error.message : error);
  } finally {
    server.close();
  }
});

server.listen(Number(redirect.port), redirect.hostname, () => {
  console.log('Open this URL in your browser to authorize Drive access:\n');
  console.log(authUrl);
  console.log(`\nWaiting for OAuth callback at ${redirectUri}`);
});
