app.post('/webhook', async (req, res) => {
  try {
    console.log('Full webhook received:', JSON.stringify(req.body, null, 2));

    // Обрабатываем структуру WhatsApp-чата из UseDesk
    const { ticket, text, chat_id } = req.body;
    
    if (!ticket || !text) {
      throw new Error('Required fields missing');
    }

    const ticketId = ticket.id;
    const messageText = text;

    console.log(`Processing WhatsApp chat #${chat_id}, ticket #${ticketId}: "${messageText}"`);

    // Генерация ответа (можно подключить OpenAI здесь)
    const aiResponse = `Спасибо за ваше сообщение: "${messageText}". Наш специалист скоро свяжется с вами!`;

    // Отправка ответа через UseDesk API
    const response = await axios.post(`https://${USEDESK_SUBDOMAIN}.usedesk.ru/api/v1/chats/message`, {
      ticket_id: ticketId,
      message: aiResponse,
      type: 'support',
      chat_id: chat_id // Важно для WhatsApp чатов
    }, {
      headers: { 
        'Authorization': `Bearer ${USEDESK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Message sent successfully:', response.data);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing failed:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});
