// js/storage.js
const STORAGE_KEY = 'diceduel_state';

const Storage = {
    save: function(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde du jeu", e);
        }
    },
    
    load: function() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Erreur lors du chargement du jeu", e);
            return null;
        }
    },
    
    clear: function() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
