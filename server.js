const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'PoCo Webhook Server Running' });
});

app.post('/webhook', async (req, res) => {
  try {
    const { record } = req.body;
    
    if (!record || !record.email || !record.name) {
      return res.status(400).json({ error: 'Invalid data received' });
    }

    const { email, name } = record;

    // Send confirmation email to user
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

    // Send notification email to you (admin)
    await resend.emails.send({
      from: 'PoCo <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'your-email@example.com',
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

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
}); 