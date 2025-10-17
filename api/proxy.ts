
// This file acts as a secure backend proxy.
// In a Vercel project, creating a file inside the `/api` directory
// automatically turns it into a serverless function (an API endpoint).

// How to use this:
// 1. Get your API key from Limitless.
// 2. Create an Environment Variable in your Vercel project settings:
//    - Name: LIMITLESS_API_KEY
//    - Value: Your actual API key
// 3. Deploy your project. Your app will now fetch real data.

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({ error: 'walletAddress is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.LIMITLESS_API_KEY;

  if (!apiKey) {
    // This error will be shown if you forget to set the environment variable.
    return new Response(JSON.stringify({ error: 'API key is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // UPDATED: Using the /api-v1/ path as suggested.
  const LIMITLESS_API_ENDPOINT = `https://api.limitless.exchange/api-v1/portfolio/trades?trader=${walletAddress}`;

  try {
    const apiResponse = await fetch(LIMITLESS_API_ENDPOINT, {
      headers: {
        'Accept': 'application/json',
        // The API key is securely sent from our backend proxy.
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Limitless API error:', errorText);
      return new Response(JSON.stringify({ error: `Failed to fetch data from Limitless API. Status: ${apiResponse.status}` }), {
        status: apiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await apiResponse.json();

    // Send the data back to the frontend.
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Add CORS headers to allow our frontend to call this proxy
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });

  } catch (error) {
    console.error('Error in proxy function:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
