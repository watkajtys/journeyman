export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle the API request to load the story
    if (url.pathname === '/api/load' && request.method === 'GET') {
      try {
        const storyObject = await env.STORY_STORAGE.get('story.json');

        if (storyObject === null) {
          return new Response(JSON.stringify({ status: 'not_found', message: 'No saved story found in cloud storage.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 404,
          });
        }

        // The object has a .text() method to get the body as a string.
        const storyData = await storyObject.text();
        return new Response(storyData, {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 200,
        });

      } catch (err) {
        console.error(err);
        return new Response('Error: Could not load story data.', { status: 500 });
      }
    }
    
    // Handle image upload
    if (url.pathname.startsWith('/api/images/') && request.method === 'PUT') {
      try {
        const nodeId = decodeURIComponent(url.pathname.split('/').pop());
        const imageData = await request.arrayBuffer();
        
        // Validate image size (max 10MB)
        if (imageData.byteLength > 10 * 1024 * 1024) {
          return new Response('Image too large (max 10MB)', { 
            status: 413,
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Store image in R2 with sanitized path
        const imagePath = `images/${encodeURIComponent(nodeId)}.png`;
        await env.STORY_STORAGE.put(imagePath, imageData, {
          httpMetadata: {
            contentType: 'image/png',
          }
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          path: imagePath 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        console.error('Image upload error:', err);
        return new Response(JSON.stringify({ 
          error: 'Upload failed', 
          message: err.message 
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Handle image retrieval
    if (url.pathname.startsWith('/api/images/') && request.method === 'GET') {
      try {
        const nodeId = decodeURIComponent(url.pathname.split('/').pop());
        const imagePath = `images/${encodeURIComponent(nodeId)}.png`;
        const imageObject = await env.STORY_STORAGE.get(imagePath);
        
        if (!imageObject) {
          return new Response('Image not found', { 
            status: 404,
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        const imageData = await imageObject.arrayBuffer();
        return new Response(imageData, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        console.error('Image retrieval error:', err);
        return new Response('Error retrieving image', { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Handle the API request to save the story
    if (url.pathname === '/api/save' && request.method === 'POST') {
      try {
        const storyData = await request.json();
        await env.STORY_STORAGE.put('story.json', JSON.stringify(storyData, null, 2));
        return new Response('Story saved successfully!', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        console.error('Save error:', err);
        return new Response('Error: Could not save story data.', { status: 500 });
      }
    }
    
    // Handle OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // For any other route, return a 404 response
    // The assets will be served automatically by the assets configuration
    return new Response('Not Found', { status: 404 });
  },
};
