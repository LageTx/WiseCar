document.addEventListener('DOMContentLoaded', () => {
  const API_URL = window.API_URL || 'https://wise-car-vercel.vercel.app';

  const perfilForm = document.getElementById('perfilForm');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');

  const meusAnunciosEl = document.getElementById('meusAnuncios');
  const noMeusAnunciosEl = document.getElementById('noMeusAnuncios');

  const favoritosEl = document.getElementById('favoritosList');
  const noFavoritosEl = document.getElementById('noFavoritos');

  const userJSON = sessionStorage.getItem('usuarioCorrente');
  if (!userJSON) {
    window.location.href = 'login.html';
    return;
  }

  let usuario = JSON.parse(userJSON);

  // preencher campos
  nomeInput.value = usuario.name || '';
  emailInput.value = usuario.email || '';

  // carregar anúncios e favoritos
  carregarMeusAnuncios(usuario.id);
  carregarFavoritos(usuario.favorites || []);

  perfilForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novoNome = nomeInput.value.trim();
    const novoEmail = emailInput.value.trim();
    const novaSenha = senhaInput.value;

    try {
      // verificar email duplicado se mudou
      if (novoEmail !== usuario.email) {
        const checkRes = await fetch(`${API_URL}/users?email=${encodeURIComponent(novoEmail)}`);
        const exists = await checkRes.json();
        if (exists && exists.length > 0) {
          alert('Já existe uma conta com este e-mail.');
          return;
        }
      }

      // obter usuário atual do servidor para evitar sobrescrever campos
      const userRes = await fetch(`${API_URL}/users/${usuario.id}`);
      if (!userRes.ok) throw new Error('Usuário não encontrado');
      const userServer = await userRes.json();

      const updated = { ...userServer };
      updated.name = novoNome;
      updated.email = novoEmail;
      if (novaSenha && novaSenha.length >= 8) {
        updated.password = novaSenha;
      }

      const putRes = await fetch(`${API_URL}/users/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (!putRes.ok) throw new Error('Erro ao atualizar perfil');

      const novoUser = await putRes.json();
      // Atualizar sessionStorage
      usuario = {
        id: novoUser.id,
        name: novoUser.name,
        email: novoUser.email,
        isAdmin: !!novoUser.isAdmin,
        favorites: novoUser.favorites || []
      };
      sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuario));
      alert('Perfil atualizado com sucesso.');
      senhaInput.value = '';
      carregarFavoritos(usuario.favorites || []);
      carregarMeusAnuncios(usuario.id);

    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar perfil. Tente novamente.');
    }
  });

  async function carregarMeusAnuncios(userId) {
    try {
      const res = await fetch(`${API_URL}/anuncios?userId=${userId}`);
      if (!res.ok) throw new Error('Erro ao carregar anúncios');
      const ads = await res.json();

      meusAnunciosEl.innerHTML = '';
      if (!ads.length) {
        noMeusAnunciosEl.style.display = 'block';
        return;
      }
      noMeusAnunciosEl.style.display = 'none';

      ads.forEach(ad => {
        const card = document.createElement('article');
        card.className = 'ad-card';
        card.onclick = () => window.location.href = `detalhes.html?id=${ad.id}`;

        const imgWrap = document.createElement('div');
        imgWrap.className = 'ad-images';
        if (ad.images && ad.images.length) {
          const mainImg = document.createElement('img');
          mainImg.src = ad.images[0];
          imgWrap.appendChild(mainImg);
        }

        const info = document.createElement('div');
        info.className = 'ad-info';

        const title = document.createElement('h3');
        title.textContent = `${ad.marca || '-'} ${ad.modelo || '-'}`;

        const btns = document.createElement('div');
        btns.style.display = 'flex';
        btns.style.gap = '8px';

        const edit = document.createElement('button');
        edit.textContent = 'Editar';
        edit.onclick = (e) => { e.stopPropagation(); window.location.href = `vender.html?editar=${ad.id}`; };

        const remove = document.createElement('button');
        remove.textContent = 'Remover';
        remove.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm('Tem certeza que deseja remover este anúncio?')) return;
          try {
            const del = await fetch(`${API_URL}/anuncios/${ad.id}`, { method: 'DELETE' });
            if (!del.ok) throw new Error('Erro ao remover');
            carregarMeusAnuncios(userId);
          } catch (err) {
            console.error(err);
            alert('Erro ao remover anúncio.');
          }
        };

        btns.appendChild(edit);
        btns.appendChild(remove);

        info.appendChild(title);
        info.appendChild(btns);

        card.appendChild(imgWrap);
        card.appendChild(info);

        meusAnunciosEl.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      noMeusAnunciosEl.style.display = 'block';
    }
  }

  async function carregarFavoritos(favIds) {
    try {
      favoritosEl.innerHTML = '';
      if (!favIds || !favIds.length) {
        noFavoritosEl.style.display = 'block';
        return;
      }
      noFavoritosEl.style.display = 'none';

      const qs = favIds.map(id => `id=${encodeURIComponent(id)}`).join('&');
      const res = await fetch(`${API_URL}/anuncios?${qs}`);
      if (!res.ok) throw new Error('Erro ao carregar favoritos');
      const ads = await res.json();

      ads.forEach(ad => {
        const card = document.createElement('article');
        card.className = 'ad-card';
        card.onclick = () => window.location.href = `detalhes.html?id=${ad.id}`;

        const imgWrap = document.createElement('div');
        imgWrap.className = 'ad-images';
        if (ad.images && ad.images.length) {
          const mainImg = document.createElement('img');
          mainImg.src = ad.images[0];
          imgWrap.appendChild(mainImg);
        }

        const info = document.createElement('div');
        info.className = 'ad-info';

        const title = document.createElement('h3');
        title.textContent = `${ad.marca || '-'} ${ad.modelo || '-'}`;

        const removeFav = document.createElement('button');
        removeFav.textContent = 'Remover favorito';
        removeFav.onclick = async (e) => {
          e.stopPropagation();
          await removerFavorito(ad.id);
        };

        info.appendChild(title);
        info.appendChild(removeFav);

        card.appendChild(imgWrap);
        card.appendChild(info);

        favoritosEl.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      noFavoritosEl.style.display = 'block';
    }
  }

  async function removerFavorito(adId) {
    try {
      const userRes = await fetch(`${API_URL}/users/${usuario.id}`);
      if (!userRes.ok) throw new Error('Usuário não encontrado');
      const userServer = await userRes.json();
      const favs = (userServer.favorites || []).filter(id => id !== adId);
      userServer.favorites = favs;

      const put = await fetch(`${API_URL}/users/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userServer)
      });
      if (!put.ok) throw new Error('Erro ao atualizar favoritos');

      usuario.favorites = favs;
      sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuario));
      carregarFavoritos(favs);
    } catch (err) {
      console.error(err);
      alert('Erro ao remover favorito.');
    }
  }

});
