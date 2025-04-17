require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Проверяем наличие обязательных переменных окружения
if (!process.env.USEDESK_API_KEY || !process.env.USEDESK_SUBDOMAIN) {
  console.error('ERROR: Missing required environment variables');
  process.exit(1);
}

const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN;
const PORT = process.env.PORT || 3000;

app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));

    // 1. Проверяем что это сообщение от Abzal
    if (!req.body.client || req.body.client.name !== 'Abzal') {
      console.log('Ignoring request - not from Abzal');
      return res.status(200).json({ status: 'ignored_not_abzal' });
    }

    // 2. Проверяем наличие текста сообщения (новый способ)
    let messageText = '';
    
    // Вариант 1: текст в корне запроса (для чатов)
    if (req.body.text) {
      messageText = req.body.text;
    }
    // Вариант 2: текст в комментариях (для тикетов)
    else if (req.body.comments && Array.isArray(req.body.comments)) {
      const clientComments = req.body.comments.filter(
        c => c.from === 'client' && c.message && c.message.trim() !== ''
      );
      if (clientComments.length > 0) {
        messageText = clientComments[0].message;
      }
    }

    if (!messageText) {
      console.log('Ignoring request - no text message found');
      return res.status(200).json({ status: 'ignored_no_text' });
    }

    // 3. Получаем ID чата/тикета
    const chat_id = req.body.chat_id || req.body.ticket?.id;
    if (!chat_id) {
      console.log('Missing chat/ticket ID');
      return res.status(400).json({ error: 'Missing chat/ticket ID' });
    }

    console.log(`Processing message from Abzal in chat/ticket ${chat_id}: "${messageText}"`);

    // 4. Формируем ответ
    const responseText = `Abzal, мы получили: "${messageText}". Спасибо за обращение!`;

    // 5. Отправляем ответ
    const apiUrl = `https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`;
    console.log('Sending to:', apiUrl);
    
    const response = await axios.post(
      apiUrl,
      {
        chat_id,
        message: responseText,
        type: 'support'
      },
      {
        headers: { 
          'Authorization': `Bearer ${USEDESK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    console.log('Successfully sent reply:', response.data);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      request: error.config?.data
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'UseDesk Abzal Bot',
    environment: {
      USEDESK_SUBDOMAIN: USEDESK_SUBDOMAIN,
      PORT: PORT
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UseDesk domain: ${USEDESK_SUBDOMAIN}.usedesk.ru`);
});
