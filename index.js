require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Проверяем наличие обязательных переменных окружения
console.log('USEDESK_API_TOKEN:', process.env.USEDESK_API_TOKEN ? 'Present' : 'Missing');
console.log('USEDESK_USER_ID:', process.env.USEDESK_USER_ID ? 'Present' : 'Missing');
console.log('USEDESK_CHANNEL_ID:', process.env.USEDESK_CHANNEL_ID ? 'Present' : 'Missing');
if (!process.env.USEDESK_API_TOKEN || !process.env.USEDESK_USER_ID || !process.env.USEDESK_CHANNEL_ID) {
  console.error('ERROR: Missing required environment variables');
  process.exit(1);
}

const USEDESK_API_TOKEN = process.env.USEDESK_API_TOKEN;
const USEDESK_USER_ID = process.env.USEDESK_USER_ID;
const USEDESK_CHANNEL_ID = process.env.USEDESK_CHANNEL_ID;
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
    // Вариант 4: текст в trigger.comment (для тикетов)
    else if (req.body.trigger && req.body.trigger.comment) {
      messageText = req.body.trigger.comment;
    }

    console.log('Извлеченный текст сообщения:', messageText);

    if (!messageText) {
      console.log('Игнорируем запрос - текст сообщения не найден');
      return res.status(200).json({ status: 'ignored_no_text' });
    }

    // 2. Получаем информацию о клиенте
    let client_id = req.body.client_id || req.body.client?.id || req.body.trigger?.client_id;
    let client_phone = null;
    
    if (req.body.client && req.body.client.phones && req.body.client.phones.length > 0) {
      client_phone = req.body.client.phones[0].phone;
    }

    // Если клиент новый или неизвестен, используем client_id: "new_client"
    if (!client_id || !client_phone) {
      client_id = 'new_client';
      client_phone = client_phone || '79123456789'; // Замените на реальный номер, если известен
    }

    console.log(`Обработка сообщения от клиента: client_id=${client_id}, client_phone=${client_phone}`);

    // 3. Формируем данные для создания тикета
    const ticketData = {
      api_token: USEDESK_API_TOKEN,
      subject: 'Новое сообщение от клиента',
      message: messageText,
      user_id: USEDESK_USER_ID,
      from: 'whatsapp',
      channel_id: USEDESK_CHANNEL_ID,
      client_id: client_id
    };

    // Добавляем client_phone, если клиент новый
    if (client_id === 'new_client') {
      ticketData.client_phone = client_phone;
    }

    // 4. Отправляем запрос на создание тикета
    const apiUrl = `https://api.usedesk.ru/create/ticket`;
    console.log('Отправка на:', apiUrl);
    
    try {
      const response = await axios.post(
        apiUrl,
        ticketData,
        {
          headers: { 
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('Тикет успешно создан:', response.data);
      return res.status(200).json({ success: true, ticket_id: response.data.ticket_id });
    } catch (apiError) {
      console.error('Ошибка API UseDesk:', {
        message: apiError.message,
        code: apiError.code,
        response: apiError.response?.data,
        status: apiError.response?.status,
        requestUrl: apiUrl,
        requestData: ticketData
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
    service: 'UseDesk WhatsApp Ticket Bot',
    environment: {
      PORT: PORT
    }
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
