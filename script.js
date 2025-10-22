// Novas chaves para armazenar os cadastros de itens e equipes
const STORAGE_KEY = 'controleFerramentasDiario';
const STORAGE_FERRAMENTAS = 'cadastroFerramentas';
const STORAGE_EQUIPES = 'cadastroEquipes';

document.addEventListener('DOMContentLoaded', () => {
    // Carrega e exibe os dados existentes
    renderizarTabela(carregarRegistros());
    
    // NOVO: Carrega e exibe as sugestões de cadastros
    renderizarCadastros('listaFerramentas', carregarCadastros(STORAGE_FERRAMENTAS));
    renderizarCadastros('listaEquipes', carregarCadastros(STORAGE_EQUIPES));

    // 1. Lógica para registrar uma nova retirada
    document.getElementById('registroForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const ferramentaNome = document.getElementById('ferramenta').value.trim();
        const equipeNome = document.getElementById('equipe').value.trim();
        
        // NOVO: Adiciona a ferramenta e a equipe aos seus cadastros
        adicionarCadastro(STORAGE_FERRAMENTAS, ferramentaNome);
        adicionarCadastro(STORAGE_EQUIPES, equipeNome);

        const novoRegistro = {
            id: Date.now(),
            pessoa: document.getElementById('pessoa').value.trim(),
            ferramenta: ferramentaNome,
            equipe: equipeNome,
            quantidade: parseInt(document.getElementById('quantidade').value),
            dataRetirada: new Date().toLocaleString('pt-BR'),
            devolvida: false
        };

        const registros = carregarRegistros();
        registros.push(novoRegistro);
        salvarRegistros(registros);
        
        aplicarFiltrosEPesquisa();

        // Limpar o formulário após o envio, exceto os campos de quantidade (mantém 1)
        document.getElementById('pessoa').value = '';
        document.getElementById('ferramenta').value = '';
        document.getElementById('equipe').value = '';
    });

    // 2. Lógica para limpar todos os registros
    document.getElementById('limparRegistros').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar TODOS os registros? Esta ação não pode ser desfeita. Use isso ao final do dia.')) {
            salvarRegistros([]); 
            renderizarTabela([]);
            // Você pode optar por limpar ou não os cadastros aqui. 
            // Vou manter eles, mas você pode remover se quiser um "reset total" diário.
            alert('Registros diários limpos com sucesso!');
        }
    });

    // 3. Lógica para marcar como devolvido
    document.getElementById('tabelaControle').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-devolver')) {
            const id = parseInt(e.target.dataset.id);
            marcarComoDevolvido(id);
        }
    });

    // 4. Eventos de Filtro e Pesquisa
    const filtroStatus = document.getElementById('filtroStatus');
    const campoBusca = document.getElementById('campoBusca');

    filtroStatus.addEventListener('change', aplicarFiltrosEPesquisa);
    campoBusca.addEventListener('input', aplicarFiltrosEPesquisa);
});


/**
 * Funções de CADASTRO (Ferramentas e Equipes)
 */

function carregarCadastros(chave) {
    const dados = localStorage.getItem(chave);
    // Retorna um array de strings, em ordem alfabética, ou um array vazio
    return dados ? JSON.parse(dados).sort() : [];
}

function salvarCadastros(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(lista));
}

function adicionarCadastro(chave, valor) {
    const valorCapitalizado = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase(); // Padroniza a capitalização
    
    let lista = carregarCadastros(chave);
    
    // Verifica se o item já existe para evitar duplicatas
    if (valorCapitalizado && !lista.includes(valorCapitalizado)) {
        lista.push(valorCapitalizado);
        lista.sort(); // Mantém em ordem alfabética
        salvarCadastros(chave, lista);
        renderizarCadastros(chave === STORAGE_FERRAMENTAS ? 'listaFerramentas' : 'listaEquipes', lista);
    }
}

function renderizarCadastros(datalistId, cadastros) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = ''; // Limpa as opções existentes
    
    cadastros.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });
}


/**
 * Funções de ESTOQUE (Registros Diários) - Sem grandes mudanças
 */

function carregarRegistros() {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
}

function salvarRegistros(registros) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function marcarComoDevolvido(id) {
    const registros = carregarRegistros();
    const indice = registros.findIndex(registro => registro.id === id);

    if (indice !== -1) {
        registros[indice].devolvida = true;
        registros[indice].dataDevolucao = new Date().toLocaleString('pt-BR');
        
        salvarRegistros(registros);
        aplicarFiltrosEPesquisa(); 
    }
}

function aplicarFiltrosEPesquisa() {
    let registros = carregarRegistros();
    
    const status = document.getElementById('filtroStatus').value;
    const termoBusca = document.getElementById('campoBusca').value.toLowerCase();

    // 1. Filtrar por Status
    if (status === 'pendentes') {
        registros = registros.filter(r => r.devolvida === false);
    } else if (status === 'devolvidas') {
        registros = registros.filter(r => r.devolvida === true);
    }

    // 2. Filtrar por Pesquisa (Pessoa, Ferramenta ou Equipe)
    if (termoBusca) {
        registros = registros.filter(r => 
            r.pessoa.toLowerCase().includes(termoBusca) ||
            r.ferramenta.toLowerCase().includes(termoBusca) ||
            r.equipe.toLowerCase().includes(termoBusca)
        );
    }

    // 3. Renderizar o resultado filtrado
    renderizarTabela(registros);
}

function renderizarTabela(registros) {
    const tbody = document.querySelector('#tabelaControle tbody');
    tbody.innerHTML = ''; 

    if (registros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum registro encontrado com os filtros atuais.</td></tr>';
        return;
    }

    registros.sort((a, b) => (a.devolvida === b.devolvida) ? 0 : a.devolvida ? 1 : -1);

    registros.forEach(registro => {
        const tr = document.createElement('tr');
        tr.className = registro.devolvida ? 'devolvida' : 'nao-devolvida';

        const statusTexto = registro.devolvida ? `SIM (${registro.dataDevolucao.split(' ')[1]})` : 'NÃO';
        const acao = registro.devolvida 
            ? 'Devolvido' 
            : `<button class="btn-devolver" data-id="${registro.id}">Devolver</button>`;

        // ATENÇÃO: Adicione os data-labels para melhorar a visualização em telas pequenas (se você usar o CSS responsivo)
        tr.innerHTML = `
            <td data-label="Pessoa">${registro.pessoa}</td>
            <td data-label="Ferramenta">${registro.ferramenta}</td>
            <td data-label="Equipe">${registro.equipe}</td>
            <td data-label="Qtd">${registro.quantidade}</td>
            <td data-label="Retirada">${registro.dataRetirada.split(' ')[1]}</td>
            <td data-label="Status">${statusTexto}</td>
            <td data-label="Ação">${acao}</td>
        `;

        tbody.appendChild(tr);
    });
}