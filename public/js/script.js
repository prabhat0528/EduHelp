<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

   
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');

    chatbotToggle.addEventListener('click', () => {
        const isHidden = chatbotContainer.style.display === 'none' || chatbotContainer.style.display === '';
        chatbotContainer.style.display = isHidden ? 'block' : 'none';
        if (isHidden && chatbotMessages.children.length === 0) {
            addMessage('Bot', 'Hello! How can I assist you with your courses today?');
        }
    });

    chatbotClose.addEventListener('click', () => {
        chatbotContainer.style.display = 'none';
    });

    async function sendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;

        addMessage('You', message);
        chatbotInput.value = '';

        try {
            const response = await axios.post('/api/chat', { message });
            addMessage('Bot', response.data.reply);
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('Bot', 'Oops, something went wrong! Please try again.');
        }
    }

   
    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('mb-2', sender === 'You' ? 'text-end' : 'text-start');
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight; 
    }
