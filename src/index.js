/**
 * Default export for the Cloudflare Worker.
 * This worker handles API requests for loading and saving story data.
 */
export default {
  /**
   * Handles incoming requests to the Cloudflare Worker.
   * It routes requests to either load or save story data based on the URL path and HTTP method.
   *
   * @param {Request} request - The incoming HTTP request.
   * @param {object} env - The environment variables, including the STORY_STORAGE KV namespace.
   * @param {object} ctx - The execution context of the request.
   * @returns {Response} The response to the request.
   */
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
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (err) {
        console.error(err);
        return new Response('Error: Could not load story data.', { status: 500 });
      }
    }

    // Handle the API request to save the story
    if (url.pathname === '/api/save' && request.method === 'POST') {
      try {
        const storyData = await request.json();
        await env.STORY_STORAGE.put('story.json', JSON.stringify(storyData, null, 2));
        return new Response('Story saved successfully!', { status: 200 });
      } catch (err) {
        console.error(err);
        return new Response('Error: Could not save story data.', { status: 500 });
      }
    }

    // For any other route, wrangler will automatically try to serve a static asset
    // from the './public' directory. This is a fallback for unhandled API routes.
    return new Response('Not Found', { status: 404 });
  },
};
