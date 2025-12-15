    const API_URL = window.API_URL || 'https://wise-car-vercel.vercel.app';
    const estrelaMax = 5;
    const estrelasCor = "#f59e0b";
    let avaliacaoAtual = { id: null, nome: "", nota: 0, comentario: "", authorId: null, authorName: null };

    function getUsuarioCorrente() {
      const u = sessionStorage.getItem('usuarioCorrente');
      return u ? JSON.parse(u) : null;
    }

    const estrelasForm = document.getElementById("estrelasForm");
    const nomeInput = document.getElementById("avaliado");
    const comentarioInput = document.getElementById("comentario");
    const btnSalvar = document.getElementById("btnSalvar");
    const listaAvaliacoes = document.getElementById("listaAvaliacoes");

    // Pega o nome da URL
    const params = new URLSearchParams(window.location.search);
    const nomePessoa = params.get("nome");
    if (nomePessoa) {
      nomeInput.value = decodeURIComponent(nomePessoa);
    } else {
      nomeInput.value = "";
    }

    function renderEstrelasForm() {
      estrelasForm.innerHTML = "";
      for (let i = 1; i <= estrelaMax; i++) {
        const estrela = document.createElement("span");
        estrela.innerText = i <= avaliacaoAtual.nota ? "★" : "☆";
        estrela.style.color = estrelasCor;
        estrela.dataset.value = i;
        estrela.addEventListener("click", () => {
          avaliacaoAtual.nota = i;
          renderEstrelasForm();
        });
        estrelasForm.appendChild(estrela);
      }
    }
    renderEstrelasForm();

    async function carregarAvaliacoes() {
      try {
        const nome = nomeInput.value.trim();
        if (!nome) {
          listaAvaliacoes.innerHTML = "<p style='color:#666;'>Informe a pessoa a ser avaliada.</p>";
          return;
        }
        const res = await fetch(`${API_URL}/avaliacoes?nome=${encodeURIComponent(nome)}`);
        if (!res.ok) throw new Error('Erro ao buscar avaliações');
        const avaliacoes = await res.json();

        listaAvaliacoes.innerHTML = "";

        if (!avaliacoes || avaliacoes.length === 0) {
          listaAvaliacoes.innerHTML = "<p style='color:#666;'>Nenhuma avaliação salva ainda.</p>";
          return;
        }

        const usuario = getUsuarioCorrente();
        avaliacoes.forEach((a) => {
          const card = document.createElement("div");
          card.classList.add("avaliacao-card");
          const authorName = a.authorName || 'Anônimo';
          const canModify = usuario && (usuario.isAdmin || usuario.id === a.authorId);

          const botoes = [];
          if (canModify) {
            botoes.push(`<button onclick="editarAvaliacao(${a.id})">Editar</button>`);
            botoes.push(`<button onclick="excluirAvaliacao(${a.id})">Excluir</button>`);
          }

          card.innerHTML = `
            <h3>${a.nome}</h3>
            <div class="estrelas">${"★".repeat(a.nota)}${"☆".repeat(estrelaMax - a.nota)}</div>
            <p>${a.comentario}</p>
            <p class="autor-avaliacao">Comentado por: <strong>${authorName}</strong></p>
            <div class="botoes-card">${botoes.join('')}</div>
          `;
          listaAvaliacoes.appendChild(card);
        });
      } catch (err) {
        console.error(err);
        listaAvaliacoes.innerHTML = "<p style='color:#c00;'>Erro ao carregar avaliações.</p>";
      }
    }

    carregarAvaliacoes();

    btnSalvar.addEventListener("click", async () => {
      const nome = nomeInput.value.trim();
      const comentario = comentarioInput.value.trim();
      const nota = avaliacaoAtual.nota;

      if (nota === 0 || !comentario || !nome) {
        alert("Por favor, preencha o comentário, nome e escolha uma nota.");
        return;
      }

      try {
        const usuario = getUsuarioCorrente();
        if (avaliacaoAtual.id) {
          // Atualizar - verificar permissão
          const existenteRes = await fetch(`${API_URL}/avaliacoes/${avaliacaoAtual.id}`);
          if (!existenteRes.ok) throw new Error('Avaliação existente não encontrada');
          const existente = await existenteRes.json();
          const canEdit = usuario && (usuario.isAdmin || usuario.id === existente.authorId);
          if (!canEdit) {
            alert('Somente o autor ou um admin pode editar esta avaliação.');
            return;
          }

          const put = await fetch(`${API_URL}/avaliacoes/${avaliacaoAtual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, nota, comentario, authorId: existente.authorId || null, authorName: existente.authorName || null, createdAt: existente.createdAt || new Date().toISOString() })
          });
          if (!put.ok) throw new Error('Erro ao atualizar avaliação');
        } else {
          // Criar
          const author = usuario ? { authorId: usuario.id, authorName: usuario.name } : { authorId: null, authorName: 'Anônimo' };
          const post = await fetch(`${API_URL}/avaliacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, nota, comentario, authorId: author.authorId, authorName: author.authorName, createdAt: new Date().toISOString() })
          });
          if (!post.ok) throw new Error('Erro ao salvar avaliação');
        }

        comentarioInput.value = "";
        avaliacaoAtual = { id: null, nome: "", nota: 0, comentario: "", authorId: null, authorName: null };
        renderEstrelasForm();
        carregarAvaliacoes();
        btnSalvar.innerText = 'Salvar Avaliação';
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar avaliação no servidor.');
      }
    });

    window.editarAvaliacao = async function (id) {
      try {
        const usuario = getUsuarioCorrente();
        const res = await fetch(`${API_URL}/avaliacoes/${id}`);
        if (!res.ok) throw new Error('Avaliação não encontrada');
        const a = await res.json();
        const canEdit = usuario && (usuario.isAdmin || usuario.id === a.authorId);
        if (!canEdit) {
          alert('Somente o autor ou um admin pode editar esta avaliação.');
          return;
        }

        avaliacaoAtual = { id: a.id, nome: a.nome, nota: a.nota, comentario: a.comentario, authorId: a.authorId || null, authorName: a.authorName || null };
        nomeInput.value = a.nome;
        comentarioInput.value = a.comentario;
        renderEstrelasForm();
        btnSalvar.innerText = 'Salvar Alterações';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar avaliação para edição.');
      }
    };

    window.excluirAvaliacao = async function (id) {
      if (!confirm('Deseja realmente excluir esta avaliação?')) return;
      try {
        const usuario = getUsuarioCorrente();
        const res = await fetch(`${API_URL}/avaliacoes/${id}`);
        if (!res.ok) throw new Error('Avaliação não encontrada');
        const a = await res.json();
        const canDelete = usuario && (usuario.isAdmin || usuario.id === a.authorId);
        if (!canDelete) {
          alert('Somente o autor ou um admin pode excluir esta avaliação.');
          return;
        }

        const del = await fetch(`${API_URL}/avaliacoes/${id}`, { method: 'DELETE' });
        if (!del.ok) throw new Error('Erro ao excluir avaliação');
        carregarAvaliacoes();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir avaliação no servidor.');
      }
    };
