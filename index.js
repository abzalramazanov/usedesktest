require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN || 'yourcompany';

// Health check
app.get('/', (req, res) => {
  res.send('UseDesk AI Bot is running');
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { ticket_id, message } = req.body;
    console.log(`New request for ticket: ${ticket_id}`);

    // AI response simulation
    const aiResponse = `Это автоматический ответ на: "${message.text}". Чем ещё могу помочь?`;

    // Send reply via UseDesk API
    await axios.post(`https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`, {
      ticket_id,
      message: aiResponse,
      type: 'support'
    }, {
      headers: { 
        'Authorization': `Bearer ${USEDESK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UseDesk subdomain: ${USEDESK_SUBDOMAIN}`);
});
