// server.js
require('dotenv').config(); // Charge les variables d'environnement depuis .env

const express = require('express');
const path = require('path');
const fs = require('fs/promises'); // Pour lire/écrire des fichiers de manière asynchrone
const Groq = require('groq-sdk');
// --- AJOUTS POUR SWAGGER ---
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs'); // Assurez-vous d'avoir installé 'yamljs'
// Chemin vers le fichier swagger.yaml
const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
const swaggerDocument = YAML.load(swaggerDocumentPath); // Charge le fichier YAML
// --- FIN AJOUTS POUR SWAGGER ---


const app = express();
const port = process.env.PORT || 3000;

// Chemin vers les fichiers de log
const APP_LOG_FILE_PATH = path.join(__dirname, 'app_logs.json');
const CHATBOT_LOG_FILE_PATH = path.join(__dirname, 'log.json');
const FINANCIAL_FLOWS_FILE_PATH = path.join(__dirname, 'financial_flows.json');
const AFFAIRES_FILE_PATH = path.join(__dirname, 'affaires.json');
const PETITIONS_FILE_PATH = path.join(__dirname, 'petitions.json');
const DEFAILLANCES_FILE_PATH = path.join(__dirname, 'defaillances_republique.json');
const IA_ANALYSIS_LOG_FILE_PATH = path.join(__dirname, 'ia_analysis_logs.json');

// --- Variables pour la gestion de la file d'attente des logs d'application ---
let appLogQueue = [];
let isWritingAppLog = false;

// --- Variables pour la gestion de la file d'attente des flux financiers (similaire aux logs) ---
let financialFlowsQueue = [];
let isWritingFinancialFlows = false;

// --- Variables pour la gestion de la file d'attente des logs d'analyse IA ---
let iaAnalysisLogQueue = [];
let isWritingIaAnalysisLog = false;


// Initialisation du client Groq avec votre clé API
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Middleware pour parser le JSON des requêtes
app.use(express.json());

// --- Middleware pour servir les fichiers statiques ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/roles', express.static(path.join(__dirname, 'public', 'roles')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Fonctions d'aide pour la gestion des logs d'application ---
async function readAppLogFile() {
    try {
        const data = await fs.readFile(APP_LOG_FILE_PATH, { encoding: 'utf8' });
        if (data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Fichier de log ${APP_LOG_FILE_PATH} non trouvé. Création d'un nouveau fichier.`);
            await fs.writeFile(APP_LOG_FILE_PATH, '[]', { encoding: 'utf8' });
            return [];
        }
        console.error(`Erreur de parsing de ${APP_LOG_FILE_PATH}, réinitialisation du fichier.`, error);
        await fs.writeFile(APP_LOG_FILE_PATH, '[]', { encoding: 'utf8' });
        return [];
    }
}

async function appendToAppLog(entry) {
    appLogQueue.push({ timestamp: new Date().toISOString(), ...entry });
    if (!isWritingAppLog) {
        processAppLogQueue();
    }
}

async function processAppLogQueue() {
    if (appLogQueue.length === 0 || isWritingAppLog) {
        return;
    }

    isWritingAppLog = true;
    try {
        const logs = await readAppLogFile();
        while (appLogQueue.length > 0) {
            const entry = appLogQueue.shift();
            logs.push(entry);
        }
        await fs.writeFile(APP_LOG_FILE_PATH, JSON.stringify(logs, null, 2), { encoding: 'utf8' });
    } catch (error) {
        console.error('Erreur critique lors de l\'écriture du fichier app_logs.json:', error);
    } finally {
        isWritingAppLog = false;
        if (appLogQueue.length > 0) {
            processAppLogQueue();
        }
    }
}

