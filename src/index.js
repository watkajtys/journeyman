// Generate a secure random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store active admin sessions (in production, use KV or Durable Objects)
const adminSessions = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Verify admin token helper
    const verifyAdminToken = (token) => {
      if (!token) return false;
      // Also check against env secret for backwards compatibility
      if (token === env.ADMIN_KEY) return true;
      const session = adminSessions.get(token);
      if (!session) return false;
      if (session.expiresAt < Date.now()) {
        adminSessions.delete(token);
        return false;
      }
      return true;
    };

    // Handle admin authentication endpoint
    if (url.pathname === '/api/admin/auth' && request.method === 'POST') {
      try {
        const { accessCode } = await request.json();
        
        // Check against secure environment variable
        if (accessCode === env.ADMIN_ACCESS_CODE) {
          const token = generateToken();
          const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
          
          // Store session
          adminSessions.set(token, { expiresAt });
          
          // Clean up expired sessions
          for (const [key, value] of adminSessions.entries()) {
            if (value.expiresAt < Date.now()) {
              adminSessions.delete(key);
            }
          }
          
          return new Response(JSON.stringify({ 
            success: true, 
            token,
            expiresAt 
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid access code' 
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Authentication failed' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Block direct access to /editor/ unless admin token is valid
    if (url.pathname.startsWith('/editor/') || url.pathname === '/editor') {
      const token = request.headers.get('X-Admin-Token') || 
                    url.searchParams.get('token') ||
                    url.searchParams.get('phoenixadmin'); // Legacy support
      
      // Check token or legacy access code
      const isValid = verifyAdminToken(token) || 
                      (url.searchParams.get('phoenixadmin') === env.ADMIN_ACCESS_CODE);
      
      if (!isValid) {
        // Redirect to main page instead of showing editor
        return Response.redirect(new URL('/', url.origin).toString(), 302);
      }
    }

    // Handle image generation requests (admin only)
    if (url.pathname === '/api/generate-image' && request.method === 'POST') {
      try {
        // Check for admin authorization using secure token
        const token = request.headers.get('X-Admin-Token') || request.headers.get('X-Admin-Key');
        if (!verifyAdminToken(token)) {
          return new Response(JSON.stringify({ 
            error: 'Image generation not available',
            message: 'This is the end of the currently rendered narrative. More content coming soon!'
          }), { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // Admin is authorized, proceed with generation
        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ error: 'API key not configured' }), { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const requestData = await request.json();
        const { prompt, contextImage } = requestData;

        // Build the API request to Gemini
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
        
        const parts = [{
          text: prompt
        }];
        
        if (contextImage) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: contextImage
            }
          });
        }

        const response = await fetch(`${apiUrl}?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: parts
            }],
            generationConfig: {
              temperature: 0.9,
              topK: 32,
              topP: 1,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  image: {
                    type: "string"
                  }
                }
              }
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error:', errorText);
          return new Response(JSON.stringify({ error: 'Generation failed' }), { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      } catch (err) {
        console.error('Image generation error:', err);
        return new Response(JSON.stringify({ 
          error: 'Generation failed', 
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
    
    // Handle image upload (protected)
    if (url.pathname.startsWith('/api/images/') && request.method === 'PUT') {
      try {
        // Check for admin authorization
        const token = request.headers.get('X-Admin-Token') || request.headers.get('X-Admin-Key');
        if (!verifyAdminToken(token)) {
          return new Response('Unauthorized', { 
            status: 403,
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        }
        
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

    // Handle the API request to save the story (admin only)
    if (url.pathname === '/api/save' && request.method === 'POST') {
      try {
        // Check for admin authorization using secure token
        const token = request.headers.get('X-Admin-Token') || request.headers.get('X-Admin-Key');
        if (!verifyAdminToken(token)) {
          return new Response('Unauthorized', { 
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
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
          'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Admin-Key'
        }
      });
    }

    // For any other route, return a 404 response
    // The assets will be served automatically by the assets configuration
    return new Response('Not Found', { status: 404 });
  },
};
