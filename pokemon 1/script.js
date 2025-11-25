 document.addEventListener('DOMContentLoaded', () => {
            // Seleção de elementos
            const searchButton = document.getElementById('search-button');
            const pokemonInput = document.getElementById('pokemon-input');
            const pokemonInfoDiv = document.getElementById('pokemon-info');
            const historyList = document.getElementById('history-list');

            // --- 1. Declaração do Array Vazio (Memória da Sessão) ---
            // Declarado fora da função fetchPokemon para persistir enquanto a aba estiver aberta
            const searchHistory = [];

            // Adicionar evento de tecla "Enter" no input
            pokemonInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });

            searchButton.addEventListener('click', handleSearch);

            function handleSearch() {
                const query = pokemonInput.value.toLowerCase().trim();
                if (query) {
                    fetchPokemon(query);
                }
            }

            async function fetchPokemon(query) {
                pokemonInfoDiv.innerHTML = '<p>Carregando...</p>';

                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

                    if (!response.ok) {
                        throw new Error('Pokémon não encontrado!');
                    }

                    const data = await response.json();

                    // Renderizar o Pokémon
                    displayPokemon(data);

                    // --- 2. Adicionar ao Histórico em caso de sucesso ---
                    addToHistory(data.name);

                } catch (error) {
                    console.error(error);
                    pokemonInfoDiv.innerHTML = `<p style="color: red;"> ${error.message}</p>`;
                }
            }

            // Função auxiliar para gerenciar o array de histórico
            function addToHistory(name) {
                // Opcional: Evitar duplicatas consecutivas ou repetidas
                // Se quiser permitir repetidos, basta remover este if
                const existingIndex = searchHistory.indexOf(name);
                if (existingIndex !== -1) {
                    searchHistory.splice(existingIndex, 1); // Remove o antigo para colocar no topo
                }

                // Adiciona ao INÍCIO do array
                searchHistory.unshift(name);

                // Renderiza a lista atualizada
                displayHistory();
            }

            // --- 3. Função displayHistory ---
            function displayHistory() {
                historyList.innerHTML = ''; // Limpa a lista visual atual

                if (searchHistory.length === 0) {
                    historyList.innerHTML = '<li style="border:none; background:none; cursor:default;">Nenhum histórico ainda.</li>';
                    return;
                }

                // Itera sobre o array searchHistory
                searchHistory.forEach(pokemonName => {
                    const listItem = document.createElement('li');
                    listItem.textContent = pokemonName;
                    
                    // --- 4. Implementar Link Clicável ---
                    // Ao clicar, preenche o input e refaz a busca
                    listItem.addEventListener('click', () => {
                        pokemonInput.value = pokemonName;
                        fetchPokemon(pokemonName);
                    });

                    historyList.appendChild(listItem);
                });
            }

            function displayPokemon(pokemon) {
                const types = pokemon.types
                    .map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1))
                    .join(', ');

                const htmlContent = `
                    <h2>${pokemon.name} <small>(#${pokemon.id})</small></h2>
                    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
                    <p><strong>Tipo:</strong> ${types}</p>
                    <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
                    <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
                `;
                pokemonInfoDiv.innerHTML = htmlContent;
            }
        });