import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

export default async function sendEmail(to: string, subject: string, resetLink: string) {
    console.log('📧 Attempting to send email to:', to)

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Set Your Password</h2>
            <p>Hello,</p>
            <p>An account has been created for you. To secure your account, please set your password using the link below:</p>
            
            <p style="word-wrap: break-word; background: #f4f4f4; padding: 10px; border-radius: 5px;">
                <a href="${resetLink}" style="color: #007BFF; text-decoration: none;">${resetLink}</a>
            </p>

            <p>This link will expire in <strong>1 hour</strong> for security reasons.</p>

            <p>If you did not request this, please ignore this email.</p>

            <p>Best Regards,</p>
            <p><strong>GTI</strong></p>
        </div>
    `;

    try {
        await sgMail.send({
            to,
            from: process.env.SENDGRID_FROM_EMAIL as string, // Your verified SendGrid sender email
            subject,
            html: emailContent,
        })
        console.log('✅ Email sent successfully')
    } catch (error: any) {
        console.error('🚨 Error sending email:', error.response?.body || error)
    }
}
