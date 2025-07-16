// public/chat.js
document.addEventListener('DOMContentLoaded', () => {
    const messagesDisplay = document.getElementById('messages-display');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const roleButtons = document.querySelectorAll('.role-button');
    const newConversationButton = document.getElementById('new-conversation-button');

    let currentRole = 'investigator'; // Rôle par défaut
    // Objet pour stocker l'historique de conversation pour CHAQUE persona
    // Chaque clé sera le nom du rôle (ex: 'investigator'), et la valeur sera un tableau de messages.
    let conversationHistories = {
        'investigator': [],
        'journalist': [],
        'lawyer': [],
        'judge': [],
        'system-role': []
    };

    // Initialiser le bouton du rôle par défaut comme actif
    document.querySelector(`[data-role="${currentRole}"]`).classList.add('active');
    // Afficher le message d'accueil initial pour le rôle par défaut
    displayMessage('ai', `Bienvenue ! Vous discutez actuellement avec le rôle : <strong>${document.querySelector(`[data-role="${currentRole}"]`).textContent}</strong>. Posez votre question concernant l'enquête.`);


    // Fonction pour afficher un message dans l'interface
    function displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerHTML = message.replace(/\n/g, '<br>');
        messagesDisplay.appendChild(messageElement);
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    }

    // Fonction pour envoyer un message à l'API du serveur
    async function sendMessageToAPI(role, message, history) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: role,
                    message: message,
                    conversationHistory: history // Envoyer l'historique spécifique à cette persona
                }),
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message à l\'API:', error);
            return 'Désolé, une erreur est survenue lors de la communication avec le rôle choisi.';
        }
    }

    // Gérer la sélection du rôle via les boutons
    roleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Désactiver le bouton actif précédent
            document.querySelector('.role-button.active')?.classList.remove('active');
            // Activer le nouveau bouton
            button.classList.add('active');

            const previousRole = currentRole;
            currentRole = button.dataset.role;

            // Mettre à jour l'affichage des messages pour le nouvel historique
            messagesDisplay.innerHTML = ''; // Vider l'affichage actuel
            conversationHistories[currentRole].forEach(entry => {
                displayMessage(entry.role === 'user' ? 'user' : 'ai', entry.message);
            });

            // Ajouter un message d'information sur le changement de rôle
            if (previousRole !== currentRole || conversationHistories[currentRole].length === 0) {
                 // Si le rôle change ou si c'est une nouvelle conversation pour ce rôle
                 displayMessage('ai', `Vous discutez maintenant avec le rôle : <strong>${button.textContent}</strong>.`);
            }
        });
    });

    // Fonction pour vider l'historique et l'affichage pour la persona active
    function clearChat() {
        messagesDisplay.innerHTML = '';
        conversationHistories[currentRole] = []; // Vide l'historique UNIQUEMENT pour la persona actuelle
        displayMessage('ai', 'Nouvelle conversation démarrée avec ce rôle. Posez votre première question.');
    }

    // Gérer le bouton "Nouvelle Conversation"
    newConversationButton.addEventListener('click', clearChat);

    // Gérer l'envoi de message
    sendButton.addEventListener('click', async () => {
        const userMessage = userInput.value.trim();

        if (userMessage) {
            displayMessage('user', userMessage);
            // Ajouter le message utilisateur à l'historique de la persona actuelle
            conversationHistories[currentRole].push({ role: 'user', message: userMessage });

            userInput.value = '';

            displayMessage('ai', `(${currentRole} réfléchit...)`);

            // Envoyer l'historique complet de la persona actuelle à l'API
            const aiResponse = await sendMessageToAPI(currentRole, userMessage, conversationHistories[currentRole]);

            // Mettre à jour le dernier message (le message d'attente)
            const lastAiMessage = messagesDisplay.lastChild;
            if (lastAiMessage && lastAiMessage.textContent.includes('réfléchit')) {
                lastAiMessage.innerHTML = aiResponse.replace(/\n/g, '<br>');
            } else {
                displayMessage('ai', aiResponse);
            }
            // Ajouter la réponse de l'IA à l'historique de la persona actuelle
            // Le rôle pour l'historique interne du client sera 'ai' pour l'affichage
            conversationHistories[currentRole].push({ role: 'ai', message: aiResponse });
        }
    });

    // Envoyer le message avec Entrée
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
});