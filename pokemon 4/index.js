
// Variável de controle para a paginação
let currentOffset = 0;
// Referência para a lista de histórico
const historyListElement = document.getElementById('history-list');
// Array para controlar duplicatas (opcional, mas recomendado)
let sessionHistory = [];
const limit = 150; // Quantidade de Pokémon por página
const POKEMON_ENDPOINT = 'https://pokeapi.co/api/v2/pokemon';

// Obtendo as referências dos elementos HTML
const pokemonListElement = document.getElementById('pokemon-list');
const nextButton = document.getElementById('btn-next');
const prevButton = document.getElementById('btn-prev');
const detailsElement = document.getElementById('pokemon-details');

/**
 * Adiciona um Pokémon ao histórico da sessão.
 * @param {string} name Nome do Pokémon.
 */
function addToHistory(name) {
    // Evita duplicatas consecutivas ou repetidas na lista visual
    if (sessionHistory.includes(name)) return;

    // Adiciona ao array de controle
    sessionHistory.push(name);

    // Cria o elemento HTML
    const li = document.createElement('li');
    li.textContent = name;
    
    // Adiciona funcionalidade de clique para reabrir o Pokémon
    li.addEventListener('click', () => {
        detailsElement.innerHTML = `<p>Carregando ${name}...</p>`;
        fetchPokemonDetails(name);
        // Scroll suave até os detalhes
        detailsElement.scrollIntoView({ behavior: 'smooth' });
    });

    // Insere no começo da lista (mais recente primeiro)
    historyListElement.prepend(li);
}


/**
 * Busca a lista de Pokémon e chama a função para ordenar e renderizar.
 * @param {number} offset O ponto de início da lista (para paginação).
 */
async function fetchPokemonList(offset = 0) {
    const url = `${POKEMON_ENDPOINT}?limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json(); 
        
        currentOffset = offset; 
        
        // Limpa e informa que está carregando
        pokemonListElement.innerHTML = '<p>Carregando e ordenando Pokémon...</p>';
        detailsElement.innerHTML = 'Clique em um Pokémon para ver detalhes.';
        
        // ** NOVA FUNÇÃO: Ordena e Renderiza **
        renderOrderedPokemonList(data.results); 
        
        setupPagination(data.next, data.previous);

    } catch (error) {
        console.error('Erro ao buscar a lista de Pokémon:', error);
    }

    // Dentro da função fetchPokemonList...
pokemonListElement.innerHTML = '<p>Carregando e ordenando Pokémon...</p>';

// Resetar o card de detalhes para o padrão
detailsElement.innerHTML = 'Clique em um Pokémon para ver detalhes.';
detailsElement.style.backgroundColor = ''; // Remove a cor de fundo
detailsElement.classList.remove('texto-legivel'); // Remove a classe de texto branco

}

/**
 * Busca os detalhes de um Pokémon específico para a área de Detalhes.
 * @param {string} nameOrId O nome ou ID do Pokémon.
 */
async function fetchPokemonDetails(nameOrId) {
    const url = `${POKEMON_ENDPOINT}/${nameOrId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            detailsElement.innerHTML = `<h2>Erro!</h2><p>Não foi possível encontrar os detalhes de ${nameOrId.toUpperCase()}.</p>`;
            throw new Error(`Erro ao buscar detalhes de ${nameOrId}: ${response.status}`);
        }
        const data = await response.json();
        
        displayPokemonDetails(data); 

    } catch (error) {
        console.error(`Erro ao buscar detalhes de ${nameOrId}:`, error);
    }
}




/**
 * Busca os detalhes de todos os Pokémon da lista inicial, os ordena e os exibe.
 * Essa função garante a ordem correta (ID 1, 2, 3...).
 * @param {Array<Object>} pokemons Array de objetos Pokémon (com nome e URL).
 */
