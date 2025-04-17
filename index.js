require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Инициализация приложения
const app = express();
app.use(bodyParser.json());

// Конфигурация
const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN;
const PORT = process.env.PORT || 3000;

// Проверка работы сервера
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'UseDesk WhatsApp Bot',
    version: '1.0'
  });
});

// Основной обработчик вебхуков
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));

    // Извлекаем данные из вебхука
    const { chat_id, ticket, text, platform, client } = req.body;
    
    // Валидация входящих данных
    if (!ticket || !ticket.id) {
      return res.status(400).json({ error: 'Missing ticket data' });
    }

    // Определяем тип контента
    const hasText = text && text.trim() !== '';
    const hasFiles = req.body.files && req.body.files.length > 0;

    // Логируем тип сообщения
    console.log(`Processing ${platform} message in chat ${chat_id}:`, {
      text,
      hasFiles,
      client: client?.name
    });

    // Генерация ответа
    let responseText;
    if (hasFiles && !hasText) {
      responseText = 'Мы получили ваше изображение. Обрабатываем запрос...';
    } else if (text.toLowerCase().includes('привет')) {
      responseText = 'Добрый день! Чем можем помочь?';
    } else {
      responseText = 'Спасибо за обращение! Ваш запрос в обработке.';
    }

    // Отправка ответа через UseDesk API
    const response = await axios.post(
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
        },
        timeout: 5000 // Таймаут 5 секунд
      }
    );

    console.log('Message sent successfully:', response.data);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook processing failed:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      response: error.response?.data
    });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Обработка несуществующих роутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UseDesk subdomain: ${USEDESK_SUBDOMAIN}`);
});

// Обработка ошибок процесса
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
