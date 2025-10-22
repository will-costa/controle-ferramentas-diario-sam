// Chaves para armazenar os dados no LocalStorage
const STORAGE_KEY = 'controleFerramentasDiario';
const STORAGE_FERRAMENTAS = 'cadastroFerramentas';
const STORAGE_EQUIPES = 'cadastroEquipes';

document.addEventListener('DOMContentLoaded', () => {
    // Carrega e exibe os dados existentes
    renderizarTabela(carregarRegistros());
    
    // Carrega e exibe as sugestões de cadastros
    renderizarCadastros('listaFerramentas', carregarCadastros(STORAGE_FERRAMENTAS));
    renderizarCadastros('listaEquipes', carregarCadastros(STORAGE_EQUIPES));

    // Event Listeners (Ouvintes de Eventos)
    document.getElementById('registroForm').addEventListener('submit', handleRegistroFormSubmit);
    document.getElementById('limparRegistros').addEventListener('click', handleLimparRegistros);
    document.getElementById('tabelaControle').addEventListener('click', handleTabelaAcoes);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltrosEPesquisa);
    document.getElementById('campoBusca').addEventListener('input', aplicarFiltrosEPesquisa);
    document.getElementById('exportarExcel').addEventListener('click', exportarParaExcel);
    document.getElementById('exportarPDF').addEventListener('click', exportarParaPDF);
});


// --- HANDLERS DE EVENTOS ---

function handleRegistroFormSubmit(e) {
    e.preventDefault();
    
    const ferramentaNome = document.getElementById('ferramenta').value.trim();
    const equipeNome = document.getElementById('equipe').value.trim();
    
    // Adiciona a ferramenta e a equipe aos seus cadastros
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

    // Limpar campos
    document.getElementById('pessoa').value = '';
    document.getElementById('ferramenta').value = '';
    document.getElementById('equipe').value = '';
}

function handleLimparRegistros() {
    if (confirm('Tem certeza que deseja limpar TODOS os registros? Esta ação não pode ser desfeita. Use isso ao final do dia.')) {
        salvarRegistros([]);
        renderizarTabela([]);
        alert('Registros diários limpos com sucesso!');
    }
}

function handleTabelaAcoes(e) {
    if (e.target.classList.contains('btn-devolver')) {
        const id = parseInt(e.target.dataset.id);
        marcarComoDevolvido(id);
    }
}


// --- FUNÇÕES DE ARMAZENAMENTO E CADASTRO ---

function carregarRegistros() {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
}

function salvarRegistros(registros) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function carregarCadastros(chave) {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados).sort() : [];
}

function salvarCadastros(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(lista));
}

function adicionarCadastro(chave, valor) {
    const valorCapitalizado = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
    
    let lista = carregarCadastros(chave);
    
    if (valorCapitalizado && !lista.includes(valorCapitalizado)) {
        lista.push(valorCapitalizado);
        lista.sort();
        salvarCadastros(chave, lista);
        renderizarCadastros(chave === STORAGE_FERRAMENTAS ? 'listaFerramentas' : 'listaEquipes', lista);
    }
}

function renderizarCadastros(datalistId, cadastros) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = '';
    
    cadastros.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });
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


// --- FUNÇÕES DE FILTRO E VISUALIZAÇÃO ---

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

    renderizarTabela(registros);
}

function renderizarTabela(registros) {
    const tbody = document.querySelector('#tabelaControle tbody');
    tbody.innerHTML = ''; 

    if (registros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum registro encontrado com os filtros atuais.</td></tr>';
        return;
    }

    // Ordena: não devolvidos primeiro
    registros.sort((a, b) => (a.devolvida === b.devolvida) ? 0 : a.devolvida ? 1 : -1);

    registros.forEach(registro => {
        const tr = document.createElement('tr');
        tr.className = registro.devolvida ? 'devolvida' : 'nao-devolvida';

        const statusTexto = registro.devolvida ? `SIM (${registro.dataDevolucao.split(' ')[1]})` : 'NÃO';
        const acao = registro.devolvida 
            ? 'Devolvido' 
            : `<button class="btn-devolver" data-id="${registro.id}">Devolver</button>`;

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


// --- FUNÇÕES DE EXPORTAÇÃO (PDF e Excel) ---

function prepararDadosParaExportacao() {
    // Carrega os registros ATUAIS da tela (com filtros aplicados)
    let registros = carregarRegistros();
    
    const status = document.getElementById('filtroStatus').value;
    const termoBusca = document.getElementById('campoBusca').value.toLowerCase();
    
    // Aplica os filtros novamente (para garantir que só o visível seja exportado)
    if (status === 'pendentes') {
        registros = registros.filter(r => r.devolvida === false);
    } else if (status === 'devolvidas') {
        registros = registros.filter(r => r.devolvida === true);
    }
    if (termoBusca) {
        registros = registros.filter(r => 
            r.pessoa.toLowerCase().includes(termoBusca) || r.ferramenta.toLowerCase().includes(termoBusca) || r.equipe.toLowerCase().includes(termoBusca)
        );
    }
    
    // Mapeamos para o formato de array
    const corpoTabela = registros.map(registro => [
        registro.pessoa,
        registro.ferramenta,
        registro.equipe,
        registro.quantidade,
        registro.dataRetirada,
        registro.devolvida ? `Sim (${registro.dataDevolucao.split(' ')[1]})` : 'Não'
    ]);

    const cabecalho = ['Pessoa', 'Ferramenta', 'Equipe', 'Qtd', 'Retirada', 'Status/Devolução'];

    return { cabecalho, corpoTabela };
}

function exportarParaExcel() {
    const { cabecalho, corpoTabela } = prepararDadosParaExportacao();
    
    // Converte para CSV (separado por ponto e vírgula)
    let csv = [
        cabecalho.join(';'),
        ...corpoTabela.map(linha => linha.join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const nomeArquivo = `Controle_Ferramentas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}.csv`;
    
    // saveAs é da biblioteca FileSaver
    saveAs(blob, nomeArquivo);
}

function exportarParaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4'); // Paisagem (A4)
    
    const { cabecalho, corpoTabela } = prepararDadosParaExportacao();

    doc.setFontSize(16);
    doc.text("Relatório de Controle de Ferramentas", 40, 40);

    doc.autoTable({
        startY: 60,
        head: [cabecalho],
        body: corpoTabela,
        theme: 'striped',
        styles: { 
            fontSize: 10,
        },
        headStyles: { 
            fillColor: [51, 78, 104], 
            textColor: 255 
        }
    });

    const nomeArquivo = `Relatorio_Ferramentas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}.pdf`;
    doc.save(nomeArquivo);
}
