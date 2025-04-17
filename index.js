require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN;
const PORT = process.env.PORT || 3000;

app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));

    // 1. Проверяем что это сообщение от Abzal
    if (!req.body.client || req.body.client.name !== 'Abzal') {
      console.log('Ignoring request - not from Abzal');
      return res.status(200).json({ status: 'ignored' });
    }

    // 2. Проверяем что это текстовое сообщение
    if (!req.body.text) {
      console.log('Ignoring request - no text message');
      return res.status(200).json({ status: 'ignored' });
    }

    // 3. Получаем данные сообщения
    const { chat_id, text, ticket } = req.body;
    
    if (!chat_id || !ticket?.id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Processing message from Abzal in chat ${chat_id}: "${text}"`);

    // 4. Формируем ответ
    const responseText = `Abzal, мы получили ваше сообщение: "${text}". Спасибо!`;

    // 5. Отправляем ответ
    await axios.post(
      `https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`,
      {
        chat_id,
        ticket_id: ticket.id,
        message: responseText,
        type: 'support'
      },
      {
        headers: { 
          'Authorization': `Bearer ${USEDESK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('UseDesk Abzal Bot is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
