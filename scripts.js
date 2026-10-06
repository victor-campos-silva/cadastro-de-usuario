
// Cadastro de usuário: busca de endereço por CEP (ViaCEP) + localStorage

const registroUsuario = 'cadastroUsuario';

const form = document.getElementById('form-cadastro');
const campoCep = document.getElementById('cep');
const statusCep = document.getElementById('status-cep');
const statusForm = document.getElementById('status-form');
const btnLimpar = document.getElementById('btn-limpar');

// Campos do formulário que serão salvos e restaurados

const CAMPOS = [
  'nome', 'email', 'telefone',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'
];

// Web Storage

function salvarDados() {
  const dados = {};
  CAMPOS.forEach((nome) => {
    dados[nome] = form.elements[nome].value;
  });

  try {
    localStorage.setItem(registroUsuario, JSON.stringify(dados));
  } catch (erro) {
    console.error('Não foi possível salvar no localStorage:', erro);
  }
}

function restaurarDados() {
  let dados;

  try {
    dados = JSON.parse(localStorage.getItem(registroUsuario));
  } catch (erro) {
    console.error('Dados salvos inválidos:', erro);
    return;
  }

  if (!dados) return;

  CAMPOS.forEach((nome) => {
    if (dados[nome] !== undefined) {
      form.elements[nome].value = dados[nome];
    }
  });
}

function limparDados() {
  localStorage.removeItem(registroUsuario);
  form.reset();
  mostrarStatus(statusCep, '');
  mostrarStatus(statusForm, 'Formulário limpo e dados removidos deste navegador.', 'ok');
}

// Utilitários de interface

function mostrarStatus(elemento, mensagem, tipo = '') {
  elemento.textContent = mensagem;
  elemento.className = tipo ? `status status-${tipo}` : 'status';
}

// Aplica a máscara 00000-000 e devolve apenas os dígitos

function formatarCep(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

function preencherEndereco(endereco) {
  form.elements.logradouro.value = endereco.logradouro || '';
  form.elements.bairro.value = endereco.bairro || '';
  form.elements.cidade.value = endereco.localidade || '';
  form.elements.uf.value = endereco.uf || '';
}

// Fetch API: consulta ao ViaCEP

async function buscarEndereco(cep) {
  mostrarStatus(statusCep, 'Buscando endereço...');

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const endereco = await resposta.json();

    // Se o usuário alterou o CEP enquanto a busca rodava, ignora o resultado antigo
    
    if (campoCep.value.replace(/\D/g, '') !== cep) return;

    // O ViaCEP responde com erro quando o CEP não existe
    
    if (endereco.erro) {
      mostrarStatus(statusCep, 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.', 'erro');
      return;
    }

    preencherEndereco(endereco);
    mostrarStatus(statusCep, 'Endereço preenchido.', 'ok');
    salvarDados();
    form.elements.numero.focus();
  } catch (erro) {
    console.error('Falha ao consultar o ViaCEP:', erro);
    mostrarStatus(statusCep, 'Não foi possível buscar o CEP agora. Preencha o endereço manualmente.', 'erro');
  }
}

// Eventos

// CEP formata enquanto digita e busca quando completar 8 dígitos

campoCep.addEventListener('input', () => {
  campoCep.value = formatarCep(campoCep.value);

  const cep = campoCep.value.replace(/\D/g, '');

  if (cep.length === 8) {
    buscarEndereco(cep);
  } else {
    mostrarStatus(statusCep, '');
  }
});

// Salva todos os campos conforme o usuário digita

form.addEventListener('input', () => {
  salvarDados();
  mostrarStatus(statusForm, '');
});

// Envio valida, salva e confirma

form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  salvarDados();
  mostrarStatus(statusForm, 'Cadastro salvo neste navegador.', 'ok');
});

btnLimpar.addEventListener('click', limparDados);

// Ao carregar a página restaura o que foi salvo

restaurarDados();