// --- Fonctions d'aide pour la gestion des flux financiers ---
async function readFinancialFlowsFile() {
    try {
        const data = await fs.readFile(FINANCIAL_FLOWS_FILE_PATH, { encoding: 'utf8' });
        let parsedData;
        if (data.trim() === '') {
            parsedData = [];
        } else {
            parsedData = JSON.parse(data);
        }

        if (!Array.isArray(parsedData)) {
            console.warn(`Contenu du fichier ${FINANCIAL_FLOWS_FILE_PATH} n'est pas un tableau. Réinitialisation du fichier.`);
            await fs.writeFile(FINANCIAL_FLOWS_FILE_PATH, '[]', { encoding: 'utf8' });
            return [];
        }

        return parsedData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Fichier de flux financiers ${FINANCIAL_FLOWS_FILE_PATH} non trouvé. Création d'un nouveau fichier.`);
            await fs.writeFile(FINANCIAL_FLOWS_FILE_PATH, '[]', { encoding: 'utf8' });
            return [];
        }
        console.error(`Erreur de parsing de ${FINANCIAL_FLOWS_FILE_PATH}, réinitialisation du fichier.`, error);
        await fs.writeFile(FINANCIAL_FLOWS_FILE_PATH, '[]', { encoding: 'utf8' });
        return [];
    }
}

async function appendFinancialFlow(flowEntry) {
    financialFlowsQueue.push(flowEntry);
    if (!isWritingFinancialFlows) {
        processFinancialFlowsQueue();
    }
}

async function processFinancialFlowsQueue() {
    if (financialFlowsQueue.length === 0 || isWritingFinancialFlows) {
        return;
    }

    isWritingFinancialFlows = true;
    try {
        const flows = await readFinancialFlowsFile();
        while (financialFlowsQueue.length > 0) {
            const entry = financialFlowsQueue.shift();
            flows.push(entry);
        }
        await fs.writeFile(FINANCIAL_FLOWS_FILE_PATH, JSON.stringify(flows, null, 2), { encoding: 'utf8' });
    } catch (error) {
        console.error('Erreur critique lors de l\'écriture du fichier financial_flows.json:', error);
    } finally {
        isWritingFinancialFlows = false;
        if (financialFlowsQueue.length > 0) {
            processFinancialFlowsQueue();
        }
    }
}

// --- Fonctions d'aide pour la gestion des logs d'analyse IA ---
async function readIaAnalysisLogFile() {
    try {
        const data = await fs.readFile(IA_ANALYSIS_LOG_FILE_PATH, { encoding: 'utf8' });
        if (data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Fichier de log IA ${IA_ANALYSIS_LOG_FILE_PATH} non trouvé. Création d'un nouveau fichier.`);
            await fs.writeFile(IA_ANALYSIS_LOG_FILE_PATH, '[]', { encoding: 'utf8' });
            return [];
        }
        console.error(`Erreur de parsing de ${IA_ANALYSIS_LOG_FILE_PATH}, réinitialisation du fichier.`, error);
        await fs.writeFile(IA_ANALYSIS_LOG_FILE_PATH, '[]', { encoding: 'utf8' });
        return [];
    }
}

async function appendToIaAnalysisLog(entry) {
    iaAnalysisLogQueue.push({ timestamp: new Date().toISOString(), ...entry });
    if (!isWritingIaAnalysisLog) {
        processIaAnalysisLogQueue();
    }
}

async function processIaAnalysisLogQueue() {
    if (iaAnalysisLogQueue.length === 0 || isWritingIaAnalysisLog) {
        return;
    }

    isWritingIaAnalysisLog = true;
    try {
        const logs = await readIaAnalysisLogFile();
        while (iaAnalysisLogQueue.length > 0) {
            const entry = iaAnalysisLogQueue.shift();
            logs.push(entry);
        }
        await fs.writeFile(IA_ANALYSIS_LOG_FILE_PATH, JSON.stringify(logs, null, 2), { encoding: 'utf8' });
    } catch (error) {
        console.error('Erreur critique lors de l\'écriture du fichier ia_analysis_logs.json:', error);
    } finally {
        isWritingIaAnalysisLog = false;
        if (iaAnalysisLogQueue.length > 0) {
            processIaAnalysisLogQueue();
        }
    }
}

