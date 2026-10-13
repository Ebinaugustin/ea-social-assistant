'use strict';
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.META_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const API_VERSION = (process.env.META_GRAPH_API_VERSION || 'v23.0').replace(/^\/+|\/+$/g, '');
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;

app.disable('x-powered-by');
app.use(express.static(__dirname));
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(TOKEN && IG_USER_ID), message: TOKEN && IG_USER_ID ? 'API credentials are configured.' : 'Meta API credentials have not been configured.' });
});

app.get('/api/search', async (req, res) => {
  const tag = String(req.query.hashtag || '').trim().replace(/^#/, '').toLowerCase();
  if (!/^[a-zA-Z0-9._]{1,100}$/.test(tag)) {
    return res.status(400).json({ error: 'Enter a valid hashtag without spaces or the # symbol.' });
  }
  if (!TOKEN || !IG_USER_ID) {
    return res.status(503).json({ error: 'Instagram API is not configured yet. The server needs META_ACCESS_TOKEN and IG_USER_ID in its private environment variables.' });
  }
  try {
    const findUrl = new URL(`${GRAPH}/${encodeURIComponent(IG_USER_ID)}/ig_hashtag_search`);
    findUrl.search = new URLSearchParams({ user_id: IG_USER_ID, q: tag, access_token: TOKEN });
    const findResponse = await fetch(findUrl);
    const findData = await findResponse.json();
    if (!findResponse.ok || findData.error) {
      console.error('Meta hashtag lookup failed:', findData.error?.type || findResponse.status, findData.error?.code || '');
      return res.status(502).json({ error: 'Meta could not search this hashtag. Check API permissions, token validity, and Instagram account setup in Render logs.' });
    }
    const hashtagId = findData.data?.[0]?.id;
    if (!hashtagId) return res.json({ posts: [], message: 'No hashtag ID was returned by Meta.' });

    const mediaUrl = new URL(`${GRAPH}/${encodeURIComponent(hashtagId)}/recent_media`);
    mediaUrl.search = new URLSearchParams({ user_id: IG_USER_ID, fields: 'id,caption,media_type,media_url,permalink,timestamp,username', limit: '25', access_token: TOKEN });
    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();
    if (!mediaResponse.ok || mediaData.error) {
      console.error('Meta media lookup failed:', mediaData.error?.type || mediaResponse.status, mediaData.error?.code || '');
      return res.status(502).json({ error: 'Meta found the hashtag but could not return posts. Check Public Content Access, permissions, and API limits.' });
    }
    const posts = (mediaData.data || []).map(item => ({
      id: item.id,
      username: item.username || 'Instagram creator',
      caption: item.caption || '',
      media_url: item.media_url || '',
      permalink: item.permalink || '',
      timestamp: item.timestamp || '',
      media_type: item.media_type || ''
    }));
    return res.json({ posts });
  } catch (err) {
    console.error('Search request failed:', err.message);
    return res.status(500).json({ error: 'The server could not complete the search. Check the Render service logs.' });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`EA Social Assistant listening on port ${PORT}`));
