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

    const { inboxId, to, subject, body } = JSON.parse(event.body || '{}');

    if (!inboxId || !to || !subject || !body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing one or more required fields: inboxId, to, subject, body'
        })
      };
    }

    const response = await fetch(`https://api.mailslurp.com/inboxes/${inboxId}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        to: [to],
        subject,
        body
      })
    });

    if (!response.ok) {
      throw new Error(`MailSlurp API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Reply sent successfully',
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
