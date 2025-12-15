const chatResposta = document.getElementById('chatResposta');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

sendBtn.addEventListener('click', sendResposta);
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendResposta();
});

function sendResposta() {
  const text = userInput.value.trim();
  if (!text) return;

  appendResposta(text, 'user');
  userInput.value = '';

  // Processar resposta
  setTimeout(() => {
    const resposta = gerarResposta(text);

    appendResposta(resposta.texto, 'bot');

    // Se precisar mostrar o formulário
    if (resposta.mostrarFormulario) {
      setTimeout(() => {
        document.getElementById('formAtendente').style.display = 'flex';
        chatResposta.scrollTop = chatResposta.scrollHeight;
      }, 200);
    }

  }, 600);
}

function appendResposta(text, sender) {
  const msg = document.createElement('div');
  msg.classList.add('resposta', sender);
  msg.textContent = text;
  chatResposta.appendChild(msg);
  chatResposta.scrollTop = chatResposta.scrollHeight;
}

function gerarResposta(text) {
  text = text.toLowerCase();

  if (text.includes('1')) {
    return {
      
      texto: "Por favor, preencha o formulário acima para falar com um atendente.",
      mostrarFormulario: true
      
    };
  }

  if (text.includes('2')) {
    return {
      texto: "Atendemos de segunda a sexta, das 8h às 18h.",
      mostrarFormulario: false
    };
  }

  return {
    texto: "Opção inválida",
    mostrarFormulario: false
  };
}

// Enviar mensagem do formulário via EmailJS
document.getElementById('btnEnviarContato').addEventListener('click', function () {

  const nome = document.getElementById('contatoNome').value.trim();
  const email = document.getElementById('contatoEmail').value.trim();
  const assunto = document.getElementById('contatoAssunto').value.trim();
  const mensagem = document.getElementById('contatoMensagem').value.trim();

  if (!nome || !email || !assunto || !mensagem) {
    alert("Preencha todos os campos.");
    return;
  }

  const EMAILJS_PUBLIC_KEY = "Br_YUV6HnX0JY0Hip";
  const EMAILJS_SERVICE_ID = "service_xgf1hs8";
  const EMAILJS_TEMPLATE_ID = "template_ceehn2k";

  const templateParams = { nome, email, assunto, mensagem };

  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao enviar mensagem");

      appendResposta("Sua mensagem foi enviada! Um atendente responderá em breve.", "bot");
      document.getElementById('formAtendente').style.display = "none";
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao enviar mensagem. Tente novamente.");
    });
});
