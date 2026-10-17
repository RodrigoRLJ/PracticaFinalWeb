import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendVerificationEmail = async (email, code) => {
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@bildyapp.com',
        to: email,
        subject: 'Verifica tu cuenta en BildyApp',
        html: `
            <h2>Bienvenido </h2>
            <p>Tu código de verificación es:</p>
            <h1 style="letter-spacing:4px">${code}</h1>
            <p>Introduce este código en la app para activar tu cuenta.
            Si no has tratado de crear una cuenta ignora el mensaje</p>
        `,
    });
};
