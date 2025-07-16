// public/dashboard.js
// Variables globales
let currentMapView = null;
let mapContainer = null;
let allFinancialFlows = []; // Pour stocker tous les flux sans filtrage
let allAffairesChronology = { chronology: [] }; // Nouvelle variable globale pour la chronologie des affaires
let minDate = new Date('2016-01-01'); // Date de début de l'enquête par défaut
let maxDate = new Date('2027-12-31'); // Date de fin de l'enquête par défaut

// Fonctions utilitaires de logging
const logFrontendError = async (errorData) => {
    try {
        await fetch('/api/log/frontend-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData)
        });
    } catch (err) {
        console.error('Failed to log frontend error:', err);
    }
};

const logPerformanceMetric = async (metricData) => {
    try {
        await fetch('/api/log/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metricData)
        });
    } catch (err) {
        console.error('Failed to log performance metric:', err);
    }
};

const logUserAction = async (actionData) => {
    try {
        await fetch('/api/log/user-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actionData)
        });
    } catch (err) {
        console.error('Failed to log user action:', err);
    }
};


// Fonctions pour charger les données ( modifiées pour le filtrage temporel et la nouvelle structure Affaires )
const loadOverviewData = async () => {
    console.log('Chargement des données d\'aperçu...');
    try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        document.getElementById('total-transactions').textContent = data.totalTransactions.toLocaleString();
        document.getElementById('active-alerts').textContent = data.activeAlerts;
        document.getElementById('risky-entities').textContent = data.riskyEntities;
        console.log('Données d\'aperçu chargées:', data);
    } catch (error) {
        console.error('Erreur lors du chargement des données d\'aperçu:', error);
        logFrontendError({ message: 'Failed to load overview data', error: error.message, component: 'Overview' });
    }
};

/**
 * Charge et affiche la cartographie des flux financiers.
 * Intègre un curseur temporel pour filtrer les flux par date.
 */
