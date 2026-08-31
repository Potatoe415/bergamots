// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Restaurer l'état si existant
    const savedState = Storage.load();
    if (savedState && savedState.state !== STATES.GAME_OVER) {
        document.getElementById('btn-resume').classList.remove('hidden');
    }

    // Événements Écran d'accueil
    document.getElementById('btn-pvp').addEventListener('click', () => startGame('PVP'));
    document.getElementById('btn-pve').addEventListener('click', () => startGame('PVE'));
    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    if (window.GameHeader) {
        window.GameHeader.initOptionsPanel(
            document.getElementById('settings-button'),
            document.getElementById('settings-panel')
        );
    }

    // Événements Jeu
    UI.elements.btnRoll.addEventListener('click', () => {
        if (Engine.rollDice()) {
            UI.triggerRollAnimation(Engine);
            // La mise à jour UI se fait après l'animation
        }
    });

    UI.elements.btnBlood.addEventListener('click', () => {
        if (Engine.activateBloodPact()) {
            UI.update(Engine);
        }
    });

    UI.elements.btnEndTurn.addEventListener('click', () => {
        Engine.endTurn();
        syncUIWithState();
    });

    // Écran Interstitiel
    document.getElementById('btn-ready').addEventListener('click', () => {
        Engine.startP2Turn();
        syncUIWithState();
    });

    // Écran Résolution
    document.getElementById('btn-next-phase').addEventListener('click', () => {
        if (Engine.state === STATES.GAME_OVER) {
            Storage.clear();
            Engine.resetState();
            syncUIWithState();
        } else {
            Engine.nextRound();
            syncUIWithState();
        }
    });

    // Initialisation
    syncUIWithState();
});

function startGame(mode) {
    Engine.startGame(mode);
    syncUIWithState();
}

function resumeGame() {
    const savedState = Storage.load();
    if (Engine.loadState(savedState)) {
        syncUIWithState();
    }
}

function syncUIWithState() {
    switch (Engine.state) {
        case STATES.HOME:
            UI.showScreen('home');
            break;
            
        case STATES.P1_TURN:
            UI.showScreen('game');
            UI.update(Engine);
            break;
            
        case STATES.INTERSTITIAL:
            UI.showScreen('interstitial');
            break;
            
        case STATES.P2_TURN:
            UI.showScreen('game');
            UI.update(Engine);
            if (Engine.mode === 'PVE') {
                Engine.playBotTurn(() => {
                    UI.update(Engine);
                    if (Engine.state !== STATES.P2_TURN) {
                        syncUIWithState();
                    }
                });
            }
            break;
            
        case STATES.RESOLUTION:
        case STATES.GAME_OVER:
            UI.showResolution(Engine);
            break;
    }
}
