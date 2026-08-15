// js/ui.js

const UI = {
    screens: {
        home: document.getElementById('screen-home'),
        game: document.getElementById('screen-game'),
        interstitial: document.getElementById('screen-interstitial'),
        resolution: document.getElementById('screen-resolution')
    },
    
    elements: {
        diceP1: document.getElementById('dice-p1'),
        diceP2: document.getElementById('dice-p2'),
        
        hpFillP1: document.getElementById('hp-fill-p1'),
        hpFillP2: document.getElementById('hp-fill-p2'),
        hpTextP1: document.getElementById('hp-text-p1'),
        hpTextP2: document.getElementById('hp-text-p2'),
        
        nameP1: document.getElementById('name-p1'),
        nameP2: document.getElementById('name-p2'),
        
        rageP1: document.getElementById('rage-p1').children,
        rageP2: document.getElementById('rage-p2').children,
        
        shieldP1: document.getElementById('shield-p1'),
        shieldP2: document.getElementById('shield-p2'),
        bloodP1: document.getElementById('blood-p1'),
        bloodP2: document.getElementById('blood-p2'),
        
        turnIndicator: document.getElementById('turn-indicator'),
        actionLog: document.getElementById('action-log'),
        rollsLeft: document.getElementById('rolls-left'),
        
        btnRoll: document.getElementById('btn-roll'),
        btnBlood: document.getElementById('btn-blood'),
        btnEndTurn: document.getElementById('btn-end-turn'),
        
        charP1: document.getElementById('char-p1'),
        charP2: document.getElementById('char-p2'),
        damageP1: document.getElementById('damage-p1'),
        damageP2: document.getElementById('damage-p2'),

        resolutionTitle: document.getElementById('resolution-title'),
        resolutionDetails: document.getElementById('resolution-details')
    },

    showScreen(screenId) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[screenId].classList.add('active');
        
        // Reset characters when returning home or starting
        if (screenId === 'home') {
             this.setCharState('p1', 'idle');
             this.setCharState('p2', 'idle');
             this.updateDegradation('p1', 12);
             this.updateDegradation('p2', 12);
        }
    },

    update(engine) {
        // MAJ Noms selon mode
        this.elements.nameP2.textContent = engine.mode === 'PVE' ? 'Bot' : 'Joueur 2';
        
        // MAJ Jauges et Stats
        this.updatePlayerStats('p1', engine.p1);
        this.updatePlayerStats('p2', engine.p2);
        
        // MAJ Dés
        this.renderDice(engine, 'p1');
        this.renderDice(engine, 'p2');
        
        // MAJ Personnages (Animation de respiration)
        this.elements.charP1.classList.add('char-bounce');
        this.elements.charP2.classList.add('char-bounce');

        // MAJ Degradation
        this.updateDegradation('p1', engine.p1.hp);
        this.updateDegradation('p2', engine.p2.hp);

        // MAJ Contrôles et Textes Centraux
        if (engine.state === STATES.P1_TURN) {
            this.elements.turnIndicator.textContent = "Tour de Joueur 1";
            this.elements.actionLog.textContent = `Lancers restants : ${engine.rollsLeft}`;
            this.enableControls(engine);
            this.setCharState('p1', 'idle');
        } else if (engine.state === STATES.P2_TURN) {
            this.elements.turnIndicator.textContent = engine.mode === 'PVE' ? "Tour du Bot..." : "Tour de Joueur 2";
            this.elements.actionLog.textContent = `Lancers restants : ${engine.rollsLeft}`;
            if (engine.mode === 'PVE') {
                this.disableControls();
            } else {
                this.enableControls(engine);
            }
            this.setCharState('p2', 'idle');
        }
    },

    setCharState(playerId, state) {
        const charImg = this.elements[`char${playerId.toUpperCase()}`];
        if (!charImg) return;
        
        charImg.src = `assets/${playerId}_${state}.svg`;
        
        // Classes d'animation
        charImg.classList.remove('char-hit', 'char-attack-p1', 'char-attack-p2');
        if (state === 'hit') charImg.classList.add('char-hit');
        if (state === 'attack') charImg.classList.add(`char-attack-${playerId}`);
    },

    updateDegradation(playerId, hp) {
        const charImg = this.elements[`char${playerId.toUpperCase()}`];
        if (!charImg) return;
        
        const loss = 12 - hp;
        
        // Effet de décomposition granulaire (12 étapes)
        // 1. Filtres visuels
        const opacity = Math.max(0.1, 1 - (loss * 0.07));
        const grayscale = Math.min(100, loss * 9);
        const blur = Math.min(3, loss * 0.25);
        const sepia = Math.min(50, loss * 4);
        
        charImg.style.filter = `opacity(${opacity}) grayscale(${grayscale}%) blur(${blur}px) sepia(${sepia}%)`;
        
        // 2. Déformation physique
        const scaleY = Math.max(0.4, 1 - (loss * 0.04));
        const skewX = (loss > 6) ? (loss - 6) * 2 : 0;
        charImg.style.transform = `scaleY(${scaleY}) skewX(${skewX}deg)`;

        // 3. Animation de tremblement si PV bas
        charImg.classList.remove('flicker');
        if (hp <= 3) {
            charImg.classList.add('flicker');
        }
    },

    showDamagePopup(playerId, amount) {
        const popup = this.elements[`damage${playerId.toUpperCase()}`];
        if (!popup) return;
        
        popup.textContent = `-${amount}`;
        popup.classList.remove('show-damage');
        void popup.offsetWidth; // Trigger reflow
        popup.classList.add('show-damage');
    },

    updatePlayerStats(playerId, state) {
        const fill = this.elements[`hpFill${playerId.toUpperCase()}`];
        const text = this.elements[`hpText${playerId.toUpperCase()}`];
        const rageDots = this.elements[`rage${playerId.toUpperCase()}`];
        
        // HP
        const hpPercent = Math.max(0, (state.hp / 12) * 100);
        fill.style.width = `${hpPercent}%`;
        text.textContent = `${state.hp}/12`;
        
        // Couleur jauge si bas HP
        if (state.hp <= 4) fill.style.backgroundColor = 'var(--danger-color)';
        else fill.style.backgroundColor = 'var(--primary-color)';

        // Rage
        for (let i = 0; i < 3; i++) {
            if (i < state.rage) rageDots[i].classList.add('filled');
            else rageDots[i].classList.remove('filled');
        }

        // Status
        this.elements[`shield${playerId.toUpperCase()}`].classList.toggle('hidden', !state.shield);
        this.elements[`blood${playerId.toUpperCase()}`].classList.toggle('hidden', !state.bloodPact);
    },

    renderDice(engine, playerId) {
        const container = this.elements[`dice${playerId.toUpperCase()}`];
        container.innerHTML = '';
        
        const state = engine[playerId];
        const isActivePlayer = (playerId === engine.activePlayer);
        
        state.dice.forEach(d => {
            const dieEl = document.createElement('div');
            dieEl.className = 'die';
            dieEl.dataset.id = d.id;
            
            if (d.kept) dieEl.classList.add('kept');
            
            // Logique de masquage
            // Un dé est caché SEULEMENT pour l'adversaire
            let isHiddenToViewer = d.hidden && !isActivePlayer; 
            
            // Exception : pendant la résolution, tout est révélé
            if (engine.state === STATES.RESOLUTION) {
                isHiddenToViewer = false;
            }

            if (isHiddenToViewer) {
                dieEl.classList.add('hidden-die');
                dieEl.textContent = '?';
            } else {
                dieEl.textContent = d.value;
                if (d.hidden) {
                    // C'est mon dé caché, je vois sa valeur mais j'ai un indicateur visuel
                    dieEl.style.borderColor = 'var(--accent-color)';
                }
            }

            // Écouteur de clic (seulement si c'est notre tour et qu'il reste des lancers)
            if (isActivePlayer && engine.mode === 'PVP' || (isActivePlayer && engine.mode === 'PVE' && playerId === 'p1')) {
                if (engine.rollsLeft < 3 && engine.rollsLeft > 0) {
                     dieEl.addEventListener('click', () => {
                         if(engine.toggleKeepDie(d.id)) {
                             this.update(engine);
                         }
                     });
                }
            }
            
            container.appendChild(dieEl);
        });
    },

    enableControls(engine) {
        const { btnRoll, btnBlood, btnEndTurn, rollsLeft } = this.elements;
        
        rollsLeft.textContent = engine.rollsLeft;
        
        if (engine.rollsLeft > 0) {
            btnRoll.disabled = false;
            btnRoll.classList.remove('hidden');
        } else {
            btnRoll.disabled = true;
            btnRoll.classList.add('hidden');
        }

        // Pacte de Sang
        if (engine.rollsLeft === 1 && !engine[engine.activePlayer].bloodPact && engine[engine.activePlayer].hp > 2) {
            btnBlood.classList.remove('hidden');
        } else {
            btnBlood.classList.add('hidden');
        }

        // Terminer (visible si plus de lancers ou si au moins un lancer effectué)
        if (engine.rollsLeft < 3) {
            btnEndTurn.classList.remove('hidden');
        } else {
            btnEndTurn.classList.add('hidden');
        }
    },

    disableControls() {
        this.elements.btnRoll.disabled = true;
        this.elements.btnBlood.classList.add('hidden');
        this.elements.btnEndTurn.classList.add('hidden');
    },

    async showResolution(engine) {
        // Phase d'animation avant d'afficher le texte
        const res = engine.lastResolution;
        
        // Attaque P1 ?
        if (res.p1.dmgDealt > 0) {
            this.setCharState('p1', 'attack');
            setTimeout(() => {
                this.setCharState('p2', 'hit');
                this.showDamagePopup('p2', res.p1.dmgDealt);
                this.updateDegradation('p2', engine.p2.hp);
            }, 300);
            await new Promise(r => setTimeout(r, 1000));
        }
        
        // Attaque P2 ?
        if (res.p2.dmgDealt > 0) {
            this.setCharState('p2', 'attack');
            setTimeout(() => {
                this.setCharState('p1', 'hit');
                this.showDamagePopup('p1', res.p2.dmgDealt);
                this.updateDegradation('p1', engine.p1.hp);
            }, 300);
            await new Promise(r => setTimeout(r, 1000));
        }

        this.showScreen('resolution');
        
        let html = '';
        
        const addLine = (playerStr, combo, dmg, heal) => {
            let line = `<strong>${playerStr}</strong> : ${combo}`;
            if (dmg > 0) line += ` <br><span class="damage-text">Attaque : ${dmg} dégâts</span>`;
            if (heal > 0) line += ` <br><span class="heal-text">Soins : +${heal} PV</span>`;
            if (dmg === 0 && heal === 0 && combo !== 'Explosion de Rage !') line += ` <br><span style="color:var(--text-secondary)">Aucun dégât. +1 Rage.</span>`;
            return `<div class="res-line">${line}</div>`;
        };
        
        html += addLine('Joueur 1', res.p1.combo, res.p1.dmgDealt, res.p1.heal);
        const p2Name = engine.mode === 'PVE' ? 'Bot' : 'Joueur 2';
        html += addLine(p2Name, res.p2.combo, res.p2.dmgDealt, res.p2.heal);
        
        this.elements.resolutionDetails.innerHTML = html;
        
        if (engine.state === STATES.GAME_OVER) {
            this.elements.resolutionTitle.textContent = "Partie Terminée !";
            const winner = engine.p1.hp > 0 ? "Joueur 1 gagne !" : (engine.p2.hp > 0 ? `${p2Name} gagne !` : "Égalité !");
            this.elements.resolutionDetails.innerHTML += `<div style="font-size:1.5rem; color:var(--primary-dark); margin-top:24px; text-align:center;">${winner}</div>`;
            document.getElementById('btn-next-phase').textContent = "Retour à l'accueil";
        } else {
            this.elements.resolutionTitle.textContent = "Résultat de la manche";
            document.getElementById('btn-next-phase').textContent = "Manche suivante";
        }
    },

    triggerRollAnimation(engine) {
        const playerId = engine.activePlayer;
        const container = this.elements[`dice${playerId.toUpperCase()}`];
        const diceEls = container.querySelectorAll('.die:not(.kept)');
        const charImg = this.elements[`char${playerId.toUpperCase()}`];
        
        diceEls.forEach(d => d.classList.add('rolling'));
        if (charImg) charImg.classList.add('char-rolling');
        
        setTimeout(() => {
            diceEls.forEach(d => d.classList.remove('rolling'));
            if (charImg) charImg.classList.remove('char-rolling');
            this.update(engine);
        }, 600);
    }
};
