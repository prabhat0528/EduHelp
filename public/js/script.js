document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');

    console.log('Chatbot elements:', {
        chatbotToggle,
        chatbotContainer,
        chatbotClose,
        chatbotMessages,
        chatbotInput,
        chatbotSend
    });

    if (!chatbotToggle || !chatbotContainer || !chatbotClose || !chatbotMessages || !chatbotInput || !chatbotSend) {
        console.error('One or more chatbot elements not found in the DOM.');
        return;
    }

    let hasGreeted = false;

    chatbotToggle.addEventListener('click', () => {
        console.log('Chatbot toggle clicked');
        const isHidden = chatbotContainer.style.display === 'none' || chatbotContainer.style.display === '';
        chatbotContainer.style.display = isHidden ? 'block' : 'none';

        if (isHidden && !hasGreeted) {
            addMessage('Bot', 'Hello! How can I assist you with your courses today?');
            hasGreeted = true;
        }
    });

    chatbotClose.addEventListener('click', () => {
        console.log('Chatbot close clicked');
        chatbotContainer.style.display = 'none';
    });

    let isSending = false;
    async function sendMessage() {
        if (isSending) return;
        isSending = true;

        const message = chatbotInput.value.trim();
        if (!message) {
            isSending = false;
            return;
        }

        addMessage('You', message);
        chatbotInput.value = '';

        try {
            const response = await axios.post('/api/chat', { message });
            addMessage('Bot', cleanMessage(response.data.reply));
        } catch (error) {
            console.error('Error sending message:', error);
            let errorMessage = 'Oops, something went wrong! Please try again.';
            if (error.response) {
                errorMessage = `Server error: ${error.response.status} - ${error.response.data.reply || 'Unknown error'}`;
            } else if (error.request) {
                errorMessage = 'Network error: Unable to reach the server. Please check your connection.';
            }
            addMessage('Bot', cleanMessage(errorMessage));
        } finally {
            isSending = false;
        }
    }

    function cleanMessage(text) {
        return text
            .replace(/```json/g, '') 
            .replace(/```/g, '')     
            .replace(/``/g, '')      
            .replace(/`/g, '')       
            .trim();                 
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('mb-2', sender === 'You' ? 'text-end' : 'text-start');
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    chatbotSend.addEventListener('click', () => {
        console.log('Send button clicked');
        sendMessage();
    });

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            sendMessage();
        }
    });
});