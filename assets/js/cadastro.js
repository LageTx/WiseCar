document.addEventListener('DOMContentLoaded', () => {
    
    const cadastroForm = document.getElementById('cadastroForm');

    cadastroForm.addEventListener('submit', (event) => {
        
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const repitaSenha = document.getElementById('repitaSenha').value;

        const erros = [];
        
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!regexEmail.test(email)) {
            erros.push('O e-mail inserido não possui um formato válido (ex: seu.nome@dominio.com).');
        }

        if (senha !== repitaSenha) {
            erros.push('As senhas digitadas não coincidem.');
            document.getElementById('repitaSenha').value = ''; 
        }

        const errosDeSenha = [];

        const temNumero = /\d/.test(senha);
        const temMaiuscula = /[A-Z]/.test(senha);
        const temEspecial = /[^A-Za-z0-9]/.test(senha); 

        if (senha.length < 8) {
            errosDeSenha.push('Ter no mínimo 8 caracteres.');
        }
        if (!temNumero) {
            errosDeSenha.push('Conter pelo menos um número (0-9).');
        }
        if (!temMaiuscula) {
            errosDeSenha.push('Conter pelo menos uma letra maiúscula (A-Z).');
        }
        if (!temEspecial) {
            errosDeSenha.push('Conter pelo menos um caractere especial (ex: !@#$%).');
        }
        
        if (errosDeSenha.length > 0) {
            const mensagemSenha = 'A senha deve atender aos requisitos:\n- ' + errosDeSenha.join('\n- ');
            erros.push(mensagemSenha);
        }

        if (erros.length > 0) {
            
            const mensagemFinal = erros.join('\n\n'); 
            alert('Atenção, o cadastro não pode ser concluído:\n\n' + mensagemFinal);
            return;
        }
        
        const formData = {
            name: nome,
            email: email,
            password: senha,
            isAdmin: false,
            favorites: []
        };

        // Verifica se email já existe no JSON Server
        fetch(`${window.API_URL || 'https://wise-car-vercel.vercel.app'}/users?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(existing => {
                if (existing && existing.length > 0) {
                    alert('Já existe uma conta cadastrada com este e-mail.');
                    return;
                }

                // Insere novo usuário
                fetch(`${window.API_URL || 'https://wise-car-vercel.vercel.app'}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                .then(resp => {
                    if (!resp.ok) throw new Error('Erro ao criar usuário');
                    return resp.json();
                })
                .then(data => {
                    alert('Cadastro realizado com sucesso! Redirecionando para login...');
                    window.location.href = 'login.html';
                })
                .catch(err => {
                    console.error(err);
                    alert('Erro ao salvar cadastro. Tente novamente mais tarde.');
                });
            })
            .catch(err => {
                console.error('Erro ao verificar e-mail:', err);
                alert('Erro ao verificar e-mail. Tente novamente mais tarde.');
            });
        
        
    });
});