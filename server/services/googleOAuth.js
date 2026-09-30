const { google } = require('googleapis');
const CryptoJS = require('crypto-js');
const { supabase } = require('../lib/supabase');
const env = require('../lib/env');

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/documents'
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

function encrypt(text) {
  return CryptoJS.AES.encrypt(text, env.GOOGLE_TOKEN_ENCRYPTION_KEY).toString();
}

function decrypt(encrypted) {
  const bytes = CryptoJS.AES.decrypt(encrypted, env.GOOGLE_TOKEN_ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Generate OAuth consent URL
async function startOAuth(userId) {
  const oauth2Client = getOAuth2Client();
  const stateRaw = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const stateHash = CryptoJS.SHA256(stateRaw).toString();

  // Store state for verification
  await supabase.from('oauth_states').insert({
    user_id: userId,
    provider: 'google',
    state_hash: stateHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: stateHash,
    prompt: 'consent'
  });

  return { url, state: stateHash };
}

// Handle OAuth callback
async function handleCallback(code, state) {
  // Verify state
  const { data: stateRecord } = await supabase
    .from('oauth_states')
    .select('*')
    .eq('state_hash', state)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!stateRecord) throw new Error('Invalid or expired OAuth state');

  const userId = stateRecord.user_id;
  const oauth2Client = getOAuth2Client();

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);

  // Get Google profile
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: googleProfile } = await oauth2.userinfo.get();

  // Store encrypted tokens
  const connectionData = {
    user_id: userId,
    google_email: googleProfile.email,
    refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    access_token_encrypted: tokens.access_token ? encrypt(tokens.access_token) : null,
    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    scopes: SCOPES,
    status: 'connected',
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Upsert connection
  const { error } = await supabase
    .from('google_connections')
    .upsert(connectionData, { onConflict: 'user_id' });

  if (error) throw new Error(`Failed to save connection: ${error.message}`);

  // Clean up state
  await supabase.from('oauth_states').delete().eq('id', stateRecord.id);

  // Audit log
  await supabase.from('activity_logs').insert({
    actor_type: 'user',
    actor_id: userId,
    action: 'google_connected',
    description: `Connected Google account: ${googleProfile.email}`,
    metadata: { google_email: googleProfile.email }
  });

  return { success: true, email: googleProfile.email };
}

// Get authenticated client for a user
async function getAuthenticatedClient(userId) {
  const { data: connection } = await supabase
    .from('google_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'connected')
    .single();

  if (!connection || !connection.refresh_token_encrypted) {
    throw new Error('Google account not connected. Please connect via Settings > Integrations.');
  }

  const oauth2Client = getOAuth2Client();
  const refreshToken = decrypt(connection.refresh_token_encrypted);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Check if access token is expired and refresh
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    // Update stored access token
    await supabase
      .from('google_connections')
      .update({
        access_token_encrypted: encrypt(credentials.access_token),
        expires_at: new Date(credentials.expiry_date).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } catch (err) {
    // Mark as needing reauthorization
    await supabase
      .from('google_connections')
      .update({ status: 'reauthorization_required', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    throw new Error('Google token expired. Please reconnect your Google account.');
  }

  return oauth2Client;
}

// Get connection status
async function getConnectionStatus(userId) {
  const { data: connection } = await supabase
    .from('google_connections')
    .select('google_email, scopes, status, connected_at')
    .eq('user_id', userId)
    .single();

  if (!connection) return { connected: false };

  return {
    connected: connection.status === 'connected',
    email: connection.google_email,
    scopes: connection.scopes,
    status: connection.status,
    connectedAt: connection.connected_at
  };
}

// Disconnect
async function disconnect(userId) {
  await supabase
    .from('google_connections')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  await supabase.from('activity_logs').insert({
    actor_type: 'user',
    actor_id: userId,
    action: 'google_disconnected',
    description: 'Disconnected Google Workspace'
  });

  return { success: true };
}

module.exports = { startOAuth, handleCallback, getAuthenticatedClient, getConnectionStatus, disconnect };
