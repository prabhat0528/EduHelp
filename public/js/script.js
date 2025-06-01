document.addEventListener('DOMContentLoaded', () => {
    
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navbarNav = document.getElementById('navbarNav');
  
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        navbarNav.classList.toggle('hidden');
      });
    }
  
    // Chatbot functionality
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
  
    if (!chatbotToggle || !chatbotContainer || !chatbotClose || !chatbotMessages || !chatbotInput || !chatbotSend) {
      console.error('One or more chatbot elements not found in the DOM.');
      return;
    }
  
    let hasGreeted = false;
    let isSending = false;
  
    const cleanMessage = (text) => {
      return text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/``/g, '')
        .replace(/`/g, '')
        .trim();
    };
  
    const addMessage = (sender, text) => {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('mb-3', sender === 'You' ? 'text-right' : 'text-left');
      messageDiv.innerHTML = `
        <div class="${sender === 'You' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-800'} inline-block p-3 rounded-lg max-w-[80%]">
          <strong>${sender}:</strong> ${text}
        </div>
      `;
      chatbotMessages.appendChild(messageDiv);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };
  
    const sendMessage = async () => {
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
    };
  
    chatbotToggle.addEventListener('click', () => {
      const isHidden = chatbotContainer.classList.contains('hidden');
      chatbotContainer.classList.toggle('hidden', !isHidden);
  
      if (isHidden && !hasGreeted) {
        addMessage('Bot', 'Hello! How can I assist you with your courses today?');
        hasGreeted = true;
      }
    });
  
    chatbotClose.addEventListener('click', () => {
      chatbotContainer.classList.add('hidden');
    });
  
    chatbotSend.addEventListener('click', sendMessage);
  
    chatbotInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  });