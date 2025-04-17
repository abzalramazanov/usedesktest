require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// 1. Инициализация Express приложения
const app = express();

// 2. Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 3. Конфигурация
const USEDESK_API_KEY = process.env.USEDESK_API_KEY;
const USEDESK_SUBDOMAIN = process.env.USEDESK_SUBDOMAIN || '170453';
const PORT = process.env.PORT || 3000;

// 4. Проверка работы сервера
app.get('/', (req, res) => {
  res.status(200).send('UseDesk AI Bot is running');
});

// 5. Обработчик вебхука
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));

    // Проверка секретного ключа (если нужно)
    if (req.body.secret !== process.env.WEBHOOK_SECRET) {
      return res.status(403).json({ error: 'Invalid secret' });
    }

    // Обработка структуры WhatsApp
    const { ticket, text, chat_id } = req.body;
    
    if (!ticket || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Processing ticket #${ticket.id}: "${text}"`);

    // Генерация ответа
    const aiResponse = `Мы получили ваше сообщение: "${text}". Скоро ответим!`;

    // Отправка ответа через UseDesk API
    const apiResponse = await axios.post(
      `https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`,
      {
        ticket_id: ticket.id,
        message: aiResponse,
        type: 'support',
        chat_id: chat_id
      },
      {
        headers: { 
          'Authorization': `Bearer ${USEDESK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Message sent successfully:', apiResponse.data);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', {
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

// 6. Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UseDesk subdomain: ${USEDESK_SUBDOMAIN}`);
});

// 7. Обработка ошибок процесса
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