// --- Fonctions de lecture pour les autres données ---
async function readAffairesFile() {
    try {
        const data = await fs.readFile(AFFAIRES_FILE_PATH, { encoding: 'utf8' });
        let parsedData;
        if (data.trim() === '') {
            parsedData = { chronology: [] };
        } else {
            parsedData = JSON.parse(data);
        }

        if (!parsedData || typeof parsedData !== 'object' || !Array.isArray(parsedData.chronology)) {
            console.warn(`Contenu du fichier ${AFFAIRES_FILE_PATH} n'est pas au format attendu. Réinitialisation.`);
            await fs.writeFile(AFFAIRES_FILE_PATH, JSON.stringify({ chronology: [] }, null, 2), { encoding: 'utf8' });
            return { chronology: [] };
        }
        return parsedData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Fichier des affaires ${AFFAIRES_FILE_PATH} non trouvé. Création.`);
            await fs.writeFile(AFFAIRES_FILE_PATH, JSON.stringify({ chronology: [] }, null, 2), { encoding: 'utf8' });
            return { chronology: [] };
        }
        console.error(`Erreur de parsing de ${AFFAIRES_FILE_PATH}, réinitialisation.`, error);
        await fs.writeFile(AFFAIRES_FILE_PATH, JSON.stringify({ chronology: [] }, null, 2), { encoding: 'utf8' });
        return { chronology: [] };
    }
}

async function readPetitionsFile() {
    try {
        const data = await fs.readFile(PETITIONS_FILE_PATH, { encoding: 'utf8' });
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier petitions.json n\'existe pas, retournant un tableau vide.');
            return [];
        }
        console.error('Erreur de lecture ou de parsing de petitions.json:', error);
        throw error;
    }
}

async function readDefaillancesFile() {
    try {
        const data = await fs.readFile(DEFAILLANCES_FILE_PATH, { encoding: 'utf8' });
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Le fichier des défaillances ${DEFAILLANCES_FILE_PATH} n'existe pas, retournant un objet vide.`);
            return {};
        }
        console.error(`Erreur de lecture ou de parsing de ${DEFAILLANCES_FILE_PATH}:`, error);
        throw error;
    }
}


// --- Middleware de Monitoring des Requêtes Serveur ---
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000;

        const logEntry = {
            type: 'server_access',
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration.toFixed(2),
            ip: req.ip
        };
        console.log(`[ACCES SERVEUR] ${logEntry.method} ${logEntry.path} - ${logEntry.statusCode} (${logEntry.durationMs}ms)`);
        appendToAppLog(logEntry).catch(err => console.error('Erreur lors du log d\'accès serveur (non-critique):', err));
    });
    next();
});

// --- Endpoints API pour les logs Frontend (Monitoring) ---
app.post('/api/log/frontend-error', async (req, res) => {
    try {
        await appendToAppLog({ type: 'frontend_error', ...req.body });
        res.status(200).send('Frontend error logged');
    } catch (error) {
        console.error('Erreur lors de la réception du log d\'erreur frontend:', error);
        res.status(500).send('Failed to log frontend error');
    }
});

app.post('/api/log/performance', async (req, res) => {
    try {
        await appendToAppLog({ type: 'frontend_performance', ...req.body });
        res.status(200).send('Frontend performance logged');
    } catch (error) {
        console.error('Erreur lors de la réception des métriques de performance frontend:', error);
        res.status(500).send('Failed to log performance metrics');
    }
});

app.post('/api/log/user-action', async (req, res) => {
    try {
        await appendToAppLog({ type: 'user_action', ...req.body });
        res.status(200).send('User action logged');
    } catch (error) {
        console.error('Erreur lors de la réception de l\'action utilisateur frontend:', error);
        res.status(500).send('Failed to log user action');
    }
});

