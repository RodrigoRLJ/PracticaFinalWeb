import { sendSlackError } from './src/services/slack.service.js';
import { sendVerificationEmail } from './src/services/email.service.js';
import { uploadSignatureImage } from './src/services/storage.service.js';
// Test imagen minima (PNG 1x1 pixel en buffer)
const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

async function run() {
    console.log('\n--- SLACK ---');
    try {
        await sendSlackError({
            method: 'GET',
            path: '/test',
            message: 'Test de integración Slack',
            stack: 'Error: test\n  at run (test-integrations.js:1:1)',
            timestamp: new Date().toISOString(),
        });
        console.log('OK - mensaje enviado al canal');
    } catch (err) {
        console.error('FAIL -', err.message);
    }

    console.log('\n--- SMTP ---');
    try {
        await sendVerificationEmail('test@example.com', '123456');
        console.log('OK - email enviado (revisar Mailtrap inbox)');
    } catch (err) {
        console.error('FAIL -', err.message);
    }

    console.log('\n--- CLOUDINARY ---');
    try {
        const url = await uploadSignatureImage(pngBuffer);
        console.log('OK - URL:', url);
    } catch (err) {
        console.error('FAIL -', err.message);
    }
}

run();
