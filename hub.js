const CONFIG_URL = './hub-config.json';
const DOM_ID = 'games-grid';

document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
  const gridElement = document.getElementById(DOM_ID);
  
  if (!gridElement) {
    throw new Error(`Élément DOM manquant : '${DOM_ID}'`);
  }

  try {
    const response = await fetch(CONFIG_URL);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} lors de la lecture du fichier de configuration.`);
    }
    
    const gamesConfig = await response.json();
    renderGames(gamesConfig, gridElement);
    
  } catch (error) {
    gridElement.innerHTML = '<p>Erreur critique : Impossible de charger la liste des jeux.</p>';
    console.error("Échec de l'initialisation du Dashboard :", error);
  }
}

function renderGames(gamesArray, containerElement) {
  containerElement.innerHTML = '';
  
  if (!Array.isArray(gamesArray) || gamesArray.length === 0) {
    containerElement.innerHTML = '<p>Aucun jeu disponible dans la configuration.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  
  gamesArray.forEach(game => {
    fragment.appendChild(createTileNode(game));
  });
  
  containerElement.appendChild(fragment);
}

function createTileNode(game) {
  const anchor = document.createElement('a');
  anchor.href = determineTargetUrl(game);
  anchor.className = 'game-tile';

  const article = document.createElement('article');
  
  const img = document.createElement('img');
  img.src = game.thumbnail;
  img.alt = `Miniature de ${game.title}`;
  img.loading = 'lazy';
  
  // Remplacement dynamique par un SVG noir si l'image n'existe pas sur le disque
  img.onerror = () => { img.src = generateBlackFallbackSVG(); };

  const heading = document.createElement('h2');
  heading.textContent = game.title;

  article.appendChild(img);
  article.appendChild(heading);
  anchor.appendChild(article);

  return anchor;
}

function determineTargetUrl(game) {
  if (game.type === 'custom' && game.indexPath) {
    return game.indexPath;
  }
  return `./wordplayer.html?game=${game.id}`;
}

function generateBlackFallbackSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" fill="#111"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="14">Image Manquante</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}