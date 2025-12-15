const API_URL = window.API_URL || 'https://wise-car-vercel.vercel.app';

// Elementos da página
const fotoPrincipal = document.getElementById('fotoPrincipal');
const miniaturas = document.getElementById('miniaturas');
const tituloVeiculo = document.getElementById('tituloVeiculo');
const precoVeiculo = document.getElementById('precoVeiculo');
const localizacaoVeiculo = document.getElementById('localizacaoVeiculo');
const detalhesVeiculo = document.getElementById('detalhesVeiculo');
const descricaoVeiculo = document.getElementById('descricaoVeiculo');
const btnComprar = document.getElementById('btnComprar');
const btnAvaliar = document.getElementById('btnAvaliar');
const favoritarBtn = document.getElementById('favoritarBtn');
const veiculosSimilares = document.getElementById('veiculosSimilares');

// Obter ID do veículo da URL
const urlParams = new URLSearchParams(window.location.search);
const veiculoId = urlParams.get('id');

// Carregar dados do veículo
async function carregarVeiculo() {
    if (!veiculoId) {
        alert('Veículo não encontrado.');
        window.location.href = 'anuncios.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/anuncios/${veiculoId}`);
        if (!response.ok) throw new Error('Veículo não encontrado');
        
        const veiculo = await response.json();
        preencherDadosVeiculo(veiculo);
        carregarVeiculosSimilares(veiculo);
        atualizarBotaoFavorito(veiculo);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar veículo.');
        window.location.href = 'anuncios.html';
    }
}

