import fetch from 'node-fetch';

export async function handler(event, context) {
  try {
    const apiKey = process.env.MAILSLURP_KEY;
    const { emailId } = JSON.parse(event.body || '{}');

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing MAILSLURP_KEY environment variable' })
      };
    }

    if (!emailId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing emailId field' })
      };
    }

    const response = await fetch(`https://api.mailslurp.com/emails/${emailId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ read: true })
    });

    if (!response.ok) {
      throw new Error(`MailSlurp API returned ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email marked as read successfully',
        data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
