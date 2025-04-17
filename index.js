app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming webhook:', JSON.stringify(req.body, null, 2)); // Логируем весь запрос

    // Стандартная структура вебхука UseDesk
    const { ticket, message } = req.body;
    
    if (!ticket || !message) {
      throw new Error('Invalid webhook format');
    }

    const ticketId = ticket.id;
    const messageText = message.text || message.content;

    console.log(`Processing ticket #${ticketId}: "${messageText}"`);

    // Генерируем ответ (можно заменить на вызов OpenAI)
    const aiResponse = `Бот получил ваш запрос: "${messageText}". Мы обрабатываем его и скоро ответим!`;

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
    console.error('Webhook error:', error.message);
    res.status(500).json({ 
      error: error.message,
      received_body: req.body // Для отладки
    });
  }
});
