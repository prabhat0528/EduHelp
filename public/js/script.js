<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');

    let hasGreeted = false; 

    
    chatbotToggle.addEventListener('click', () => {
        const isHidden = chatbotContainer.style.display === 'none' || chatbotContainer.style.display === '';
        chatbotContainer.style.display = isHidden ? 'block' : 'none';

        
        if (isHidden && !hasGreeted) {
            addMessage('Bot', 'Hello! How can I assist you with your courses today?');
            hasGreeted = true;
        }
    });

    
    chatbotClose.addEventListener('click', () => {
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
            addMessage('Bot', response.data.reply);
        } catch (error) {
            console.error('Error sending message:', error);
            let errorMessage = 'Oops, something went wrong! Please try again.';
            if (error.response) {
              
                errorMessage = `Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`;
            } else if (error.request) {
               
                errorMessage = 'Network error: Unable to reach the server. Please check your connection.';
            }
            addMessage('Bot', errorMessage);
        } finally {
            isSending = false;
        }
    }

    // Add message to chat
    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('mb-2', sender === 'You' ? 'text-end' : 'text-start');
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Scroll to bottom
    }

    // Event listeners for sending messages
    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});