// Preencher dados do veículo na página
async function preencherDadosVeiculo(veiculo) {
    // Galeria de fotos
    if (veiculo.images && veiculo.images.length > 0) {
        fotoPrincipal.src = veiculo.images[0];
        
        // Miniaturas
        miniaturas.innerHTML = '';
        veiculo.images.forEach((foto, index) => {
            const miniatura = document.createElement('img');
            miniatura.src = foto;
            miniatura.alt = `Foto ${index + 1}`;
            miniatura.className = index === 0 ? 'miniatura active' : 'miniatura';
            miniatura.onclick = () => trocarFotoPrincipal(foto, index);
            miniaturas.appendChild(miniatura);
        });
    } else {
        fotoPrincipal.src = 'images/sem-foto.jpg';
        fotoPrincipal.alt = 'Sem foto';
    }

    // Informações principais
    tituloVeiculo.textContent = `${veiculo.marca || ''} ${veiculo.modelo || ''} ${veiculo.ano || ''}`;
    precoVeiculo.textContent = `R$ ${parseFloat(veiculo.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    // Detalhes do veículo
    detalhesVeiculo.innerHTML = `
        <div class="detalhe-item">
            <span class="detalhe-label">Marca:</span>
            <span class="detalhe-valor">${veiculo.marca || 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Modelo:</span>
            <span class="detalhe-valor">${veiculo.modelo || 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Ano:</span>
            <span class="detalhe-valor">${veiculo.ano || 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Quilometragem:</span>
            <span class="detalhe-valor">${veiculo.quilometragem ? veiculo.quilometragem + ' km' : 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Tipo:</span>
            <span class="detalhe-valor">${veiculo.tipo || 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Cilindradas:</span>
            <span class="detalhe-valor">${veiculo.cilindradas || 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Cor:</span>
            <span class="detalhe-valor">${veiculo.cor || 'Não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-label">Combustível:</span>
            <span class="detalhe-valor">${veiculo.combustivel || 'Não informado'}</span>
        </div>
    `;

    // Descrição
    descricaoVeiculo.textContent = veiculo.descricao || 'Nenhuma descrição fornecida.';

    // Puxar nome do vendedor associado ao anúncio e configurar botão Avaliar
    const vendedorEl = document.getElementById('vendedorNome');
    if (veiculo.userId) {
        try {
            const userRes = await fetch(`${API_URL}/users/${veiculo.userId}`);
            if (userRes.ok) {
                const user = await userRes.json();
                if (vendedorEl) vendedorEl.textContent = user.name || 'Usuário';
                if (btnAvaliar) btnAvaliar.onclick = () => window.location.href = `avaliacao.html?nome=${encodeURIComponent(user.name || '')}`;
            } else {
                if (vendedorEl) vendedorEl.textContent = 'Não informado';
            }
        } catch (err) {
            console.error('Erro ao obter vendedor:', err);
            if (vendedorEl) vendedorEl.textContent = 'Não informado';
        }
    } else {
        if (vendedorEl) vendedorEl.textContent = 'Não informado';
    }

    // Botão comprar
    btnComprar.onclick = () => iniciarCompra(veiculo);

    if (favoritarBtn) {
        favoritarBtn.onclick = async () => {
            const userJson = sessionStorage.getItem('usuarioCorrente');
            if (!userJson) { window.location.href = 'login.html'; return; }
            const user = JSON.parse(userJson);
            try {
                const userRes = await fetch(`${API_URL}/users/${user.id}`);
                if (!userRes.ok) throw new Error('Usuário não encontrado');
                const userServer = await userRes.json();
                const favs = userServer.favorites || [];
                if (favs.includes(veiculo.id)) {
                    userServer.favorites = favs.filter(i => i !== veiculo.id);
                } else {
                    userServer.favorites = [...favs, veiculo.id];
                }
                const put = await fetch(`${API_URL}/users/${user.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userServer)
                });
                if (!put.ok) throw new Error('Erro ao atualizar favoritos');
                const updated = await put.json();
                sessionStorage.setItem('usuarioCorrente', JSON.stringify({ id: updated.id, name: updated.name, email: updated.email, isAdmin: !!updated.isAdmin, favorites: updated.favorites || [] }));
                atualizarBotaoFavorito(veiculo);
            } catch (err) {
                console.error(err);
                alert('Erro ao atualizar favoritos');
            }
        };
    }
}

// Trocar foto principal
function trocarFotoPrincipal(fotoSrc, index) {
    fotoPrincipal.src = fotoSrc;
    
    // Atualizar miniaturas ativas
    document.querySelectorAll('.miniatura').forEach((miniatura, i) => {
        if (i === index) {
            miniatura.classList.add('active');
        } else {
            miniatura.classList.remove('active');
        }
    });
}

// Carregar veículos similares
async function carregarVeiculosSimilares(veiculoAtual) {
    try {
        const response = await fetch(`${API_URL}/anuncios`);
        if (!response.ok) throw new Error('Erro ao carregar veículos similares');
        
        const todosVeiculos = await response.json();
        const similares = todosVeiculos
            .filter(v => v.id !== veiculoAtual.id)
            .slice(0, 3); // Mostrar até 3 veículos similares

        preencherVeiculosSimilares(similares);
    } catch (error) {
        console.error('Erro ao carregar veículos similares:', error);
    }
}

// Preencher veículos similares
function preencherVeiculosSimilares(veiculos) {
    if (veiculos.length === 0) {
        veiculosSimilares.innerHTML = '<p>Nenhum veículo similar encontrado.</p>';
        return;
    }

    veiculosSimilares.innerHTML = '';
    veiculos.forEach(veiculo => {
        const card = document.createElement('div');
        card.className = 'similar-card';
        card.onclick = () => window.location.href = `detalhes.html?id=${veiculo.id}`;

        const imagem = veiculo.images && veiculo.images.length > 0 
            ? veiculo.images[0] 
            : 'images/sem-foto.jpg';

        card.innerHTML = `
            <img src="${imagem}" alt="${veiculo.marca} ${veiculo.modelo}">
            <div class="similar-info">
                <h4>${veiculo.marca || ''} ${veiculo.modelo || ''}</h4>
                <p class="similar-ano">${veiculo.ano || ''}</p>
                <p class="similar-preco">R$ ${parseFloat(veiculo.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
        `;

        veiculosSimilares.appendChild(card);
    });
}

// Iniciar processo de compra
function iniciarCompra(veiculo) {
    if (confirm(`Deseja realmente comprar o ${veiculo.marca} ${veiculo.modelo} por R$ ${parseFloat(veiculo.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`)) {
        alert('Compra iniciada com sucesso! Em breve entraremos em contato para finalizar a transação.');
        // Aqui você pode redirecionar para uma página de checkout ou enviar os dados para o backend
    }
}

// Modificar o anuncios.html para redirecionar para detalhes
// No arquivo anuncios.html, modifique a criação dos cards para:
function criarCardAnuncio(ad) {
    const card = document.createElement('article');
    card.className = 'ad-card';
    card.onclick = () => window.location.href = `detalhes.html?id=${ad.id}`;
    // ... resto do código do card
}

function atualizarBotaoFavorito(veiculo) {
    if (!favoritarBtn) return;
    const userJson = sessionStorage.getItem('usuarioCorrente');
    const user = userJson ? JSON.parse(userJson) : null;
    const isFav = user && Array.isArray(user.favorites) && user.favorites.includes(veiculo.id);
    favoritarBtn.textContent = isFav ? '♥' : '♡';
    favoritarBtn.title = isFav ? 'Remover favorito' : 'Adicionar favorito';
}

// Inicializar página
document.addEventListener('DOMContentLoaded', carregarVeiculo);