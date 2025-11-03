import fetch from 'node-fetch';

export async function handler(event, context) {
  try {
    const apiKey = process.env.MAILSLURP_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing MAILSLURP_KEY environment variable' })
      };
    }

    const response = await fetch('https://api.mailslurp.com/inboxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        inboxId: data.id,
        emailAddress: data.emailAddress
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
