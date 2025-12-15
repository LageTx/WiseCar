(() => {
  const API_URL = window.API_URL || 'https://wise-car-vercel.vercel.app';
  const steps = Array.from(document.querySelectorAll('.step'));
  const totalSteps = steps.length;
  let current = 0;
  let editingAdId = null; // Para controle de edição
  let editingAdOwnerId = null;

  // Verificar se estamos editando um anúncio
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('editar')) {
    editingAdId = urlParams.get('editar');
  }

  const progressInner = document.getElementById('progressInner');
  function updateProgress() {
    const percent = Math.round(((current) / (totalSteps - 1)) * 100);
    progressInner.style.width = `${Math.max(6, percent)}%`;
  }

  const btnAvancar = document.getElementById('avancar');
  const btnVoltar = document.getElementById('voltar');

  function showStep(idx) {
    steps.forEach((s, i) => s.style.display = i === idx ? 'block' : 'none');
    current = idx;
    btnVoltar.style.display = current === 0 ? 'inline-block' : 'inline-block';
    
    if (current === totalSteps - 1) {
      btnAvancar.textContent = editingAdId ? 'Atualizar Anúncio' : 'Publicar Anúncio';
      preencherResumo();
    } else {
      btnAvancar.textContent = 'Avançar';
    }
    updateProgress();
  }

  btnVoltar.addEventListener('click', () => {
    if (current > 0) showStep(current - 1);
  });

  // VALIDAÇÃO DAS ETAPAS
  function validarStep(idx) {
    switch (idx) {
      case 0:
        if (imageDataUrls.length === 0) {
          alert('Adicione ao menos uma foto do veículo.');
          return false;
        }
        break;
      case 1:
        if (!document.getElementById('marca').value.trim()) {
          alert('O campo Marca é obrigatório.');
          return false;
        }
        break;
      case 2:
        if (!document.getElementById('modelo').value.trim()) {
          alert('O campo Modelo é obrigatório.');
          return false;
        }
        break;
      case 3:
        const ano = document.getElementById('ano').value.trim();
        if (!ano) {
          alert('O campo Ano é obrigatório.');
          return false;
        }
        if (ano < 1900 || ano > new Date().getFullYear() + 1) {
          alert('Por favor, insira um ano válido.');
          return false;
        }
        break;
      case 4:
        const obrigatorios = ['quilometragem', 'tipo', 'cilindradas', 'cor', 'combustivel'];
        for (const id of obrigatorios) {
          if (!document.getElementById(id).value.trim()) {
            alert('Preencha todos os campos obrigatórios antes de continuar.');
            return false;
          }
        }
        break;
      case 5:
        const preco = document.getElementById('preco').value.trim();
        if (!preco || preco <= 0) {
          alert('O campo Preço é obrigatório e deve ser maior que zero.');
          return false;
        }
        break;
    }
    return true;
  }

  // CONTROLE DO BOTÃO AVANÇAR
  btnAvancar.addEventListener('click', () => {
    if (!validarStep(current)) return;

    if (current < totalSteps - 1) {
      showStep(current + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      salvarAnuncio();
    }
  });

  // Carregar dados se estiver editando
  if (editingAdId) {
    carregarAnuncioParaEdicao();
  }

  showStep(0);

  // UPLOAD DE IMAGENS
  const fileInput = document.getElementById('fileInput');
  const pickFilesBtn = document.getElementById('pickFiles');
  const dropzone = document.getElementById('dropzone');
  const preview = document.getElementById('preview');
  let imageDataUrls = [];

  pickFilesBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--orange)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#cfcfcf';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#cfcfcf';
    if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

  function handleFiles(fileList) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    const files = Array.from(fileList).slice(0, 20 - imageDataUrls.length);
    if (!files.length) return;
    files.forEach(file => {
      if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i)) {
        console.warn('Formato não suportado', file.name);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        imageDataUrls.push(ev.target.result);
        renderPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPreviews() {
    preview.innerHTML = '';
    imageDataUrls.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.title = `Foto ${idx + 1}`;
      
      // Adicionar botão de remover
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '0';
      removeBtn.style.right = '0';
      removeBtn.style.background = 'red';
      removeBtn.style.color = 'white';
      removeBtn.style.border = 'none';
      removeBtn.style.borderRadius = '50%';
      removeBtn.style.width = '20px';
      removeBtn.style.height = '20px';
      removeBtn.style.cursor = 'pointer';
      removeBtn.onclick = () => {
        imageDataUrls.splice(idx, 1);
        renderPreviews();
      };
      
      container.appendChild(img);
      container.appendChild(removeBtn);
      preview.appendChild(container);
    });
  }

  // CARREGAR ANÚNCIO PARA EDIÇÃO
  async function carregarAnuncioParaEdicao() {
    try {
      const response = await fetch(`${API_URL}/anuncios/${editingAdId}`);
      if (!response.ok) throw new Error('Anúncio não encontrado');

      const ad = await response.json();

      const usuarioJSON = sessionStorage.getItem('usuarioCorrente');
      const usuarioAtual = usuarioJSON ? JSON.parse(usuarioJSON) : null;
      if (!usuarioAtual) {
        alert('Faça login para editar anúncios.');
        window.location.href = 'login.html';
        return;
      }

      // guardar id do dono para preservar e verificar permissão
      editingAdOwnerId = ad.userId || null;
      if (!usuarioAtual.isAdmin && usuarioAtual.id !== editingAdOwnerId) {
        alert('Você não tem permissão para editar este anúncio.');
        return;
      }

      // Preencher os campos
      imageDataUrls = ad.images || [];
      renderPreviews();
      document.getElementById('marca').value = ad.marca || '';
      document.getElementById('modelo').value = ad.modelo || '';
      document.getElementById('ano').value = ad.ano || '';
      document.getElementById('quilometragem').value = ad.quilometragem || '';
      document.getElementById('tipo').value = ad.tipo || '';
      document.getElementById('cilindradas').value = ad.cilindradas || '';
      document.getElementById('cor').value = ad.cor || '';
      document.getElementById('combustivel').value = ad.combustivel || '';
      document.getElementById('preco').value = ad.preco || '';
      document.getElementById('descricao').value = ad.descricao || '';

      // Atualizar título da página
      document.title = 'Editar Anúncio - WiseCar';

    } catch (error) {
      console.error('Erro ao carregar anúncio:', error);
      alert('Erro ao carregar anúncio para edição.');
    }
  }

  // PREENCHER RESUMO
  function preencherResumo() {
    const resumoEl = document.getElementById('resumoAnuncio');
    const ad = coletarDados();
    
    resumoEl.innerHTML = `
      <div class="resumo-item"><strong>Fotos:</strong> ${ad.images.length} imagem(ns)</div>
      <div class="resumo-item"><strong>Marca:</strong> ${ad.marca}</div>
      <div class="resumo-item"><strong>Modelo:</strong> ${ad.modelo}</div>
      <div class="resumo-item"><strong>Ano:</strong> ${ad.ano}</div>
      <div class="resumo-item"><strong>Quilometragem:</strong> ${ad.quilometragem} km</div>
      <div class="resumo-item"><strong>Tipo:</strong> ${ad.tipo}</div>
      <div class="resumo-item"><strong>Cilindradas:</strong> ${ad.cilindradas}</div>
      <div class="resumo-item"><strong>Cor:</strong> ${ad.cor}</div>
      <div class="resumo-item"><strong>Combustível:</strong> ${ad.combustivel}</div>
      <div class="resumo-item"><strong>Preço:</strong> R$ ${parseFloat(ad.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <div class="resumo-item"><strong>Descrição:</strong> ${ad.descricao || 'Não informada'}</div>
    `;
  }

  // SALVAR DADOS NO JSON SERVER
  function coletarDados() {
    const ad = {
      images: imageDataUrls.slice(),
      marca: document.getElementById('marca').value.trim(),
      modelo: document.getElementById('modelo').value.trim(),
      ano: document.getElementById('ano').value.trim(),
      quilometragem: document.getElementById('quilometragem').value.trim(),
      tipo: document.getElementById('tipo').value.trim(),
      cilindradas: document.getElementById('cilindradas').value.trim(),
      cor: document.getElementById('cor').value.trim(),
      combustivel: document.getElementById('combustivel').value.trim(),
      preco: document.getElementById('preco').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
      updatedAt: new Date().toISOString()
    };
    
    if (!editingAdId) {
      ad.createdAt = new Date().toISOString();
    }
    
    return ad;
  }

  async function salvarAnuncio() {
    const usuarioJSON = sessionStorage.getItem('usuarioCorrente');
    if (!usuarioJSON) {
      alert('Você precisa fazer login para cadastrar um anúncio.');
      window.location.href = 'login.html';
      return;
    }

    const usuario = JSON.parse(usuarioJSON);
    const ad = coletarDados();
    ad.userId = usuario.id;

    try {
      let response;

      if (editingAdId) {
        // Verificar permissão antes de atualizar
        if (!usuario.isAdmin && usuario.id !== editingAdOwnerId) {
          alert('Você não tem permissão para editar este anúncio.');
          return;
        }

        response = await fetch(`${API_URL}/anuncios/${editingAdId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ad)
        });
      } else {
        // Criar novo anúncio (anexa userId)
        response = await fetch(`${API_URL}/anuncios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ad)
        });
      }

      if (!response.ok) {
        throw new Error('Erro ao salvar anúncio');
      }

      const successMessage = editingAdId 
        ? 'Anúncio atualizado com sucesso!' 
        : 'Anúncio salvo com sucesso!';
        
      alert(`${successMessage} Você será redirecionado para a página de anúncios.`);
      window.location.href = 'anuncios.html';
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar anúncio. Tente novamente.');
    }
  }

})();
function updateProgress() {
  const percent = Math.round(((current) / (totalSteps - 1)) * 100);
  progressInner.style.width = `${Math.max(6, percent)}%`;
  
  // Garantir que a barra de progresso esteja visível
  progressInner.style.visibility = 'visible';
  progressInner.style.opacity = '1';
}