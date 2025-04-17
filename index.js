require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN;
const PORT = process.env.PORT || 3000;

// Обработчик вебхуков
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming request:', JSON.stringify(req.body, null, 2));

    // Проверяем, что это сообщение от Abzal
    if (req.body.client?.name !== 'Abzal') {
      console.log('Ignoring request - not from Abzal');
      return res.status(200).json({ status: 'ignored' });
    }

    // Извлекаем данные сообщения
    const { chat_id, text, ticket } = req.body;
    
    if (!chat_id || !text) {
      return res.status(400).json({ error: 'Missing chat_id or text' });
    }

    console.log(`Processing message from Abzal in chat ${chat_id}: "${text}"`);

    // Формируем ответ
    const responseText = `Привет, Abzal! Мы получили ваше сообщение: "${text}"`;

    // Отправляем ответ
    await axios.post(
      `https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`,
      {
        chat_id,
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

// Проверка работы сервера
app.get('/', (req, res) => {
  res.send('UseDesk Abzal Bot is running');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
