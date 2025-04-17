require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// 1. Инициализация Express приложения
const app = express();
app.use(bodyParser.json());

const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN || 'yourcompany';

// 2. Health check endpoint
app.get('/', (req, res) => {
  res.send('UseDesk AI Bot is running');
});

// 3. Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));

    const { ticket, message } = req.body;
    
    if (!ticket || !message) {
      throw new Error('Invalid webhook format');
    }

    const ticketId = ticket.id;
    const messageText = message.text || message.content;

    console.log(`Processing ticket #${ticketId}: "${messageText}"`);

    // Генерация ответа
    const aiResponse = `Бот получил ваш запрос: "${messageText}". Мы обрабатываем его!`;

    // Отправка ответа в UseDesk
    await axios.post(`https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`, {
      ticket_id: ticketId,
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
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      received_body: req.body
    });
  }
});

// 4. Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