const loadMapData = async (filterDate = null) => {
    console.log(`Tentative de chargement de la carte avec filtre: ${filterDate ? filterDate.toLocaleDateString() : 'Toutes les dates'}`);

    if (!mapContainer) {
        console.error("Conteneur de carte (#map-container) non trouvé ou non initialisé.");
        logFrontendError({ message: "Map container not found", component: "Flow Mapping" });
        return;
    }

    // Vérifier les dimensions du conteneur avant d'initialiser la carte
    const mapContainerStyle = window.getComputedStyle(mapContainer);
    const containerHeight = parseInt(mapContainerStyle.height);
    const containerWidth = parseInt(mapContainerStyle.width);
    console.log(`Dimensions de map-container: Hauteur=${containerHeight}px, Largeur=${containerWidth}px`);
    if (containerHeight === 0 || containerWidth === 0) {
        console.warn("map-container a une hauteur ou une largeur de 0. La carte pourrait ne pas s'afficher.");
        // Tenter de redéfinir une taille minimale si elle est à zéro pour le débogage
        if (containerHeight === 0) mapContainer.style.minHeight = '600px';
        if (containerWidth === 0) mapContainer.style.minWidth = '100%';
    }


    // Si on n'a pas encore chargé les données complètes des flux, on les fetch
    if (allFinancialFlows.length === 0) {
        console.log('Chargement initial de tous les flux financiers depuis l\'API...');
        try {
            const response = await fetch('/api/financial-flows');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const flows = await response.json();

            if (!Array.isArray(flows)) {
                console.error('API /api/financial-flows did not return an array:', flows);
                throw new Error('Données de flux financiers invalides reçues du serveur.');
            }
            allFinancialFlows = flows; // Stocke tous les flux
            console.log(`Chargement initial terminé. ${allFinancialFlows.length} flux chargés.`);
        } catch (error) {
            console.error('Erreur lors du chargement initial des données de la carte:', error);
            mapContainer.innerHTML = '<p style="text-align: center; padding-top: 200px; color: red;">Erreur lors du chargement de la carte des flux. Vérifiez la console pour plus de détails.</p>';
            logFrontendError({ message: 'Failed to load map data', error: error.message, component: 'Flow Mapping' });
            return;
        }
    }

    // Filtrer les flux basés sur la date
    let filteredFlows = allFinancialFlows;
    if (filterDate) {
        filteredFlows = allFinancialFlows.filter(flow => {
            const flowDate = flow.date ? new Date(flow.date) : new Date(0); // Utiliser une date par défaut si flow.date est absent/invalide
            return flowDate.getTime() <= filterDate.getTime();
        });
    }
    console.log(`${filteredFlows.length} flux après filtrage par date.`);


    // Nettoyer le conteneur et détruire l'instance de carte précédente si elle existe
    if (currentMapView) {
        console.log("Détruire l'ancienne instance de carte.");
        currentMapView.remove();
        currentMapView = null;
    }
    
    // Vérifier si Leaflet est chargé
    if (typeof L === 'undefined') {
        console.error("Leaflet.js n'est pas chargé. Assurez-vous d'inclure <script src='https://unpkg.com/leaflet/dist/leaflet.js'></script> dans dashboard.html.");
        mapContainer.innerHTML = '<p style="text-align: center; padding-top: 200px; color: red;">Erreur: Bibliothèque de carte non chargée.</p>';
        logFrontendError({ message: "Leaflet not loaded", component: "Map" });
        return;
    }

    console.log("Initialisation de la nouvelle carte Leaflet.");
    currentMapView = L.map('map-container').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(currentMapView);

    // IMPORTANT: Invalider la taille de la carte après son affichage (si elle était masquée)
    currentMapView.invalidateSize();
    console.log("Carte Leaflet initialisée et invalidateSize() appelée.");


    const markers = [];
    if (filteredFlows.length === 0) {
        console.warn('Aucun flux financier à afficher pour la date sélectionnée.');
        if (mapContainer.querySelector('.no-flows-message')) {
            mapContainer.querySelector('.no-flows-message').remove();
        }
        const noFlowsMessage = document.createElement('div');
        noFlowsMessage.className = 'no-flows-message';
        noFlowsMessage.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; font-size: 1.2em; color: #555; background-color: rgba(255,255,255,0.7); padding: 10px; border-radius: 5px; z-index: 1000;'; // Ajouter z-index
        noFlowsMessage.textContent = 'Aucun flux financier disponible pour cette période ou ajoutez des flux via l\'API.';
        mapContainer.appendChild(noFlowsMessage);
    } else {
        if (mapContainer.querySelector('.no-flows-message')) {
            mapContainer.querySelector('.no-flows-message').remove();
        }
        console.log(`Ajout de ${filteredFlows.length} flux à la carte.`);
        filteredFlows.forEach(flow => {
            if (!flow.sender_geo || typeof flow.sender_geo.lat === 'undefined' || typeof flow.sender_geo.lon === 'undefined' ||
                !flow.receiver_geo || typeof flow.receiver_geo.lat === 'undefined' || typeof flow.receiver_geo.lon === 'undefined') {
                console.warn('Flux ignoré en raison de coordonnées géographiques manquantes ou invalides:', flow);
                return;
            }

            const senderLatLng = [flow.sender_geo.lat, flow.sender_geo.lon];
            const receiverLatLng = [flow.receiver_geo.lat, flow.receiver_geo.lon];

            const senderMarker = L.marker(senderLatLng).addTo(currentMapView)
                .bindPopup(`<b>Émetteur:</b> ${flow.sender_name}<br>Pays: ${flow.sender_country}<br>Devise: ${flow.currency_original}`);
            const receiverMarker = L.marker(receiverLatLng).addTo(currentMapView)
                .bindPopup(`<b>Bénéficiaire:</b> ${flow.receiver_name}<br>Pays: ${flow.receiver_country}<br>Devise: ${flow.currency_original}`);

            markers.push(senderMarker, receiverMarker);

            const flowPath = [senderLatLng, receiverLatLng];
            const flowLine = L.polyline(flowPath, {
                color: flow.is_suspicious ? 'red' : 'blue',
                weight: Math.min(5, Math.max(1, (flow.amount_eur || 0) / 100000)),
                opacity: 0.7
            }).addTo(currentMapView);

            flowLine.bindPopup(`
                Montant: ${flow.amount_original} ${flow.currency_original} (${(flow.amount_eur || 0).toFixed(2)} EUR)<br>
                Type: ${flow.is_crypto ? 'Crypto' : 'Fiat'}<br>
                Suspicion: ${flow.is_suspicious ? 'Oui' : 'Non'}<br>
                Détails: ${flow.description || 'N/A'}
            `);
        });

        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            currentMapView.fitBounds(group.getBounds());
            console.log(`Carte ajustée aux bornes des ${markers.length} marqueurs.`);
        } else {
            currentMapView.setView([20, 0], 2);
            console.log('Aucun marqueur à ajuster, vue de la carte par défaut.');
        }
    }
    console.log(`loadMapData terminé pour la date: ${filterDate ? filterDate.toLocaleDateString() : 'Toutes les dates'}.`);
};

/**
 * Charge les données des affaires et configure le curseur temporel.
 * Adaptée pour la nouvelle structure { chronology: [...] }.
 */
