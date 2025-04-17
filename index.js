require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Проверяем наличие обязательных переменных окружения
console.log('USEDESK_API_TOKEN:', process.env.USEDESK_API_TOKEN ? 'Present' : 'Missing');
console.log('USEDESK_USER_ID:', process.env.USEDESK_USER_ID ? 'Present' : 'Missing');
if (!process.env.USEDESK_API_TOKEN || !process.env.USEDESK_USER_ID) {
  console.error('ERROR: Missing required environment variables');
  process.exit(1);
}

const USEDESK_API_TOKEN = process.env.USEDESK_API_TOKEN;
const USEDESK_USER_ID = process.env.USEDESK_USER_ID;
const PORT = process.env.PORT || 3000;

app.post('/webhook', async (req, res) => {
  try {
    console.log('Входящий вебхук:', JSON.stringify(req.body, null, 2));

    // 1. Проверяем наличие текста сообщения
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
    // Вариант 3: текст в trigger.message или других полях (для тикетов)
    else if (req.body.trigger && req.body.trigger.message) {
      messageText = req.body.trigger.message;
    }

    console.log('Извлеченный текст сообщения:', messageText);

    if (!messageText) {
      console.log('Игнорируем запрос - текст сообщения не найден');
      return res.status(200).json({ status: 'ignored_no_text' });
    }

    // 2. Проверяем, является ли сообщение словом "привет" (без учета регистра)
    const isHello = messageText.trim().toLowerCase() === 'привет';
    if (!isHello) {
      console.log('Игнорируем запрос - сообщение не "привет"');
      return res.status(200).json({ status: 'ignored_not_hello' });
    }

    // 3. Получаем ID чата/тикета
    const chat_id = req.body.chat_id || req.body.ticket?.id || req.body.trigger?.ticket_id;
    if (!chat_id) {
      console.log('Отсутствует ID чата/тикета');
      return res.status(400).json({ error: 'Missing chat/ticket ID' });
    }

    console.log(`Обработка сообщения "привет" в чате/тикете ${chat_id}`);

    // 4. Формируем ответ
    const responseText = `Здравствуйте! Чем могу помочь?`;

    // 5. Отправляем ответ
    const apiUrl = `https://api.usedesk.ru/chat/sendMessage`;
    console.log('Отправка на:', apiUrl);
    
    try {
      const response = await axios.post(
        apiUrl,
        {
          api_token: USEDESK_API_TOKEN,
          chat_id: chat_id,
          message: responseText,
          type: 'user',
          user_id: USEDESK_USER_ID
        },
        {
          headers: { 
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('Ответ успешно отправлен:', response.data);
      return res.status(200).json({ success: true });
    } catch (apiError) {
      console.error('Ошибка API UseDesk:', {
        message: apiError.message,
        code: apiError.code,
        response: apiError.response?.data,
        status: apiError.response?.status,
        requestUrl: apiUrl
      });
      throw apiError;
    }

  } catch (error) {
    console.error('Ошибка обработки вебхука:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      request: error.config?.data
    });
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'UseDesk Hello Bot',
    environment: {
      PORT: PORT
    }
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
