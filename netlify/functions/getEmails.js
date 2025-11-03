import fetch from 'node-fetch';

export async function handler(event, context) {
  try {
    const apiKey = process.env.MAILSLURP_KEY;
    const { inboxId } = event.queryStringParameters;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing MAILSLURP_KEY environment variable' })
      };
    }

    if (!inboxId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing inboxId query parameter' })
      };
    }

    const response = await fetch(`https://api.mailslurp.com/inboxes/${inboxId}/emails`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
