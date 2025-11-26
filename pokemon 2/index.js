// Variável de controle para a paginação
let currentOffset = 0;
const limit = 150; // Quantidade de Pokémon por página
const POKEMON_ENDPOINT = 'https://pokeapi.co/api/v2/pokemon';

// Obtendo as referências dos elementos HTML
const pokemonListElement = document.getElementById('pokemon-list');
const nextButton = document.getElementById('btn-next');
const prevButton = document.getElementById('btn-prev');
const detailsElement = document.getElementById('pokemon-details');




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


/**
 * Exibe os detalhes do Pokémon selecionado na área #pokemon-details.
 * (Função inalterada, usada pelo evento de clique)
 */
function displayPokemonDetails(data) {
    detailsElement.innerHTML = `
        <h2>${data.name.toUpperCase()} (#${data.id})</h2>
        <img src="${data.sprites.front_default}" alt="${data.name}" width="96" height="96">
        <p>Altura: ${data.height / 10} m</p>
        <p>Peso: ${data.weight / 10} kg</p>
        <p>Tipos: ${data.types.map(t => t.type.name).join(', ')}</p>
        <p>Habilidades: ${data.abilities.map(a => a.ability.name).join(', ')}</p>
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