async function renderOrderedPokemonList(pokemons) {
    // 1. Cria um array de Promises para buscar os detalhes (imagem, ID) de cada Pokémon.
    const detailPromises = pokemons.map(pokemon => 
        fetch(pokemon.url).then(res => res.json())
    );

    try {
        // Aguarda que TODAS as Promises sejam resolvidas
        const pokemonDetails = await Promise.all(detailPromises);

        //  Ordena o array de detalhes pelo ID do Pokémon (que é numérico)
        pokemonDetails.sort((a, b) => a.id - b.id);

        //  Limpa a lista antes de inserir os cards ordenados
        pokemonListElement.innerHTML = ''; 

        //  Renderiza os cards na ordem correta
        pokemonDetails.forEach(pokemon => {
            renderPokemonCard(pokemon);
        });

    } catch (error) {
        console.error('Erro ao buscar ou ordenar os dados dos Pokémon:', error);
        pokemonListElement.innerHTML = '<p>Erro ao carregar a lista de Pokémon.</p>';
    }
}

/**
 * Cria e insere um único card na lista, sem se preocupar com a ordem.
 * @param {Object} data Dados completos do Pokémon.
 */
function renderPokemonCard(data) {
    const card = document.createElement('div');
    card.classList.add('pokemon-card');
    card.innerHTML = `
        <img 
            src="${data.sprites.front_default}" 
            alt="${data.name}" 
            width="96" 
            height="96"
        >
        <h3>#${data.id} - ${data.name.toUpperCase()}</h3>
    `;
    
    // Adicionando o evento de clique
    card.addEventListener('click', () => {
        detailsElement.innerHTML = `<p>Carregando detalhes de ${data.name.toUpperCase()}...</p>`;
        fetchPokemonDetails(data.name); 
    });

    // Adiciona o card à lista
    pokemonListElement.appendChild(card);
}


function displayPokemonDetails(data) {
    // 1. Identifica o primeiro tipo do Pokémon e define cores
    const tipoPrincipal = data.types[0].type.name;
    const corFundo = coresTiposPokemon[tipoPrincipal] || '#f0f0f0';

    detailsElement.style.backgroundColor = corFundo;
    detailsElement.classList.add('texto-legivel');

    addToHistory(data.name);

    // 2. Lógica das Barras de Progresso (NOVO CÓDIGO)
    // Mapeia cada stat para um pedaço de HTML
    const statsHTML = data.stats.map(stat => {
        const valor = stat.base_stat;
        // Calcula a largura: (valor / 255) * 100
        // Usamos Math.min para garantir que não passe de 100% se houver algum hack/bônus
        const porcentagem = Math.min((valor / 255) * 100, 100);

        return `
            <div class="stat-row">
                <span class="stat-label">${stat.stat.name.replace('-', ' ')}</span>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${porcentagem}%;">
                        ${valor}
                    </div>
                </div>
            </div>
        `;
    }).join(''); // Junta todos os pedaços em uma única string


    // 3. Renderiza o HTML final
    detailsElement.innerHTML = `
        <h2>${data.name.toUpperCase()} (#${data.id})</h2>
        <img src="${data.sprites.front_default}" alt="${data.name}" width="96" height="96">
        
        <p><strong>Tipo:</strong> ${data.types.map(t => t.type.name).join(', ')}</p>
        
        <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 10px;">
            <p>Altura: ${data.height / 10} m</p>
            <p>Peso: ${data.weight / 10} kg</p>
        </div>

        <div class="stats-container">
            <h3>Estatísticas Base</h3>
            ${statsHTML}
        </div>
    `;
}

/**
 * Configura o estado dos botões de paginação.
 */
function setupPagination(nextUrl, prevUrl) {
    nextButton.disabled = !nextUrl;
    prevButton.disabled = !prevUrl || currentOffset === 0; 
}




nextButton.addEventListener('click', () => {
    fetchPokemonList(currentOffset + limit); 
});

prevButton.addEventListener('click', () => {
    const newOffset = Math.max(0, currentOffset - limit);
    fetchPokemonList(newOffset);
});


// Inicia o carregamento da primeira lista
fetchPokemonList(0);

// Mapa de cores para os tipos de Pokémon (Variáveis em Português)
const coresTiposPokemon = {
    fire: '#EE8130',
    grass: '#7AC74C',
    water: '#6390F0',
    bug: '#A6B91A',
    normal: '#A8A77A',
    poison: '#A33EA1',
    electric: '#F7D02C',
    ground: '#E2BF65',
    fairy: '#D685AD',
    fighting: '#C22E28',
    psychic: '#F95587',
    rock: '#B6A136',
    ghost: '#735797',
    ice: '#96D9D6',
    dragon: '#6F35FC',
    steel: '#B7B7CE',
    dark: '#705746',
    flying: '#A98FF3'
};