const loadAffairesAndSetupTimeline = async () => {
    console.log('Chargement des données des affaires et configuration de la timeline...');
    try {
        const response = await fetch('/api/affaires');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const affairesData = await response.json(); // Ceci est { chronology: [...] }

        // Vérification de la nouvelle structure des données
        if (!affairesData || typeof affairesData !== 'object' || !Array.isArray(affairesData.chronology)) {
            console.error('API /api/affaires did not return expected object with chronology array:', affairesData);
            throw new Error('Données des affaires invalides reçues du serveur.');
        }
        allAffairesChronology = affairesData; // Stocke l'objet complet de la chronologie
        console.log('Données des affaires chargées:', allAffairesChronology);

        // Aplatir tous les événements des différentes années en une seule liste
        const allEvents = allAffairesChronology.chronology.flatMap(yearEntry => yearEntry.events);
        console.log(`${allEvents.length} événements trouvés pour la chronologie.`);

        const timeSlider = document.getElementById('time-slider');
        const currentDateDisplay = document.getElementById('current-date-display');
        const affaireMarkersDiv = document.getElementById('affaire-markers-on-timeline');

        // Déterminer la plage de dates min/max pour le curseur
        const eventDates = allEvents.map(e => new Date(e.timestamp));
        // Assurez-vous que vos flux financiers ont une propriété 'date' au format 'AAAA-MM-JJ'
        const flowDates = allFinancialFlows.map(f => new Date(f.date || 0)); // Utilisez 0 pour les dates non valides
        const allRelevantDates = [...eventDates, ...flowDates].filter(d => !isNaN(d.getTime())); // Filtrer les dates non valides

        minDate = allRelevantDates.length > 0 ? new Date(Math.min(...allRelevantDates)) : new Date('2016-01-01');
        maxDate = allRelevantDates.length > 0 ? new Date(Math.max(...allRelevantDates)) : new Date('2027-12-31');
        maxDate.setFullYear(maxDate.getFullYear() + 1); // Pour laisser de la marge après la dernière date connue
        console.log(`Plage de dates pour la timeline: ${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`);


        // Initialiser le curseur
        timeSlider.min = minDate.getTime();
        timeSlider.max = maxDate.getTime();
        timeSlider.value = maxDate.getTime(); // Commencer à la date la plus récente
        currentDateDisplay.textContent = new Date(parseInt(timeSlider.value)).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

        // Ajouter des marqueurs visuels pour les événements sur la timeline
        affaireMarkersDiv.innerHTML = ''; // Nettoyer les anciens marqueurs
        allEvents.forEach(event => { // Itérer sur la liste aplatie de tous les événements
            const date = new Date(event.timestamp);
            if (isNaN(date.getTime())) { // Ignorer si la date est invalide
                console.warn('Événement ignoré en raison d\'une date invalide:', event);
                return;
            }
            const position = ((date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100; // Position en %
            const marker = document.createElement('div');
            marker.style.position = 'absolute'; // Positionnement absolu pour les marqueurs
            marker.style.left = `${position}%`;
            marker.style.transform = 'translateX(-50%)';
            marker.style.width = '10px';
            marker.style.height = '10px';
            marker.style.borderRadius = '50%';
            marker.style.backgroundColor = '#e74c3c'; // Rouge pour les événements
            marker.style.cursor = 'pointer';
            marker.title = `${event.title} (${date.toLocaleDateString('fr-FR')})\n${event.description}`; // Infobulle avec titre et description
            affaireMarkersDiv.appendChild(marker);

            // Optionnel: cliquer sur le marqueur déplace le curseur
            marker.addEventListener('click', () => {
                timeSlider.value = date.getTime();
                timeSlider.dispatchEvent(new Event('input')); // Déclenche l'événement input
            });
        });
        console.log("Marqueurs d'affaires ajoutés à la timeline.");

        // Écouteur d'événements pour le curseur temporel
        timeSlider.addEventListener('input', () => {
            const selectedTimestamp = parseInt(timeSlider.value);
            const selectedDate = new Date(selectedTimestamp);
            currentDateDisplay.textContent = selectedDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            loadMapData(selectedDate); // Recharger la carte avec la date filtrée
        });

        // Charger la carte avec la date initiale du curseur (la plus récente par défaut)
        loadMapData(new Date(parseInt(timeSlider.value)));
        console.log('Chronologie des affaires et timeline configurées avec succès.');

    } catch (error) {
        console.error('Erreur lors du chargement des données des affaires ou de la chronologie:', error);
        logFrontendError({ message: 'Failed to load affaires data or setup timeline', error: error.message, component: 'Timeline' });
    }
};

const loadAlgorithmResults = async () => {
    console.log('Chargement des résultats des algorithmes...');
    try {
        const response = await fetch('/api/algorithm-detections');
        if (!response.ok) throw new Error('Network response was not ok.');
        const detections = await response.json();
        const resultsDiv = document.getElementById('algorithm-results-content');
        resultsDiv.innerHTML = '<h2>Résultats des Algorithmes de Détection</h2>';
        if (detections.length === 0) {
            resultsDiv.innerHTML += '<p>Aucune détection trouvée.</p>';
            console.log('Aucune détection algorithmique trouvée.');
            return;
        }
        const ul = document.createElement('ul');
        detections.forEach(det => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${det.type_detection}</strong> (Score: ${det.score_de_risque})<br>
                            ${det.details} (Montant: ${det.amount_eur ? det.amount_eur + ' EUR' : 'N/A'})`;
            ul.appendChild(li);
        });
        resultsDiv.appendChild(ul);
        console.log(`${detections.length} détections algorithmiques chargées.`);
    } catch (error) {
        console.error('Erreur lors du chargement des résultats des algorithmes:', error);
        logFrontendError({ message: 'Failed to load algorithm results', error: error.message, component: 'Algorithm Results' });
    }
};

const setupDataExplorer = async () => {
    console.log('Configuration de l\'explorateur de données...');
    const dataExplorerContent = document.getElementById('data-explorer-content');
    dataExplorerContent.innerHTML = '<h2>Explorateur de Données</h2><input type="text" id="data-search-input" placeholder="Rechercher des transactions ou entités..." style="width: 100%; padding: 8px; margin-bottom: 10px;">';
    const searchInput = document.getElementById('data-search-input');
    const resultsDiv = document.createElement('div');
    dataExplorerContent.appendChild(resultsDiv);

    const fetchData = async (query = '') => {
        console.log(`Recherche de données pour la requête: "${query}"`);
        try {
            const response = await fetch(`/api/data/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            resultsDiv.innerHTML = '';
            if (data.length === 0) {
                resultsDiv.innerHTML = '<p>Aucun résultat trouvé.</p>';
                console.log('Aucun résultat de recherche trouvé.');
                return;
            }
            const ul = document.createElement('ul');
            data.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.name}</strong> (${item.type}) - ${item.description || ''} ${item.amount ? `- ${item.amount} ${item.currency}` : ''}`;
                ul.appendChild(li);
            });
            resultsDiv.appendChild(ul);
            console.log(`${data.length} résultats de recherche chargés.`);
        } catch (error) {
            console.error('Erreur lors de la recherche de données:', error);
            logFrontendError({ message: 'Failed to search data', error: error.message, component: 'Data Explorer' });
        }
    };

    searchInput.addEventListener('input', () => fetchData(searchInput.value));
    fetchData(); // Charger les données initiales
    console.log('Explorateur de données configuré.');
};


// Gestion de l'activation des vues
const activateView = (viewId) => {
    console.log(`Activation de la vue: ${viewId}`);
    logUserAction({ action: 'view_activated', viewId: viewId });
    const views = document.querySelectorAll('.content-view');
    views.forEach(view => {
        view.style.display = 'none';
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
        // Si la vue activée est la carte, invalider sa taille pour s'assurer qu'elle s'affiche correctement
        if (viewId === 'flow-mapping-view' && currentMapView) {
            console.log("Vue de carte activée, appel de invalidateSize().");
            currentMapView.invalidateSize();
        }
    } else {
        console.error(`Erreur: La vue avec l'ID "${viewId}" n'a pas été trouvée dans le HTML.`);
        logFrontendError({ message: `View ID ${viewId} not found`, component: 'View Activation' });
    }


    // Logique de chargement des données spécifique à chaque vue
    switch (viewId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'flow-mapping-view': // CORRECTION: Utilisez 'flow-mapping-view' pour correspondre à l'ID HTML
            // Appeler la fonction qui charge les affaires ET configure la timeline
            // Elle appellera ensuite loadMapData avec la date par défaut du slider
            loadAffairesAndSetupTimeline();
            break;
        case 'algorithm-results':
            loadAlgorithmResults();
            break;
        case 'data-explorer':
            setupDataExplorer();
            break;
    }
};

// Initialisation du Tableau de Bord
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM entièrement chargé. Initialisation du tableau de bord...');
    mapContainer = document.getElementById('map-container'); // Initialiser mapContainer ici

    // Configuration des écouteurs d'événements pour les boutons de navigation
    // Ces IDs (nav-overview, etc.) doivent correspondre aux IDs des liens dans dashboard.html
    document.getElementById('nav-overview').addEventListener('click', () => activateView('overview'));
    document.getElementById('nav-flow-mapping').addEventListener('click', () => activateView('flow-mapping-view')); // CORRECTION: l'ID de la section est 'flow-mapping-view'
    document.getElementById('nav-algorithm-results').addEventListener('click', () => activateView('algorithm-results'));
    document.getElementById('nav-data-explorer').addEventListener('click', () => activateView('data-explorer'));

    // Activation de la vue par défaut au chargement
    activateView('overview');
    console.log('Tableau de bord initialisé.');
});