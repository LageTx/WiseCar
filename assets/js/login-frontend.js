document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  function showUserInfoInHeader() {
    const userJSON = sessionStorage.getItem('usuarioCorrente');
    const userInfoElem = document.getElementById('userInfo');
    if (!userJSON || !userInfoElem) return;
    const user = JSON.parse(userJSON);
    userInfoElem.innerHTML = `<a href="perfil.html">${user.name || user.email}</a> <a href="#" onclick="logout()" title="Sair">❌</a>`;

    // esconder botões de login/cadastro quando logado
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.style.display = 'none';
    const btnCadastro = document.querySelector('.btn-cadastro-header');
    if (btnCadastro) btnCadastro.style.display = 'none';
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      fetch(`${window.API_URL || 'https://wise-car-vercel.vercel.app'}/users?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(users => {
          if (!users || users.length === 0) {
            alert('E-mail não cadastrado.');
            return;
          }
          const user = users[0];
          if (user.password !== senha) {
            alert('Senha inválida.');
            return;
          }

          const usuarioCorrente = {
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: !!user.isAdmin,
            favorites: user.favorites || []
          };

          sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));

          // Redireciona para a página inicial
          window.location.href = 'index.html';
        })
        .catch(err => {
          console.error('Erro ao acessar servidor:', err);
          alert('Erro de conexão com o servidor. Verifique se o JSON Server está rodando.');
        });
    });
  }

  showUserInfoInHeader();
});

function logout() {
  sessionStorage.removeItem('usuarioCorrente');
  window.location.href = 'index.html';
}
