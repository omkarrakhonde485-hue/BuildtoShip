const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./googleOAuth');
const { supabase } = require('../lib/supabase');

// ============================================
// GOOGLE DRIVE TOOLS
// ============================================

async function searchDriveFiles(userId, query, mimeTypes) {
  const auth = await getAuthenticatedClient(userId);
  const drive = google.drive({ version: 'v3', auth });

  let q = `name contains '${query}' and trashed = false`;
  if (mimeTypes && mimeTypes.length) {
    const mimeFilter = mimeTypes.map(m => `mimeType='${m}'`).join(' or ');
    q += ` and (${mimeFilter})`;
  }

  const { data } = await drive.files.list({
    q,
    fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size)',
    pageSize: 10,
    orderBy: 'modifiedTime desc'
  });

  await logGoogleAction(userId, 'drive', 'search', { query, results: data.files?.length });

  return { files: data.files || [], count: data.files?.length || 0 };
}

async function readDriveDocument(userId, fileId) {
  const auth = await getAuthenticatedClient(userId);
  const drive = google.drive({ version: 'v3', auth });

  // Get file metadata
  const { data: meta } = await drive.files.get({ fileId, fields: 'name, mimeType' });

  let content = '';
  if (meta.mimeType === 'application/vnd.google-apps.document') {
    const { data } = await drive.files.export({ fileId, mimeType: 'text/plain' });
    content = data;
  } else if (meta.mimeType?.startsWith('text/')) {
    const { data } = await drive.files.get({ fileId, alt: 'media' });
    content = data;
  } else {
    content = `[Unsupported file type: ${meta.mimeType}. Cannot extract text content.]`;
  }

  await logGoogleAction(userId, 'drive', 'read', { fileId, name: meta.name });

  return { name: meta.name, content: typeof content === 'string' ? content.substring(0, 5000) : JSON.stringify(content).substring(0, 5000), mimeType: meta.mimeType };
}

async function createDriveDocument(userId, title, content, folderId = null) {
  const auth = await getAuthenticatedClient(userId);
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  // Ensure NEXUS AI folder exists
  if (!folderId) {
    folderId = await ensureNexusFolder(drive);
  }

  // Create blank doc
  const { data: doc } = await docs.documents.create({
    requestBody: { title }
  });

  // Move to NEXUS folder
  if (folderId) {
    await drive.files.update({
      fileId: doc.documentId,
      addParents: folderId,
      fields: 'id, parents'
    });
  }

  // Insert content
  if (content) {
    await docs.documents.batchUpdate({
      documentId: doc.documentId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: content
          }
        }]
      }
    });
  }

  const url = `https://docs.google.com/document/d/${doc.documentId}/edit`;
  await logGoogleAction(userId, 'drive', 'create_document', { title, documentId: doc.documentId, url });

  return { documentId: doc.documentId, title, url };
}

async function ensureNexusFolder(drive) {
  // Check if NEXUS AI folder exists
  const { data } = await drive.files.list({
    q: "name='NEXUS AI' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id)',
    pageSize: 1
  });

  if (data.files?.length > 0) return data.files[0].id;

  // Create NEXUS AI folder
  const { data: folder } = await drive.files.create({
    requestBody: {
      name: 'NEXUS AI',
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id'
  });

  return folder.id;
}

// ============================================
// GOOGLE CALENDAR TOOLS
// ============================================

async function listCalendarEvents(userId, startDate, endDate) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate || new Date().toISOString(),
    timeMax: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime'
  });

  await logGoogleAction(userId, 'calendar', 'list_events', { count: data.items?.length });

  return {
    events: (data.items || []).map(e => ({
      id: e.id,
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      attendees: e.attendees?.map(a => a.email) || [],
      htmlLink: e.htmlLink,
      status: e.status
    }))
  };
}

async function createCalendarEvent(userId, eventData, workflowId = null) {
  // Idempotency check
  if (workflowId) {
    const { data: existing } = await supabase
      .from('external_actions')
      .select('external_id')
      .eq('workflow_id', workflowId)
      .eq('action_type', 'calendar_event_created')
      .eq('status', 'completed')
      .single();

    if (existing) {
      return { success: true, message: 'Calendar event already created', eventId: existing.external_id, duplicate: true };
    }
  }

  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: eventData.summary,
    description: eventData.description || '',
    start: {
      dateTime: eventData.start,
      timeZone: eventData.timezone || 'Asia/Kolkata'
    },
    end: {
      dateTime: eventData.end,
      timeZone: eventData.timezone || 'Asia/Kolkata'
    }
  };

  if (eventData.attendees?.length) {
    event.attendees = eventData.attendees.map(e => ({ email: e }));
  }

  const { data: created } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    sendNotifications: true
  });

  // Track external action
  if (workflowId) {
    await supabase.from('external_actions').insert({
      workflow_id: workflowId,
      user_id: userId,
      provider: 'google_calendar',
      action_type: 'calendar_event_created',
      idempotency_key: `calendar-${workflowId}-${eventData.summary}`,
      external_id: created.id,
      status: 'completed',
      response_metadata: { htmlLink: created.htmlLink }
    });
  }

  await logGoogleAction(userId, 'calendar', 'create_event', { eventId: created.id, summary: eventData.summary });

  return { success: true, eventId: created.id, htmlLink: created.htmlLink, summary: eventData.summary };
}

// ============================================
// GOOGLE GMAIL TOOLS
// ============================================

async function sendGmail(userId, to, subject, body, workflowId = null) {
  // Idempotency check
  const idempotencyKey = `gmail-${workflowId || 'none'}-${to}-${subject}`;
  if (workflowId) {
    const { data: existing } = await supabase
      .from('external_actions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .eq('status', 'completed')
      .single();

    if (existing) {
      return { success: true, message: 'Email already sent', duplicate: true };
    }
  }

  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  // Build RFC 2822 message
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const { data: sent } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage }
  });

  // Track external action
  await supabase.from('external_actions').insert({
    workflow_id: workflowId,
    user_id: userId,
    provider: 'google_gmail',
    action_type: 'email_sent',
    idempotency_key: idempotencyKey,
    external_id: sent.id,
    status: 'completed',
    request_metadata: { to, subject },
    response_metadata: { messageId: sent.id }
  });

  await logGoogleAction(userId, 'gmail', 'send', { to, subject, messageId: sent.id });

  return { success: true, messageId: sent.id, message: `Email sent to ${to}` };
}

// ============================================
// HELPER: Log Google actions
// ============================================
async function logGoogleAction(userId, service, action, metadata) {
  try {
    await supabase.from('activity_logs').insert({
      actor_type: 'google',
      actor_id: userId,
      action: `google_${service}_${action}`,
      description: `Google ${service}: ${action}`,
      metadata
    });
  } catch (e) { /* non-critical logging */ }
}

module.exports = {
  searchDriveFiles, readDriveDocument, createDriveDocument,
  listCalendarEvents, createCalendarEvent,
  sendGmail
};
