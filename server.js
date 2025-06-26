const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();

// Initialize Resend with error handling
let resend;
try {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Warning: RESEND_API_KEY not found. Email functionality will be disabled.');
  } else {
    resend = new Resend(apiKey);
    console.log('Resend initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'PoCo Webhook Server Running',
    emailEnabled: !!resend,
    adminEmail: process.env.ADMIN_EMAIL || 'Not configured'
  });
});

app.post('/webhook', async (req, res) => {
  try {
    const { record } = req.body;
    
    if (!record || !record.email || !record.name) {
      return res.status(400).json({ error: 'Invalid data received' });
    }

    const { email, name } = record;
    
    console.log(`Received webhook: ${name} (${email})`);

    // Only send emails if Resend is properly initialized
    if (resend) {
      try {
        // Send confirmation email to user
        console.log('Sending confirmation email to user...');
        await resend.emails.send({
          from: 'PoCo <onboarding@resend.dev>',
          to: email,
          subject: 'Welcome to PoCo! You\'re on the waitlist',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Welcome to PoCo, ${name}! 🎉</h2>
              <p>Thank you for joining our exclusive waitlist for PoCo - your personal AI companion designed specifically for seniors.</p>
              
              <h3 style="color: #059669;">What happens next?</h3>
              <ul>
                <li>We'll notify you as soon as PoCo is ready for early access</li>
                <li>You'll be among the first to experience our AI companion</li>
                <li>We'll keep you updated on our progress and features</li>
              </ul>
              
              <p>In the meantime, feel free to explore our website to learn more about what PoCo can do for you.</p>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                The PoCo Team
              </p>
            </div>
          `
        });
        console.log('Confirmation email sent successfully');

        // Send notification email to admin
        if (process.env.ADMIN_EMAIL) {
          console.log('Sending notification email to admin...');
          await resend.emails.send({
            from: 'PoCo <onboarding@resend.dev>',
            to: process.env.ADMIN_EMAIL,
            subject: 'New PoCo Waitlist Signup',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">New Waitlist Signup! 🎉</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Signed up:</strong> ${new Date().toLocaleString()}</p>
              </div>
            `
          });
          console.log('Admin notification email sent successfully');
        } else {
          console.log('No ADMIN_EMAIL configured, skipping admin notification');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the webhook if email fails
      }
    } else {
      console.log('Email functionality disabled - Resend not initialized');
    }

    res.json({ 
      success: true, 
      emailSent: !!resend,
      message: resend ? 'Signup successful and emails sent' : 'Signup successful (emails disabled)'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Environment check:`);
  console.log(`- RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`- ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'Not set'}`);
}); 