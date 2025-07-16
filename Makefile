# Define variables
NODE_ENV = development
NODE_PORT = 5144
NODE_APP = index.js

COMMANDE1_MSG="✨ Menu ✨"

work_MSG="✨ Lancement de workplan.json✨"
CTRL_MSG="✨ Lancement du contrôleur NES✨"
COMMANDE1_MSG="✨ Lancement de groq server✨"
cmd_MSG="✨ Lancement de l'application✨"
map_MSG="✨ Lancement de l'application MapAscii✨"

groq:
	@echo "${bot_MSG}"
	@./telegram/groq.js

bot:
	@echo "${bot_MSG}"
	@./models.sh

qp:
	@echo "${bot_MSG}"
	@node qp.js

ctrl:
	@echo "${CTRL_MSG}"
	@node ctrl.js

wp:
	@echo "${work_MSG}"
	@node workplan.js
map:
	@echo "${map_MSG}"
	@npm run map

# Makefile pour mapper les boutons du contrôleur NES
.PHONY: bouton_a bouton_b bouton_start bouton_select map bot

bouton_a:
	@echo "🌴 Compiling project Bouton 🅰️  .. 🌴 🌴 .."

bouton_b:
	@echo "✨ DevOps bouton 🅱️  ✨"

bouton_start:
	@echo "🔷 Starting the server...🔷 "
	@./menu.sh

bouton_select:
	@echo "💾 Pausing process or displaying status...💾 "
menu:
	@echo "Welcom To cycliq Economical system."
	@echo""
	@echo"╔═════════════════════════════════════╗     ╔═════════════════════════════════════════════════════════════════════╗"
	@echo"╠═══════════ ✨ Pi Console ═══════════╣     ║  [💫] [💬] [📚] [🌌] [✨] [⚡️] [💰] [🌴] [📱] [📡]              [🛰]║"
	@echo"║                                     ║     ╠═════════════════════════════════════════════════════════════════════╣"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"║                                     ║     ║                                                                     ║"
	@echo"╠═════════════════════════════════════╣     ╠═════════════════════════════════════════════════════════════════════╣"
	@echo"║(∏)                                  ║     ║[💻.📱]:/<                                                        /%>║"
	@echo"╚═════════════════════════════════════╝     ╚═════════════════════════════════════════════════════════════════════╝"	
	@echo""

MAGIC_TARGETS := codex build rep file script clean

dev: tasks showTasks

tasks:
	@echo "✨ Initialisation Du plan d'action✨"
	@node qp.js showTasks "/brainstrom 💰"

# Tâche Make pour ajouter une tâche
showTasks:
	@node qp.js addTask $(task)
	@cat readme.md
	@npm run start

test :
	@node qp.js

run:
	@node ./srv/srv.js

brainstorm:
	@echo "✨ Initialisation de la session de brainstorming✨"
	@node gdev.js
	@echo "✨ Session terminée✨"


all: $(MAGIC_TARGETS)

update:
	@echo "✨ Mise en état du dossier sur github✨"
	@git add .
	@git commit -m "test"
	@git push
	@echo "✨ Mise à jour terminée✨"

init: gantt phase1 phase2 phase3 phase4 phase5 phase6 phase7 phase8
# Magic COMPILER groq quantum
gantt:
	@echo "initialisation de l'instance"
	@git clone auto

seq1:
	@echo "phase de conception"
	@node mission.js

seq2:
	@echo "phase de configuration"
	@node configuration.js

seq3:
	@echo "phase d'entrainnement du model IA"
	@node models.js

seq4:
	@echo "phase de gestion et iteration du frontend"
	@git clone src.js
	
seq5:
	@echo "phase de gestion et iteration du backend"
	@node srv.js


seq6:
	@echo "phase de test et debugage"
	@node data.js

seq7:
	@echo "phase de validation documentation"
	@node models/modelcss.js

seq8:
	@echo "phase d'affiliation et contribution"
	@node models/modelcss.js

server:
	@node srv/Telegram/server.js
	@echo "Unleashing quantum Magic Mafile with every script we shape" 
# Ouvrez-vous aux dimensions cachées
clean-r:
	@echo "Returning the quantum realm to pristine state"
	@rm -rf data/* build/* src/* data/*

clean-R:
	@echo "Unweaving the fabric, a celestial fate"@rm -rf output/ build/ src/ data/

clean: clean-r clean-R