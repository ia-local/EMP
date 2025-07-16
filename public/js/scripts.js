// public/js/scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Gestion de la modale du Chatbot (utilisant modal.js) ---
    // Assurez-vous que modal.js est chargé AVANT ce script et qu'il expose la classe Modal.
    const chatModal = new Modal('chatModal'); // Instancie la modale
    
    // Bouton du chatbot dans le header
    const openChatModalBtnHeader = document.getElementById('openChatModalBtn');
    if (openChatModalBtnHeader) {
        openChatModalBtnHeader.addEventListener('click', () => {
            chatModal.open();
            // Recharger l'iframe pour s'assurer d'un état propre
            const chatIframe = document.getElementById('chatIframe');
            if (chatIframe) {
                chatIframe.src = 'chatbot.html';
            }
        });
    }

    // Bouton du chatbot dans l'aside (nouvellement ajouté)
    const openChatModalBtnAside = document.getElementById('openChatbotBtnAside');
    if (openChatModalBtnAside) {
        openChatModalBtnAside.addEventListener('click', () => {
            chatModal.open();
            const chatIframe = document.getElementById('chatIframe');
            if (chatIframe) {
                chatIframe.src = 'chatbot.html';
            }
        });
    }

    // Bouton de fermeture de la modale du chatbot
    const closeChatModalBtn = document.getElementById('closeChatModalBtn');
    if (closeChatModalBtn) {
        closeChatModalBtn.addEventListener('click', () => {
            chatModal.close();
        });
    }

    // Fermeture de la modale si l'utilisateur clique en dehors
    const chatModalElement = document.getElementById('chatModal');
    if (chatModalElement) {
        chatModalElement.addEventListener('click', (event) => {
            if (event.target === chatModalElement) {
                chatModal.close();
            }
        });
    }


    // --- Gestion de la navigation principale (en haut) ---
    const mainNavLinks = document.querySelectorAll('.main-nav .nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    mainNavLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // Pour les liens qui sont des ancres (#), empêcher le comportement par défaut
            // et gérer l'affichage des sections
            const targetId = link.getAttribute('href').substring(1); // Supprime le '#'
            const targetSection = document.getElementById(targetId);

            if (targetSection) { // C'est une ancre interne
                event.preventDefault(); 
                // Supprime la classe 'active' de tous les liens de la navigation principale
                mainNavLinks.forEach(l => l.classList.remove('active'));
                // Ajoute la classe 'active' au lien cliqué
                link.classList.add('active');

                // Masque toutes les sections de contenu
                contentSections.forEach(section => section.classList.remove('active'));
                // Active la section cible
                targetSection.classList.add('active');

                // Désactive tous les liens de la barre latérale et active le correspondant si applicable
                const sidebarLinks = document.querySelectorAll('.sidebar-nav .sidebar-link');
                sidebarLinks.forEach(sl => sl.classList.remove('active'));
                const correspondingSidebarLink = document.querySelector(`.sidebar-nav .sidebar-link[data-section-id="${targetId}"]`);
                if (correspondingSidebarLink) {
                    correspondingSidebarLink.classList.add('active');
                }
            } else { // C'est un lien externe ou vers une autre page HTML
                // Laisser le comportement par défaut du lien opérer (redirection)
            }
        });
    });

    // --- Gestion de la navigation latérale (aside-column) ---
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Empêche le comportement par défaut du lien

            // Supprime la classe 'active' de tous les liens de la barre latérale
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Ajoute la classe 'active' au lien cliqué
            link.classList.add('active');

            const sectionId = link.dataset.sectionId;

            // Masque toutes les sections de contenu du main-content-column
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Active la section cible
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            } else {
                console.error(`Section with ID "${sectionId}" not found.`);
            }

            // Mettre à jour le lien "Accueil" dans la navigation principale
            const homeNavLink = document.querySelector('.main-nav .nav-link[data-page="home"]');
            if (homeNavLink) {
                mainNavLinks.forEach(l => l.classList.remove('active')); // Désactiver tous les liens principaux
                homeNavLink.classList.add('active'); // Activer le lien Accueil
            }
        });
    });

    // --- Chargement initial du contenu (Accueil par défaut) ---
    // Simule un clic sur le lien d'accueil de la barre latérale au chargement de la page
    const initialSidebarLink = document.querySelector('.sidebar-nav .sidebar-link[data-section-id="welcome-section"]');
    if (initialSidebarLink) {
        initialSidebarLink.click(); // Simule un clic pour charger le contenu
    } else {
        // Fallback si la section d'accueil n'est pas trouvée
        const mainContentColumn = document.querySelector('.main-content-column');
        if (mainContentColumn) {
            mainContentColumn.innerHTML = '<p>Veuillez sélectionner une section.</p>';
        }
    }
});