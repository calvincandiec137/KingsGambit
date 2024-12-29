// simple chatting
const initChat = (roomId, playerName) => {
    const socket = io();
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendButton = document.getElementById('sendMessage');

    function addMessage(message, isSent) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isSent ? 'sent' : 'received');
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendButton.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('chat_message', {
                message: message,
                room: roomId,
                sender: playerName
            });
            addMessage(message, true);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    socket.on('chat_message', function(data) {
        addMessage(`${data.sender}: ${data.message}`, false);
    });
};