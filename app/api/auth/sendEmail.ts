import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function sendEmail(to: string, subject: string, text: string) {
    console.log('📧 Attempting to send email...');
    console.log('📧 To:', to);
    console.log('📧 From:', process.env.SENDGRID_FROM_EMAIL);
    console.log('📧 Subject:', subject);
    console.log('📧 Message:', text);

    try {
        await sgMail.send({
            to,
            from: process.env.SENDGRID_FROM_EMAIL as string,
            subject,
            text,
        });
        console.log('✅ Email sent successfully');
    } catch (error: any) {
        console.error('🚨 Error sending email:', error.response?.body || error);
    }
}
