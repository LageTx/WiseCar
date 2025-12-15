 const venderBtn = document.getElementById('venderBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    function atualizarInterface() {
      const logado = localStorage.getItem('usuarioLogado') === 'true';
      venderBtn.style.display = logado ? 'inline-block' : 'none';
      loginBtn.style.display = logado ? 'none' : 'inline-block';
      logoutBtn.style.display = logado ? 'inline-block' : 'none';
    }

    loginBtn.addEventListener('click', () => {
      localStorage.setItem('usuarioLogado', 'true');
      atualizarInterface();
    });

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      atualizarInterface();
    });
    // Verifica o login ao carregar a página
    atualizarInterface();