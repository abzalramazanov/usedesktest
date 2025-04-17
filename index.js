require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN;
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('UseDesk AI Bot is running');
});

// Webhook handler
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));

    const { ticket, comments } = req.body;
    
    if (!ticket || !comments) {
      return res.status(400).json({ error: 'Invalid webhook format' });
    }

    // Находим последнее сообщение от клиента
    const lastClientComment = comments.find(comment => 
      comment.from === 'client' && comment.message && comment.message.trim() !== ''
    );

    if (!lastClientComment) {
      console.log('No client message found in comments');
      return res.status(200).json({ status: 'No client message to process' });
    }

    const ticketId = ticket.id;
    const messageText = lastClientComment.message;
    const clientName = lastClientComment.client_name || 'Клиент';

    console.log(`Processing ticket #${ticketId} from ${clientName}: "${messageText}"`);

    // Генерация ответа (можно заменить на вызов AI)
    const aiResponse = `Уважаемый(ая) ${clientName}, мы получили ваше сообщение: "${messageText}". Наш специалист скоро с вами свяжется!`;

    // Отправка ответа через UseDesk API
    const apiResponse = await axios.post(
      `https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`,
      {
        ticket_id: ticketId,
        message: aiResponse,
        type: 'support'
      },
      {
        headers: { 
          'Authorization': `Bearer ${USEDESK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Successfully sent reply:', apiResponse.data);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UseDesk subdomain: ${USEDESK_SUBDOMAIN}`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
