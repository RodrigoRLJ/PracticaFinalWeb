export const sendSlackError = async ({ method, path, message, stack, timestamp }) => {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return;

    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `*Error 500* — \`${method} ${path}\``,
            blocks: [
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `*Error 500* — \`${method} ${path}\`` },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Timestamp:*\n${timestamp}` },
                        { type: 'mrkdwn', text: `*Mensaje:*\n${message}` },
                    ],
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `\`\`\`${stack?.slice(0, 800)}\`\`\`` },
                },
            ],
        }),
    });
};