// --- Fonctions de Logique Métier (Interaction avec le LLM) ---
async function getLlmResponse(systemPrompt, userMessage, conversationHistory = [], model = 'llama3-8b-8192') {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(entry => ({
                role: entry.role === 'user' ? 'user' : 'assistant',
                content: entry.message
            })),
            { role: 'user', content: userMessage }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stop: null,
            stream: false,
        });

        const responseContent = chatCompletion.choices[0]?.message?.content || "";
        await appendToAppLog({
            type: 'llm_response',
            model: model,
            prompt: userMessage,
            response_length: responseContent.length
        });
        return responseContent;

    } catch (error) {
        console.error("Erreur lors de l'appel au LLM:", error);
        await appendToAppLog({
            type: 'llm_error',
            prompt: userMessage,
            error_message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// --- Logique API du Chatbot (mise à jour pour le nouveau rôle et enregistrement) ---
app.post('/api/chat', async (req, res) => {
    const { message, role, history, sectorKey } = req.body;
    if (!message || !role) {
        return res.status(400).json({ error: 'Message et rôle sont requis.' });
    }

    let systemPrompt;
    let modelToUse = 'llama3-8b-8192';

    // Définition des prompts système et des modèles spécifiques par rôle
    switch (role) {
        case 'journaliste':
            systemPrompt = 'Vous êtes un journaliste d\'investigation expérimenté. Votre objectif est de découvrir des informations exclusives, de poser des questions incisives et de révéler la vérité, même si elle est dérangeante. Vous êtes neutre mais déterminé.';
            break;
        case 'avocat':
            systemPrompt = 'Vous êtes un avocat spécialisé en droit public et administratif. Vous défendez les intérêts de votre client avec rigueur, en fournissant des conseils juridiques pertinents et en analysant les situations sous l\'angle légal. Votre expertise est votre force.';
            break;
        case 'juge':
            systemPrompt = 'Vous êtes un juge impartial et respectueux du droit. Votre rôle est de vous prononcer sur la légalité des actions, d\'interpréter la loi et de garantir l\'équité du processus. Vos décisions sont fondées sur les faits et le droit.';
            break;
        case 'chroniqueur':
            systemPrompt = 'Vous êtes un chroniqueur judiciaire reconnu. Vous fournissez des analyses pointues et des commentaires éclairés sur les enquêtes en cours, en apportant un recul critique et une perspective au public. Vous simplifiez les concepts complexes sans les dénaturer.';
            break;
        case 'enquêteur':
            systemPrompt = 'Vous êtes un enquêteur méticuleux et persévérant. Vous menez l\'enquête, recherchez des preuves, interrogez les témoins et recoupez les informations pour établir la vérité des faits. Votre rigueur est essentielle.';
            break;
        case 'analyste_defaillances': // Rôle d'analyse spécifique
            modelToUse = 'gemma2-9b-it'; // Utilise le modèle gemma2-9b-it pour ce rôle

            let existingAnalyses = [];
            if (sectorKey) {
                // Tente de récupérer les analyses précédentes pour ce secteur
                const allIaLogs = await readIaAnalysisLogFile();
                existingAnalyses = allIaLogs.filter(log => log.sector === sectorKey);
            }

            systemPrompt = `Vous êtes un analyste spécialisé dans l'examen des défaillances structurelles de la Ve République et de la fonction publique française. Votre rôle est de fournir des analyses objectives, d'expliquer les mécanismes de ces dysfonctionnements et de discuter de leurs impacts sur la société civile. Vous vous basez sur des faits connus et des analyses critiques.`;
            
            // Ajout du contexte des analyses passées si disponibles
            if (existingAnalyses.length > 0) {
                systemPrompt += `\n\nPour référence et pour améliorer la cohérence, la profondeur ou la présentation, voici des exemples d'analyses précédemment générées pour le secteur "${sectorKey}" :`;
                existingAnalyses.slice(-3).forEach((analysis, index) => { // Prend les 3 dernières analyses pour ne pas surcharger le contexte
                    systemPrompt += `\n\n--- Exemple d'analyse #${index + 1} (datée du ${new Date(analysis.timestamp).toLocaleDateString()}) ---\n`;
                    systemPrompt += analysis.generated_analysis;
                });
                systemPrompt += `\n\nEn vous basant sur ces exemples (si pertinents), veuillez générer une nouvelle analyse améliorée pour la requête suivante :`;
            } else {
                systemPrompt += `\n\nVeuillez générer l'analyse pour la requête suivante :`;
            }
            break;
        default:
            systemPrompt = `Vous êtes un assistant IA simulant un ${role} dans une enquête parlementaire. Votre objectif est de répondre aux questions de l'utilisateur du point de vue de ce rôle. Ne sortez jamais de votre rôle.`;
            break;
    }

    try {
        const llmResponse = await getLlmResponse(systemPrompt, message, history, modelToUse);
        
        const logEntry = {
            role: role,
            user_message: message,
            llm_response: llmResponse,
            model_used: modelToUse,
            timestamp: new Date().toISOString()
        };

        await appendToChatbotLog(logEntry); // Log général du chatbot

        // --- Enregistrement spécifique pour le rôle d'Analyste des Défaillances ---
        if (role === 'analyste_defaillances' && sectorKey) {
            const iaAnalysisEntry = {
                sector: sectorKey,
                prompt: message,
                generated_analysis: llmResponse,
                model: modelToUse,
                timestamp: new Date().toISOString()
            };
            await appendToIaAnalysisLog(iaAnalysisEntry);
        }

        res.json({ response: llmResponse });
    } catch (error) {
        console.error('Erreur lors du traitement de la requête chat:', error);
        res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
        const logs = await readChatbotLogFile();
        res.json(logs);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier de log du chatbot:', error);
        res.status(500).json({ error: 'Impossible de lire les logs du chatbot.' });
    }
});

app.get('/api/ia-analysis-logs', async (req, res) => {
    try {
        const logs = await readIaAnalysisLogFile();
        res.json(logs);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier de log d\'analyse IA:', error);
        res.status(500).json({ error: 'Impossible de lire les logs d\'analyse IA.' });
    }
});

async function readChatbotLogFile() {
    try {
        const data = await fs.readFile(CHATBOT_LOG_FILE_PATH, { encoding: 'utf8' });
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Erreur de parsing du log.json (chatbot), réinitialisation du fichier.', error);
        await fs.writeFile(CHATBOT_LOG_FILE_PATH, '[]', { encoding: 'utf8' });
        return [];
    }
}

async function appendToChatbotLog(entry) {
    const logs = await readChatbotLogFile();
    logs.push(entry);
    await fs.writeFile(CHATBOT_LOG_FILE_PATH, JSON.stringify(logs, null, 2), { encoding: 'utf8' });
}


// --- ENDPOINTS API POUR LE TABLEAU DE BORD (inchangés) ---

app.get('/api/dashboard/summary', (req, res) => {
    res.json({
        totalTransactions: 15432,
        activeAlerts: 45,
        riskyEntities: 8
    });
});

app.get('/api/financial-flows', async (req, res) => {
    try {
        const flows = await readFinancialFlowsFile();
        res.json(flows);
    } catch (error) {
        console.error('Erreur lors de la lecture des flux financiers:', error);
        res.status(500).json({ error: 'Impossible de lire les flux financiers.' });
    }
});

app.post('/api/financial-flows', async (req, res) => {
    const newFlow = req.body;

    if (!newFlow || typeof newFlow !== 'object') {
        return res.status(400).json({ error: 'Données de flux invalides.' });
    }

    if (!newFlow.id) {
        newFlow.id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
        await appendFinancialFlow(newFlow);
        res.status(201).json({ message: 'Flux financier ajouté avec succès.', flow: newFlow });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du flux financier:', error);
        res.status(500).json({ error: 'Impossible d\'ajouter le flux financier.' });
    }
});

app.get('/api/algorithm-detections', (req, res) => {
    const mockDetections = [
        {
            id: 'alert_001',
            transaction_id: 'txn_004',
            type_detection: 'Transfert Grand Montant vers Juridiction à Risque',
            score_de_risque: 0.85,
            amount_eur: 118000,
            currency_original: 'GBP',
            involved_countries: ['UK', 'Cyprus'],
            details: 'Transfert important de GBP vers une société fiduciaire à Chypre.'
        },
        {
            id: 'alert_002',
            transaction_id: 'txn_002',
            type_detection: 'Conversion Fiat-Crypto-Fiat Rapide',
            score_de_risque: 0.78,
            amount_eur: 125000,
            currency_original: 'BTC',
            involved_countries: ['UK', 'Netherlands'],
            details: 'Achat de BTC suivi d\'une revente rapide. Possible blanchiment.'
        },
        {
            id: 'alert_003',
            entity_id: 'ent_offshore_uk',
            type_detection: 'Multiples Transactions Crypto Anonymes',
            score_de_risque: 0.92,
            amount_eur: null,
            currency_original: null,
            involved_countries: ['UK', 'N/A'],
            details: 'L\'entité reçoit fréquemment des cryptomonnaies de sources non identifiées.'
        },
    ];
    res.json(mockDetections);
});

app.get('/api/data/search', (req, res) => {
    const query = req.query.query ? req.query.query.toLowerCase() : '';
    const mockData = [
        { id: 'txn_001', name: 'Transaction Fournisseur FR', type: 'Transaction', amount: 50000, currency: 'EUR', description: 'Paiement services logiciels' },
        { id: 'ent_offshore_uk', name: 'Offshore Co. UK', type: 'Entité', country: 'UK', sector: 'Holding', description: 'Société de services financiers offshore' },
        { id: 'txn_002', name: 'Achat Crypto BTC', type: 'Transaction Crypto', amount: 2.5, currency: 'BTC', description: 'Achat Bitcoin depuis bourse' },
        { id: 'addr_btc_xyz', name: 'Adresse Bitcoin Anonyme XYZ', type: 'Adresse Crypto', description: 'Adresse Bitcoin non KYC' },
    ];

    const results = mockData.filter(item =>
        item.id.toLowerCase().includes(query) ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.type && item.type.toLowerCase().includes(query))
    );
    res.json(results);
});

app.get('/api/affaires', async (req, res) => {
    try {
        const affaires = await readAffairesFile();
        res.json(affaires);
    } catch (error) {
        console.error('Erreur lors de la lecture des affaires:', error);
        res.status(500).json({ error: 'Impossible de lire les données des affaires.' });
    }
});

app.get('/api/petitions', async (req, res) => {
    try {
        const petitions = await readPetitionsFile();
        res.json(petitions);
    } catch (error) {
        console.error('Erreur lors de la lecture des pétitions:', error);
        res.status(500).json({ error: 'Impossible de lire les données des pétitions.' });
    }
});

app.get('/api/defaillances', async (req, res) => {
    try {
        const defaillances = await readDefaillancesFile();
        res.json(defaillances);
    }
    catch (error) {
        console.error('Erreur lors de la lecture des défaillances de la République:', error);
        res.status(500).json({ error: 'Impossible de lire les données des défaillances.' });
    }
});

app.get('/api/defaillances/:secteur', async (req, res) => {
    const secteur = req.params.secteur.toLowerCase();
    try {
        const defaillances = await readDefaillancesFile();
        if (defaillances[secteur]) {
            res.json(defaillances[secteur]);
        } else {
            res.status(404).json({ error: `Secteur '${secteur}' non trouvé.` });
        }
    } catch (error) {
        console.error(`Erreur lors de la lecture des défaillances pour le secteur ${secteur}:`, error);
        res.status(500).json({ error: 'Impossible de lire les données pour ce secteur.' });
    }
});

// --- Démarrage du serveur ---
app.listen(port, () => {
    console.log(`Serveur d'enquête parlementaire démarré sur http://localhost:${port}`);
    console.log(`Accédez à l'application via votre navigateur à http://localhost:${port}`);
    console.log(`Endpoints API pour le chatbot: /api/chat (POST), /api/logs (GET)`);
    console.log(`Endpoints de monitoring: /api/log/frontend-error (POST), /api/log/performance (POST), /api/log/user-action (POST)`);
    console.log(`Endpoints du Tableau de Bord:`);
    console.log(`  - /api/dashboard/summary (GET)`);
    console.log(`  - /api/financial-flows (GET) - Maintenant depuis financial_flows.json`);
    console.log(`  - /api/financial-flows (POST) - POUR AJOUTER un nouveau flux`);
    console.log(`  - /api/algorithm-detections (GET)`);
    console.log(`  - /api/data/search (GET)`);
    console.log(`  - /api/affaires (GET)`);
    console.log(`  - /api/petitions (GET)`);
    console.log(`  - /api/defaillances (GET) - Toutes les défaillances par secteur`);
    console.log(`  - /api/defaillances/:secteur (GET) - Détail d'un secteur spécifique`);
    console.log(`  - /api/ia-analysis-logs (GET) - Logs des analyses IA générées`);
    console.log(`N'oubliez pas de créer un fichier .env avec GROQ_API_KEY=votre_clé_api...`);
});