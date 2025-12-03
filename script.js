// Aplicativo de Controle de Vendas e Impostos - VERSÃO CORRIGIDA
// ========== PARAMETRIZAÇÃO TRIBUTÁRIA ==========

// Inicializar dados de parametrização
function initParametrizacao() {
    if (!localStorage.getItem('paramFaixasSimples')) {
        localStorage.setItem('paramFaixasSimples', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('paramConfigPresumido')) {
        localStorage.setItem('paramConfigPresumido', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('paramConfigReal')) {
        localStorage.setItem('paramConfigReal', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('paramHistorico')) {
        localStorage.setItem('paramHistorico', JSON.stringify([]));
    }
}

// ========== FUNÇÃO DE EXPORTAÇÃO DA PARAMETRIZAÇÃO ==========
function exportarParametrizacao() {
    const dados = {
        parametrizacao: {
            faixasSimples: JSON.parse(localStorage.getItem('paramFaixasSimples')),
            configPresumido: JSON.parse(localStorage.getItem('paramConfigPresumido')),
            configReal: JSON.parse(localStorage.getItem('paramConfigReal')),
            historicoParam: JSON.parse(localStorage.getItem('paramHistorico'))
        },
        dataExportacao: new Date().toISOString(),
        versao: '2.0',
        tipo: 'apenas-parametrizacao'
    };
    
    const dadosJSON = JSON.stringify(dados, null, 2);
    const blob = new Blob([dadosJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `parametrizacao-vendas-impostos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const mensagem = `Parametrização exportada com sucesso!\n` +
        `• ${dados.parametrizacao.faixasSimples.length} faixa(s) do Simples\n` +
        `• ${dados.parametrizacao.configPresumido.length} configuração(ões) do Presumido\n` +
        `• ${dados.parametrizacao.configReal.length} configuração(ões) do Real`;
    
    mostrarMensagem(mensagem);
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos online
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Inicializar o aplicativo
    initApp();
	initParametrizacao();
    
    // Registrar Service Worker para funcionamento offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(() => console.log('Service Worker registrado com sucesso'))
            .catch(error => console.log('Erro ao registrar Service Worker:', error));
    }
    
    // Configurar eventos das abas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
	
	// Configurar abas da parametrização
    document.querySelectorAll('.sub-tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const subtabId = button.getAttribute('data-subtab');
            switchSubTab(subtabId);
        });
    });
    
    // Configurar eventos dos formulários
    document.getElementById('clienteForm').addEventListener('submit', salvarCliente);
    document.getElementById('limparCliente').addEventListener('click', limparFormCliente);
    
    document.getElementById('situacaoForm').addEventListener('submit', salvarSituacao);
    document.getElementById('limparSituacao').addEventListener('click', function() {
		limparFormSituacao();
		mostrarMensagem('Formulário limpo. Edição cancelada.');
	});
    
    document.getElementById('vendasForm').addEventListener('submit', salvarVendas);
    document.getElementById('limparVendas').addEventListener('click', limparFormVendas);
    
    // Configurar eventos dos botões de ação
    document.getElementById('calcularImpostos').addEventListener('click', calcularImpostos);
    document.getElementById('aplicarFiltro').addEventListener('click', aplicarFiltroHistorico);
    document.getElementById('exportarDados').addEventListener('click', exportarDados);
    document.getElementById('importarDados').addEventListener('click', importarDados);
    document.getElementById('limparTudo').addEventListener('click', confirmarLimpezaDados);
	document.getElementById('exportarParametrizacao').addEventListener('click', exportarParametrizacao);
    
    // Configurar modal
    document.getElementById('modalCancel').addEventListener('click', fecharModal);
    document.getElementById('modalConfirm').addEventListener('click', confirmarAcaoModal);
    
    // Adicionar máscaras aos campos
    document.getElementById('cnpj').addEventListener('input', formatarCNPJInput);
    document.getElementById('ie').addEventListener('input', formatarNumeros);
    document.getElementById('im').addEventListener('input', formatarNumeros);
    
	// Configurar formulários de parametrização
    document.getElementById('formFaixaSimples').addEventListener('submit', salvarFaixaSimples);
    document.getElementById('novaFaixaSimples').addEventListener('click', novaFaixaSimples);
    document.getElementById('limparFaixa').addEventListener('click', limparFormFaixaSimples);
    
    document.getElementById('formConfigPresumido').addEventListener('submit', salvarConfigPresumido);
    document.getElementById('novaConfigPresumido').addEventListener('click', novaConfigPresumido);
    document.getElementById('limparConfigPresumido').addEventListener('click', limparFormConfigPresumido);
    
    document.getElementById('formConfigReal').addEventListener('submit', salvarConfigReal);
    document.getElementById('novaConfigReal').addEventListener('click', novaConfigReal);
    document.getElementById('limparConfigReal').addEventListener('click', limparFormConfigReal);
    
    // Configurar filtros do histórico
    document.getElementById('aplicarFiltroHistorico').addEventListener('click', aplicarFiltroHistoricoParam);
    document.getElementById('limparFiltroHistorico').addEventListener('click', limparFiltroHistoricoParam);
	
    // Carregar dados iniciais
    carregarClientes();
    carregarSituacoes();
    carregarVendas();
    atualizarSelects();
	carregarFaixasSimples();
    carregarConfigsPresumido();
    carregarConfigsReal();
    carregarHistoricoParam();
});

// Inicializar armazenamento de dados
function initApp() {
    // Inicializar dados no localStorage se não existirem
    if (!localStorage.getItem('clientes')) {
        localStorage.setItem('clientes', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('situacoes')) {
        localStorage.setItem('situacoes', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('vendas')) {
        localStorage.setItem('vendas', JSON.stringify([]));
    }
}

// Atualizar status online/offline
function updateOnlineStatus() {
    const statusElement = document.getElementById('offlineStatus');
    if (navigator.onLine) {
        statusElement.innerHTML = '<i class="fas fa-wifi"></i> <span>Online</span>';
        statusElement.style.color = '';
    } else {
        statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Offline</span>';
        statusElement.style.color = '#f56565';
    }
}

// Alternar entre abas
function switchTab(tabId) {
    // Remover classe active de todas as abas e botões
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adicionar classe active à aba selecionada
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}Tab`).classList.add('active');
    
    // Atualizar selects se necessário
    if (tabId === 'situacao' || tabId === 'vendas' || tabId === 'calculo' || tabId === 'historico') {
        atualizarSelects();
    }
}

function switchSubTab(subtabId) {
    // Remover classe active de todas as subtabs e botões
    document.querySelectorAll('.sub-tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.querySelectorAll('.sub-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adicionar classe active à subtab selecionada
    document.querySelector(`[data-subtab="${subtabId}"]`).classList.add('active');
    document.getElementById(`${subtabId}Tab`).classList.add('active');
}

// ========== GERENCIAMENTO DE CLIENTES ==========
function salvarCliente(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const cnpj = document.getElementById('cnpj').value.replace(/\D/g, '');
    const ie = document.getElementById('ie').value.replace(/\D/g, '');
    const im = document.getElementById('im').value;
    const razaoSocial = document.getElementById('razaoSocial').value.trim();
    const nomeFantasia = document.getElementById('nomeFantasia').value.trim();
    const dataAbertura = document.getElementById('dataAbertura').value;
    
      // VALIDAÇÃO DO CNPJ (DÍGITOS VERIFICADORES) - NOVA VALIDAÇÃO
    if (!validarCNPJ(cnpj)) {
        const cnpjFormatado = document.getElementById('cnpj').value;
        mostrarModal('CNPJ Inválido', 
            `O CNPJ informado não é válido.\n\n` +
            `CNPJ: ${cnpjFormatado || '(vazio)'}\n\n` +
            `Verifique os dígitos e tente novamente.\n` +
            `Exemplo de CNPJ válido: 00.000.000/0001-91`);
        document.getElementById('cnpj').focus();
        return;
    }
    
    if (!razaoSocial) {
        mostrarModal('Erro de Validação', 'Razão Social é obrigatória.');
        document.getElementById('razaoSocial').focus();
        return;
    }
    
    if (!nomeFantasia) {
        mostrarModal('Erro de Validação', 'Nome Fantasia é obrigatório.');
        document.getElementById('nomeFantasia').focus();
        return;
    }
    
    if (!dataAbertura) {
        mostrarModal('Erro de Validação', 'Data de Abertura é obrigatória.');
        document.getElementById('dataAbertura').focus();
        return;
    }
    
	// Validar CNPJ
    if (!cnpj || cnpj.length !== 14) {
        // Tentar ajudar o usuário mostrando como deve ser
        const cnpjAtual = document.getElementById('cnpj').value;
        mostrarModal('CNPJ Inválido', 
            `O CNPJ deve conter 14 dígitos numéricos.\n\n` +
            `Você digitou: ${cnpjAtual || '(vazio)'}\n` +
            `Números encontrados: ${cnpj.length}\n\n` +
            `Formato correto: 00.000.000/0000-00`);
        document.getElementById('cnpj').focus();
        return;
    }
	
    // Verificar se CNPJ já existe
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const clienteExistente = clientes.find(cliente => cliente.cnpj === cnpj);
    
    if (clienteExistente) {
        mostrarModal('Cliente Existente', 
            `Já existe um cliente cadastrado com este CNPJ:\n\n` +
            `Empresa: ${clienteExistente.nomeFantasia}\n` +
            `Razão Social: ${clienteExistente.razaoSocial}\n\n` +
            'Deseja atualizar os dados?', 
        () => {
            // Atualizar cliente existente
            const index = clientes.findIndex(cliente => cliente.cnpj === cnpj);
            clientes[index] = {
                cnpj, 
                ie, 
                im, 
                razaoSocial, 
                nomeFantasia, 
                dataAbertura,
                dataCadastro: clienteExistente.dataCadastro,
                dataAtualizacao: new Date().toISOString()
            };
            localStorage.setItem('clientes', JSON.stringify(clientes));
            carregarClientes();
            atualizarSelects();
            mostrarMensagem('Cliente atualizado com sucesso!');
            
            // Não limpar o formulário para visualização
            // limparFormCliente();
        });
        return;
    }
    
    // Criar novo cliente
    const novoCliente = {
        cnpj, 
        ie, 
        im, 
        razaoSocial, 
        nomeFantasia, 
        dataAbertura,
        dataCadastro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    // Salvar no localStorage
    clientes.push(novoCliente);
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    // Atualizar interface
    carregarClientes();
    atualizarSelects();
    
    // Mostrar mensagem de sucesso sem limpar o formulário
    mostrarMensagem(`Cliente "${nomeFantasia}" cadastrado com sucesso!`);
    
    // Manter dados no formulário para conferência
    // Opcional: descomente a linha abaixo se quiser limpar após salvar
    // setTimeout(() => limparFormCliente(), 2000);
}

function limparFormCliente() {
    document.getElementById('clienteForm').reset();
}

function carregarClientes() {
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const listaClientes = document.getElementById('listaClientes');
    
    if (!clientes || clientes.length === 0) {
        listaClientes.innerHTML = '<div class="placeholder"><p>Nenhum cliente cadastrado ainda.</p></div>';
        return;
    }
    
    // Ordenar por nome fantasia
    clientes.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
    
    listaClientes.innerHTML = '';
    
    clientes.forEach(cliente => {
        const item = document.createElement('div');
        item.className = 'item-lista';
        item.innerHTML = `
            <div class="item-info">
                <h4>${cliente.nomeFantasia}</h4>
                <p><strong>Razão Social:</strong> ${cliente.razaoSocial}</p>
                <p><strong>CNPJ:</strong> ${formatarCNPJ(cliente.cnpj)} | <strong>Data Abertura:</strong> ${formatarData(cliente.dataAbertura)}</p>
                <p><strong>IE:</strong> ${cliente.ie || 'Não informada'} | <strong>IM:</strong> ${cliente.im || 'Não informada'}</p>
                <p><small>Cadastrado em: ${formatarDataHora(cliente.dataCadastro)}</small></p>
            </div>
            <div class="item-acoes">
                <button class="btn-secondary" onclick="editarCliente('${cliente.cnpj}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-secondary" onclick="excluirCliente('${cliente.cnpj}')"><i class="fas fa-trash-alt"></i> Excluir</button>
            </div>
        `;
        listaClientes.appendChild(item);
    });
}

function editarCliente(cnpj) {
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const cliente = clientes.find(c => c.cnpj === cnpj);
    
    if (cliente) {
        // Formatar CNPJ para exibição
        const cnpjFormatado = formatarCNPJ(cliente.cnpj);
        
        document.getElementById('cnpj').value = cnpjFormatado;
        document.getElementById('ie').value = cliente.ie || '';
        document.getElementById('im').value = cliente.im || '';
        document.getElementById('razaoSocial').value = cliente.razaoSocial;
        document.getElementById('nomeFantasia').value = cliente.nomeFantasia;
        document.getElementById('dataAbertura').value = cliente.dataAbertura;
        
        // Adicionar indicador visual que está editando
        const titulo = document.querySelector('#clienteTab h2');
        const originalTitulo = titulo.innerHTML;
        titulo.innerHTML = '<i class="fas fa-user-tie"></i> Editando Cliente/Empresa';
        
        // Alterar texto do botão de submit
        const submitBtn = document.querySelector('#clienteForm .btn-primary');
        const originalTexto = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Cadastro';
        
		// Buscar situação atual da empresa
        const situacoes = JSON.parse(localStorage.getItem('situacoes'));
        const situacoesEmpresa = situacoes
            .filter(s => s.cnpjEmpresa === cnpj)
            .sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));
        
        const situacaoAtual = situacoesEmpresa.length > 0 ? situacoesEmpresa[0] : null;
        
        if (situacaoAtual) {
            // Preencher informações da situação se quiser mostrar
            console.log('Situação atual:', situacaoAtual);
        }
		
        // Restaurar quando sair da aba
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.target.classList.contains('active')) {
                    titulo.innerHTML = originalTitulo;
                    submitBtn.innerHTML = originalTexto;
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(document.getElementById('clienteTab'), { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        // Ir para a aba de cadastro
        switchTab('cliente');
        
        // Focar no primeiro campo
        document.getElementById('cnpj').focus();
    }
}

function excluirCliente(cnpj) {
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const cliente = clientes.find(c => c.cnpj === cnpj);
    
    if (!cliente) return;
    
    mostrarModal('Excluir Cliente', 
        `Tem certeza que deseja excluir este cliente?\n\n` +
        `Empresa: ${cliente.nomeFantasia}\n` +
        `CNPJ: ${formatarCNPJ(cnpj)}\n\n` +
        `Esta ação também excluirá todas as situações e vendas relacionadas.`, 
    () => {
        const clientesAtualizados = clientes.filter(cliente => cliente.cnpj !== cnpj);
        localStorage.setItem('clientes', JSON.stringify(clientesAtualizados));
        
        // Remover também situações e vendas relacionadas
        removerDadosRelacionados(cnpj);
        
        carregarClientes();
        atualizarSelects();
        mostrarMensagem('Cliente excluído com sucesso!');
    });
}

// ========== GERENCIAMENTO DE SITUAÇÕES - VERSÃO CORRIGIDA ==========
function salvarSituacao(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const dataSituacao = document.getElementById('dataSituacao').value;
    const endereco = document.getElementById('endereco').value.trim();
    const tributacao = document.getElementById('tributacao').value;
    const cnpjEmpresa = document.getElementById('cnpjEmpresa').value;
    const anexoSimples = tributacao === 'simples' ? document.getElementById('anexoSimples').value : null;
    const atividadesAnexo = tributacao === 'simples' ? document.getElementById('atividadesAnexo').value.trim() : null;
    const situacaoId = document.getElementById('situacaoId') ? document.getElementById('situacaoId').value : null;
    
    // Validações básicas
    if (!cnpjEmpresa) {
        mostrarModal('Erro', 'Selecione uma empresa para registrar a situação.');
        return;
    }
    
    if (!endereco) {
        mostrarModal('Erro', 'Endereço é obrigatório.');
        document.getElementById('endereco').focus();
        return;
    }
    
    if (!dataSituacao) {
        mostrarModal('Erro', 'Data da situação é obrigatória.');
        document.getElementById('dataSituacao').focus();
        return;
    }
    
    // Buscar dados da empresa
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    
    if (!empresa) {
        mostrarModal('Erro', 'Empresa não encontrada.');
        return;
    }
    
    // **CORREÇÃO 1: VALIDAÇÃO RIGOROSA DA DATA DE ABERTURA**
    const dataAbertura = new Date(empresa.dataAbertura);
    const dataSituacaoObj = new Date(dataSituacao);
    
    // Ajustar para comparar apenas a data (ignorar hora)
    dataAbertura.setHours(0, 0, 0, 0);
    dataSituacaoObj.setHours(0, 0, 0, 0);
    
    console.log('Data abertura:', dataAbertura, 'Data situação:', dataSituacaoObj);
    
    if (dataSituacaoObj < dataAbertura) {
        mostrarModal('Erro de Validação', 
            `A data da situação (${formatarData(dataSituacao)}) não pode ser anterior à data de abertura da empresa (${formatarData(empresa.dataAbertura)}).\n\n` +
            `Data de abertura: ${formatarData(empresa.dataAbertura)}\n` +
            `Data da situação: ${formatarData(dataSituacao)}`);
        document.getElementById('dataSituacao').focus();
        return;
    }
    
    // **CORREÇÃO 2: VALIDAÇÃO DE DATA FUTURA**
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataSituacaoObj > hoje) {
        mostrarModal('Erro de Validação', 
            `A data da situação (${formatarData(dataSituacao)}) não pode ser no futuro.`);
        document.getElementById('dataSituacao').focus();
        return;
    }
    
    if (tributacao === 'simples' && !anexoSimples) {
        mostrarModal('Erro', 'Para o Simples Nacional, é obrigatório selecionar o anexo.');
        document.getElementById('anexoSimples').focus();
        return;
    }
    
    // Buscar situações existentes
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    
    // **CORREÇÃO 3: VALIDAÇÃO FORTE DE DUPLICIDADE**
    // Encontrar TODAS as situações da empresa
    const situacoesDaEmpresa = situacoes.filter(s => s.cnpjEmpresa === cnpjEmpresa);
    
    // Verificar se já existe situação com mesma data (ignorando a que está sendo editada)
    const situacaoDuplicada = situacoesDaEmpresa.find(s => {
        const dataSituacaoExistente = new Date(s.dataSituacao);
        dataSituacaoExistente.setHours(0, 0, 0, 0);
        
        return dataSituacaoExistente.getTime() === dataSituacaoObj.getTime() &&
               (!situacaoId || s.id !== situacaoId);
    });
    
    if (situacaoDuplicada) {
        // Buscar dados completos da situação duplicada
        const situacaoDuplicadaCompleta = situacoes.find(s => s.id === situacaoDuplicada.id);
        
        let mensagemDetalhada = `JÁ EXISTE uma situação registrada para esta empresa na data ${formatarData(dataSituacao)}!\n\n`;
        mensagemDetalhada += `Dados da situação existente:\n`;
        mensagemDetalhada += `• Data: ${formatarData(situacaoDuplicadaCompleta.dataSituacao)}\n`;
        mensagemDetalhada += `• Tributação: ${situacaoDuplicadaCompleta.tributacao === 'simples' ? 'Simples Nacional' : 
                              situacaoDuplicadaCompleta.tributacao === 'presumido' ? 'Lucro Presumido' : 'Lucro Real'}\n`;
        
        if (situacaoDuplicadaCompleta.tributacao === 'simples' && situacaoDuplicadaCompleta.anexo) {
            mensagemDetalhada += `• Anexo: ${situacaoDuplicadaCompleta.anexo} (${getDescricaoAnexo(situacaoDuplicadaCompleta.anexo)})\n`;
        }
        
        mensagemDetalhada += `• Endereço: ${situacaoDuplicadaCompleta.endereco}\n`;
        mensagemDetalhada += `• Registro: ${formatarDataHora(situacaoDuplicadaCompleta.dataRegistro)}\n\n`;
        mensagemDetalhada += `Deseja editar a situação existente?`;
        
        mostrarModal('DATA DUPLICADA - NÃO PERMITIDO', mensagemDetalhada, () => {
            preencherFormularioSituacao(situacaoDuplicadaCompleta);
            mostrarMensagem('Carregando situação para edição...');
        });
        return;
    }
    
    // **CORREÇÃO 4: VALIDAÇÃO DE SEQUÊNCIA TEMPORAL**
    // Verificar se a nova data está em sequência lógica com as existentes
    if (situacoesDaEmpresa.length > 0 && !situacaoId) {
        // Ordenar por data (mais recente primeiro)
        situacoesDaEmpresa.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));
        const situacaoMaisRecente = situacoesDaEmpresa[0];
        const dataMaisRecente = new Date(situacaoMaisRecente.dataSituacao);
        dataMaisRecente.setHours(0, 0, 0, 0);
        
        if (dataSituacaoObj.getTime() === dataMaisRecente.getTime()) {
            // Já tratado acima como duplicidade
        } else if (dataSituacaoObj > dataMaisRecente) {
            // Data futura em relação à mais recente - OK
            console.log('Nova data é mais recente que a situação atual');
        } else {
            // Data anterior à situação mais recente - Perguntar se quer inserir no histórico
            mostrarModal('Inserir no Histórico',
                `A data informada (${formatarData(dataSituacao)}) é anterior à situação mais recente da empresa (${formatarData(situacaoMaisRecente.dataSituacao)}).\n\n` +
                `Isso criará uma nova entrada no histórico. Deseja continuar?`,
            () => {
                // Continuar com o salvamento
                continuarSalvamentoSituacao(dataSituacao, endereco, tributacao, cnpjEmpresa, anexoSimples, atividadesAnexo, situacaoId, empresa);
            });
            return;
        }
    }
    
    // Se passou por todas as validações, continuar com o salvamento
    continuarSalvamentoSituacao(dataSituacao, endereco, tributacao, cnpjEmpresa, anexoSimples, atividadesAnexo, situacaoId, empresa);
}

// Função separada para o processo de salvamento
function continuarSalvamentoSituacao(dataSituacao, endereco, tributacao, cnpjEmpresa, anexoSimples, atividadesAnexo, situacaoId, empresa) {
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    
    // Criar/atualizar situação
    let situacaoAtualizada;
    
    if (situacaoId) {
        // Atualizar situação existente
        const index = situacoes.findIndex(s => s.id === situacaoId);
        situacaoAtualizada = {
            ...situacoes[index],
            dataSituacao,
            endereco,
            tributacao,
            anexo: anexoSimples,
            atividadesAnexo: atividadesAnexo,
            dataAtualizacao: new Date().toISOString()
        };
        situacoes[index] = situacaoAtualizada;
    } else {
        // Criar nova situação
        situacaoAtualizada = {
            id: Date.now().toString(),
            cnpjEmpresa,
            dataSituacao,
            endereco,
            tributacao,
            anexo: anexoSimples,
            atividadesAnexo: atividadesAnexo,
            dataRegistro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };
        situacoes.push(situacaoAtualizada);
    }
    
    // Salvar no localStorage
    localStorage.setItem('situacoes', JSON.stringify(situacoes));
    
    // Atualizar interface
    carregarSituacoes();
    
    // Mensagem de sucesso
    let mensagemSucesso = situacaoId ? 
        `Situação atualizada para ${empresa.nomeFantasia}!` : 
        `Situação registrada para ${empresa.nomeFantasia} com sucesso!`;
    
    if (tributacao === 'simples') {
        mensagemSucesso += `\nAnexo: ${getDescricaoAnexo(anexoSimples)}`;
    }
    
    mostrarMensagem(mensagemSucesso);
    
    // Limpar formulário se foi uma nova criação
    if (!situacaoId) {
        limparFormSituacao();
    } else {
        // Remover ID se estava editando
        if (document.getElementById('situacaoId')) {
            document.getElementById('situacaoId').remove();
        }
    }
}

// Função para preencher formulário de situação para edição
function preencherFormularioSituacao(situacao) {
    console.log('Editando situação ID:', situacao.id);
    
    // **CORREÇÃO: Garantir que o campo hidden existe**
    let idInput = document.getElementById('situacaoId');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'situacaoId';
        idInput.name = 'situacaoId';
        document.getElementById('situacaoForm').appendChild(idInput);
    }
    idInput.value = situacao.id;
    
    // Preencher campos do formulário
    document.getElementById('dataSituacao').value = situacao.dataSituacao;
    document.getElementById('endereco').value = situacao.endereco;
    document.getElementById('tributacao').value = situacao.tributacao;
    document.getElementById('cnpjEmpresa').value = situacao.cnpjEmpresa;
    
    // Trigger do evento change para mostrar campos do anexo
    const changeEvent = new Event('change');
    document.getElementById('tributacao').dispatchEvent(changeEvent);
    
    // Preencher campos do anexo (se for Simples Nacional)
    setTimeout(() => {
        if (situacao.tributacao === 'simples') {
            document.getElementById('anexoSimples').value = situacao.anexo || '';
            document.getElementById('atividadesAnexo').value = situacao.atividadesAnexo || '';
        }
    }, 50);
    
    // Atualizar interface para modo edição
    const titulo = document.querySelector('#situacaoTab h2');
    const submitBtn = document.querySelector('#situacaoForm .btn-primary');
    const limparBtn = document.getElementById('limparSituacao');
    
    // Salvar textos originais
    if (!titulo.dataset.original) {
        titulo.dataset.original = titulo.innerHTML;
    }
    if (!submitBtn.dataset.original) {
        submitBtn.dataset.original = submitBtn.innerHTML;
    }
    if (!limparBtn.dataset.original) {
        limparBtn.dataset.original = limparBtn.innerHTML;
    }
    
    // Atualizar textos
    titulo.innerHTML = '<i class="fas fa-edit"></i> Editando Situação';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Situação';
    limparBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
    
    // Adicionar classe para indicar modo edição
    document.getElementById('situacaoForm').classList.add('editando');
    
    // Configurar botão limpar para cancelar edição
    limparBtn.onclick = function() {
        mostrarModal('Cancelar Edição', 'Deseja cancelar a edição? Todas as alterações serão perdidas.', () => {
            limparFormSituacao();
            mostrarMensagem('Edição cancelada.');
        });
    };
    
    // Ir para a aba de situação
    switchTab('situacao');
    
    // Focar no primeiro campo
    document.getElementById('dataSituacao').focus();
    
    console.log('Formulário preenchido para edição');
}

// Função para restaurar formulário ao estado normal
function restaurarFormularioSituacao() {
    const titulo = document.querySelector('#situacaoTab h2');
    const submitBtn = document.querySelector('#situacaoForm .btn-primary');
    
    if (titulo.dataset.original) {
        titulo.innerHTML = titulo.dataset.original;
    }
    
    if (submitBtn.dataset.original) {
        submitBtn.innerHTML = submitBtn.dataset.original;
    }
    
    // Remover classe de edição
    document.getElementById('situacaoForm').classList.remove('editando');
    
    // Remover ID se existir
    if (document.getElementById('situacaoId')) {
        document.getElementById('situacaoId').remove();
    }
    
    // Limpar campos do anexo
    document.getElementById('anexoSimples').value = '';
    document.getElementById('atividadesAnexo').value = '';
}

// Função para debug - verificar todas as situações de uma empresa
function verificarSituacoesEmpresa(cnpjEmpresa) {
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const situacoesEmpresa = situacoes.filter(s => s.cnpjEmpresa === cnpjEmpresa);
    
    console.group('Verificação de Situações da Empresa');
    console.log('CNPJ:', cnpjEmpresa);
    console.log('Total de situações:', situacoesEmpresa.length);
    
    situacoesEmpresa.forEach((situacao, index) => {
        console.log(`Situação ${index + 1}:`, {
            id: situacao.id,
            data: situacao.dataSituacao,
            dataFormatada: formatarData(situacao.dataSituacao),
            tributacao: situacao.tributacao,
            anexo: situacao.anexo
        });
    });
    
    // Verificar duplicidades
    const datas = situacoesEmpresa.map(s => s.dataSituacao);
    const duplicados = datas.filter((data, index) => datas.indexOf(data) !== index);
    
    if (duplicados.length > 0) {
        console.error('DATAS DUPLICADAS ENCONTRADAS:', duplicados);
    } else {
        console.log('Nenhuma data duplicada encontrada.');
    }
    
    console.groupEnd();
}

function verificarTodasSituacoes() {
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    
    console.group('VERIFICAÇÃO COMPLETA DO SISTEMA');
    
    let problemas = [];
    
    clientes.forEach(cliente => {
        const situacoesCliente = situacoes.filter(s => s.cnpjEmpresa === cliente.cnpj);
        
        // Verificar datas duplicadas
        const datas = situacoesCliente.map(s => s.dataSituacao);
        const datasUnicas = [...new Set(datas)];
        
        if (datas.length !== datasUnicas.length) {
            problemas.push({
                empresa: cliente.nomeFantasia,
                problema: 'Datas duplicadas',
                situacoes: situacoesCliente.length
            });
        }
        
        // Verificar datas anteriores à abertura
        const dataAbertura = new Date(cliente.dataAbertura);
        dataAbertura.setHours(0, 0, 0, 0);
        
        situacoesCliente.forEach(situacao => {
            const dataSituacao = new Date(situacao.dataSituacao);
            dataSituacao.setHours(0, 0, 0, 0);
            
            if (dataSituacao < dataAbertura) {
                problemas.push({
                    empresa: cliente.nomeFantasia,
                    problema: `Data anterior à abertura: ${formatarData(situacao.dataSituacao)} (Abertura: ${formatarData(cliente.dataAbertura)})`,
                    situacao: situacao
                });
            }
        });
    });
    
    if (problemas.length === 0) {
        console.log('✓ Nenhum problema encontrado!');
        mostrarMensagem('Verificação concluída: Nenhum problema encontrado!');
    } else {
        console.error('⚠ PROBLEMAS ENCONTRADOS:', problemas);
        
        let mensagem = `Foram encontrados ${problemas.length} problema(s):\n\n`;
        problemas.forEach((p, i) => {
            mensagem += `${i + 1}. ${p.empresa}: ${p.problema}\n`;
        });
        
        mostrarModal('Problemas Encontrados', mensagem);
    }
    
    console.groupEnd();
}

// ========== MÁSCARAS PARA OS CAMPOS ==========
function formatarCNPJInput(e) {
    const input = e.target;
    let valorOriginal = input.value;
    let valorNumerico = valorOriginal.replace(/\D/g, '');
    
    // Limitar a 14 dígitos numéricos
    if (valorNumerico.length > 14) {
        valorNumerico = valorNumerico.substring(0, 14);
    }
    
    // Aplicar máscara passo a passo
    let valorFormatado = '';
    
    if (valorNumerico.length > 0) {
        // Começar com os primeiros 2 dígitos
        valorFormatado = valorNumerico.substring(0, 2);
        
        if (valorNumerico.length > 2) {
            valorFormatado += '.' + valorNumerico.substring(2, 5);
        }
        
        if (valorNumerico.length > 5) {
            valorFormatado += '.' + valorNumerico.substring(5, 8);
        }
        
        if (valorNumerico.length > 8) {
            valorFormatado += '/' + valorNumerico.substring(8, 12);
        }
        
        if (valorNumerico.length > 12) {
            valorFormatado += '-' + valorNumerico.substring(12, 14);
        }
    }
    
    // Só atualizar se mudou
    if (input.value !== valorFormatado) {
        input.value = valorFormatado;
    }
    
    // Validar em tempo real quando tiver 14 dígitos
    validarCNPJEmTempoReal(valorNumerico);
}

	// Adicionar validação quando o campo perde o foco (blur)
	document.getElementById('cnpj').addEventListener('blur', function() {
		const cnpjNumeros = this.value.replace(/\D/g, '');
		if (cnpjNumeros.length === 14) {
			validarCNPJEmTempoReal(cnpjNumeros);
    }
});

document.getElementById('cnpj').addEventListener('focus', function(e) {
    const value = e.target.value;
    const numeros = value.replace(/\D/g, '');
    
    // Se tiver apenas números, aplicar formatação parcial
    if (numeros && /^\d+$/.test(value)) {
        formatarCNPJInput({ target: e.target });
    }
});

function formatarNumeros(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
}

// ========== FUNÇÕES DE VALIDAÇÃO DE CNPJ ==========
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g,'');
 
    if(cnpj == '') return false;
     
    if (cnpj.length != 14)
        return false;
 
    // Elimina CNPJs invalidos conhecidos
    if (cnpj == "00000000000000" || 
        cnpj == "11111111111111" || 
        cnpj == "22222222222222" || 
        cnpj == "33333333333333" || 
        cnpj == "44444444444444" || 
        cnpj == "55555555555555" || 
        cnpj == "66666666666666" || 
        cnpj == "77777777777777" || 
        cnpj == "88888888888888" || 
        cnpj == "99999999999999")
        return false;
         
    // Valida DVs
    tamanho = cnpj.length - 2
    numeros = cnpj.substring(0,tamanho);
    digitos = cnpj.substring(tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0))
        return false;
         
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1))
          return false;
           
    return true;
}

// Função para validar CNPJ em tempo real (opcional)
function validarCNPJEmTempoReal(cnpjCompleto) {
    const cnpjNumeros = cnpjCompleto.replace(/\D/g, '');
    const valido = validarCNPJ(cnpjNumeros);
    
    const inputCNPJ = document.getElementById('cnpj');
    const statusElement = document.getElementById('cnpjStatus') || criarStatusCNPJ();
    
    if (cnpjNumeros.length === 0) {
        statusElement.textContent = 'Digite 14 números';
        statusElement.style.color = '#666';
        inputCNPJ.style.borderColor = '#ddd';
    } else if (cnpjNumeros.length < 14) {
        statusElement.textContent = `${cnpjNumeros.length}/14 dígitos`;
        statusElement.style.color = '#e74c3c';
        inputCNPJ.style.borderColor = '#f56565';
    } else if (!valido) {
        statusElement.textContent = '✗ CNPJ inválido (dígitos incorretos)';
        statusElement.style.color = '#e74c3c';
        inputCNPJ.style.borderColor = '#f56565';
    } else {
        statusElement.textContent = '✓ CNPJ válido';
        statusElement.style.color = '#2ecc71';
        inputCNPJ.style.borderColor = '#48bb78';
    }
    
    return valido;
}

function criarStatusCNPJ() {
    const statusElement = document.createElement('div');
    statusElement.id = 'cnpjStatus';
    statusElement.style.cssText = `
        margin-top: 5px;
        font-size: 0.85rem;
        font-weight: 500;
    `;
    document.getElementById('cnpj').parentNode.appendChild(statusElement);
    return statusElement;
}

// ========== GERENCIAMENTO DE SITUAÇÕES ==========
function salvarSituacao(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const dataSituacao = document.getElementById('dataSituacao').value;
    const endereco = document.getElementById('endereco').value.trim();
    const tributacao = document.getElementById('tributacao').value;
    const cnpjEmpresa = document.getElementById('cnpjEmpresa').value;
    const anexoSimples = tributacao === 'simples' ? document.getElementById('anexoSimples').value : null;
    const atividadesAnexo = tributacao === 'simples' ? document.getElementById('atividadesAnexo').value.trim() : null;
    
    // **CORREÇÃO: Obter o ID da situação de forma consistente**
    let situacaoId = null;
    const situacaoIdInput = document.getElementById('situacaoId');
    if (situacaoIdInput && situacaoIdInput.value) {
        situacaoId = situacaoIdInput.value;
    }
    
    console.log('Modo:', situacaoId ? 'EDITANDO' : 'CRIANDO', 'ID:', situacaoId);
    
    // Validações básicas
    if (!cnpjEmpresa) {
        mostrarModal('Erro', 'Selecione uma empresa para registrar a situação.');
        return;
    }
    
    if (!endereco) {
        mostrarModal('Erro', 'Endereço é obrigatório.');
        document.getElementById('endereco').focus();
        return;
    }
    
    if (!dataSituacao) {
        mostrarModal('Erro', 'Data da situação é obrigatória.');
        document.getElementById('dataSituacao').focus();
        return;
    }
    
    // Buscar dados da empresa
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    
    if (!empresa) {
        mostrarModal('Erro', 'Empresa não encontrada.');
        return;
    }
    
    // Validação da data de abertura
    const dataAbertura = new Date(empresa.dataAbertura);
    const dataSituacaoObj = new Date(dataSituacao);
    
    dataAbertura.setHours(0, 0, 0, 0);
    dataSituacaoObj.setHours(0, 0, 0, 0);
    
    if (dataSituacaoObj < dataAbertura) {
        mostrarModal('Erro de Validação', 
            `A data da situação (${formatarData(dataSituacao)}) não pode ser anterior à data de abertura da empresa (${formatarData(empresa.dataAbertura)}).`);
        document.getElementById('dataSituacao').focus();
        return;
    }
    
    // Validação de data futura
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataSituacaoObj > hoje) {
        mostrarModal('Erro de Validação', 
            `A data da situação (${formatarData(dataSituacao)}) não pode ser no futuro.`);
        document.getElementById('dataSituacao').focus();
        return;
    }
    
    if (tributacao === 'simples' && !anexoSimples) {
        mostrarModal('Erro', 'Para o Simples Nacional, é obrigatório selecionar o anexo.');
        document.getElementById('anexoSimples').focus();
        return;
    }
    
    // Buscar situações existentes
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    
    // **CORREÇÃO: Validação de duplicidade considerando o modo de edição**
    // Se NÃO estiver editando (criando nova), verificar duplicidade
    // Se ESTIVER editando, permitir salvar mesmo com mesma data (desde que seja a mesma situação)
    
    if (!situacaoId) {
        // Modo CRIAÇÃO - Verificar duplicidade
        const situacaoDuplicada = situacoes.find(s => {
            const dataExistente = new Date(s.dataSituacao);
            dataExistente.setHours(0, 0, 0, 0);
            return s.cnpjEmpresa === cnpjEmpresa && 
                   dataExistente.getTime() === dataSituacaoObj.getTime();
        });
        
        if (situacaoDuplicada) {
            // Encontrar situação existente para oferecer edição
            const situacaoExistente = situacoes.find(s => s.id === situacaoDuplicada.id);
            
            let mensagem = `Já existe uma situação registrada para ${empresa.nomeFantasia} na data ${formatarData(dataSituacao)}.\n\n`;
            mensagem += `Deseja editar a situação existente?`;
            
            mostrarModal('Situação Já Existe', mensagem, () => {
                preencherFormularioSituacao(situacaoExistente);
            });
            return;
        }
    } else {
        // Modo EDIÇÃO - Verificar se a data foi alterada para outra existente
        const situacaoAtual = situacoes.find(s => s.id === situacaoId);
        if (situacaoAtual) {
            const dataAtual = new Date(situacaoAtual.dataSituacao);
            dataAtual.setHours(0, 0, 0, 0);
            
            // Se a data foi alterada, verificar se nova data não conflita com outra situação
            if (dataAtual.getTime() !== dataSituacaoObj.getTime()) {
                const conflito = situacoes.find(s => {
                    if (s.id === situacaoId) return false; // Ignorar a si mesma
                    const dataExistente = new Date(s.dataSituacao);
                    dataExistente.setHours(0, 0, 0, 0);
                    return s.cnpjEmpresa === cnpjEmpresa && 
                           dataExistente.getTime() === dataSituacaoObj.getTime();
                });
                
                if (conflito) {
                    mostrarModal('Conflito de Data', 
                        `Não é possível alterar para a data ${formatarData(dataSituacao)} porque já existe outra situação nessa data.`);
                    return;
                }
            }
        }
    }
    
    // **CORREÇÃO: Lógica de salvamento separada para criação vs edição**
    let novaSituacao;
    
    if (situacaoId) {
        // MODE EDIÇÃO - Atualizar situação existente
        const index = situacoes.findIndex(s => s.id === situacaoId);
        if (index === -1) {
            mostrarModal('Erro', 'Situação não encontrada para edição.');
            return;
        }
        
        novaSituacao = {
            ...situacoes[index], // Copiar todas as propriedades existentes
            dataSituacao: dataSituacao,
            endereco: endereco,
            tributacao: tributacao,
            anexo: anexoSimples,
            atividadesAnexo: atividadesAnexo,
            dataAtualizacao: new Date().toISOString()
        };
        
        situacoes[index] = novaSituacao;
        console.log('Situação ATUALIZADA:', novaSituacao.id);
    } else {
        // MODO CRIAÇÃO - Criar nova situação
        novaSituacao = {
            id: 'sit_' + Date.now().toString(), // Prefixo para identificar melhor
            cnpjEmpresa: cnpjEmpresa,
            dataSituacao: dataSituacao,
            endereco: endereco,
            tributacao: tributacao,
            anexo: anexoSimples,
            atividadesAnexo: atividadesAnexo,
            dataRegistro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };
        
        situacoes.push(novaSituacao);
        console.log('Nova situação CRIADA:', novaSituacao.id);
    }
    
    // Salvar no localStorage
    localStorage.setItem('situacoes', JSON.stringify(situacoes));
    
    // Atualizar interface
    carregarSituacoes();
    
    // Mensagem de sucesso
    const mensagemSucesso = situacaoId ? 
        `Situação atualizada para ${empresa.nomeFantasia}!` : 
        `Nova situação registrada para ${empresa.nomeFantasia} com sucesso!`;
    
    mostrarMensagem(mensagemSucesso);
    
    // **CORREÇÃO: Limpar formulário apropriadamente**
    limparFormSituacao();
}

function limparFormSituacao() {
    console.log('Limpando formulário de situação');
    
    // Resetar o formulário
    document.getElementById('situacaoForm').reset();
    
    // Remover campo hidden de ID
    const idInput = document.getElementById('situacaoId');
    if (idInput) {
        idInput.remove();
    }
    
    // Resetar display do anexo
    document.getElementById('anexoContainer').style.display = 'none';
    document.getElementById('anexoSimples').required = false;
    
    // Restaurar textos originais
    const titulo = document.querySelector('#situacaoTab h2');
    const submitBtn = document.querySelector('#situacaoForm .btn-primary');
    const limparBtn = document.getElementById('limparSituacao');
    
    if (titulo && titulo.dataset.original) {
        titulo.innerHTML = titulo.dataset.original;
    }
    
    if (submitBtn && submitBtn.dataset.original) {
        submitBtn.innerHTML = submitBtn.dataset.original;
    }
    
    if (limparBtn && limparBtn.dataset.original) {
        limparBtn.innerHTML = limparBtn.dataset.original;
        // Restaurar função original do botão limpar
        limparBtn.onclick = function() {
            limparFormSituacao();
            mostrarMensagem('Formulário limpo.');
        };
    }
    
    // Remover classe de edição
    document.getElementById('situacaoForm').classList.remove('editando');
    
    console.log('Formulário limpo com sucesso');
}

function carregarSituacoes() {
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const listaSituacoes = document.getElementById('listaSituacoes');
    
    if (!situacoes || situacoes.length === 0) {
        listaSituacoes.innerHTML = '<div class="placeholder"><p>Nenhuma situação registrada ainda.</p></div>';
        return;
    }
    
    // Ordenar por empresa e data
    situacoes.sort((a, b) => {
        if (a.cnpjEmpresa !== b.cnpjEmpresa) {
            return a.cnpjEmpresa.localeCompare(b.cnpjEmpresa);
        }
        return new Date(b.dataSituacao) - new Date(a.dataSituacao);
    });
    
    listaSituacoes.innerHTML = '';
    
    // Buscar clientes para nomes
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    
    let empresaAtual = '';
    situacoes.forEach((situacao, index) => {
        // Buscar empresa
        const empresa = clientes.find(c => c.cnpj === situacao.cnpjEmpresa);
        const nomeEmpresa = empresa ? empresa.nomeFantasia : 'Empresa não encontrada';
        
        // Se mudou de empresa, adicionar cabeçalho
        if (situacao.cnpjEmpresa !== empresaAtual) {
            empresaAtual = situacao.cnpjEmpresa;
            
            const header = document.createElement('div');
            header.className = 'empresa-header';
            header.innerHTML = `
                <h4 style="margin: 20px 0 10px 0; color: #2c3e50; border-bottom: 2px solid #4a6491; padding-bottom: 5px;">
                    <i class="fas fa-building"></i> ${nomeEmpresa}
                    <small style="font-size: 0.9rem; color: #666; margin-left: 10px;">
                        (${formatarCNPJ(situacao.cnpjEmpresa)})
                    </small>
                </h4>
            `;
            listaSituacoes.appendChild(header);
        }
        
        // Mapear tributação para texto
        const tributacaoText = {
            'simples': 'Simples Nacional',
            'presumido': 'Lucro Presumido',
            'real': 'Lucro Real'
        }[situacao.tributacao] || situacao.tributacao;
        
        // Cor da tributação
        let corTributacao = '#4a6491';
        if (situacao.tributacao === 'simples') corTributacao = '#2ecc71';
        if (situacao.tributacao === 'presumido') corTributacao = '#e74c3c';
        if (situacao.tributacao === 'real') corTributacao = '#3498db';
        
        const item = document.createElement('div');
        item.className = 'item-lista';
        item.style.borderLeft = `4px solid ${corTributacao}`;
        
        // Verificar se é a situação mais recente desta empresa
        const situacoesEmpresa = situacoes.filter(s => s.cnpjEmpresa === situacao.cnpjEmpresa);
        const situacaoMaisRecente = situacoesEmpresa[0]; // Já ordenado por data
        const isMaisRecente = situacao.id === situacaoMaisRecente.id;
        
        let anexoHTML = '';
        if (situacao.tributacao === 'simples' && situacao.anexo) {
            anexoHTML = `
                <div style="margin: 8px 0;">
                    <span class="anexo-badge anexo-${situacao.anexo}">Anexo ${situacao.anexo}</span>
                    <span style="font-size: 0.9rem; color: #666; margin-left: 8px;">
                        ${getDescricaoAnexo(situacao.anexo)}
                    </span>
                </div>
                ${situacao.atividadesAnexo ? `<p><strong>Atividades:</strong> ${situacao.atividadesAnexo}</p>` : ''}
            `;
        }
        
        item.innerHTML = `
            <div class="item-info">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">
                            ${formatarData(situacao.dataSituacao)}
                            ${isMaisRecente ? '<span class="badge-mais-recente">ATUAL</span>' : ''}
                        </h4>
                        <p style="margin: 0; color: ${corTributacao}; font-weight: bold;">
                            ${tributacaoText}
                        </p>
                    </div>
                    <div style="font-size: 0.85rem; color: #666;">
                        ${situacao.dataAtualizacao !== situacao.dataRegistro ? 
                            `Atualizado: ${formatarDataHora(situacao.dataAtualizacao)}` : 
                            `Registrado: ${formatarDataHora(situacao.dataRegistro)}`}
                    </div>
                </div>
                ${anexoHTML}
                <p style="margin: 8px 0 0 0;"><strong>Endereço:</strong> ${situacao.endereco}</p>
            </div>
            <div class="item-acoes">
                <button class="btn-secondary" onclick="editarSituacao('${situacao.id}')" 
                        title="Editar esta situação">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-secondary" onclick="excluirSituacao('${situacao.id}')" 
                        title="Excluir esta situação">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        listaSituacoes.appendChild(item);
    });
}

// Função para validar data da situação
function validarDataSituacao(cnpjEmpresa, dataSituacao, situacaoId = null) {
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    
    if (!empresa) {
        return { valido: false, mensagem: 'Empresa não encontrada.' };
    }
    
    const dataAbertura = new Date(empresa.dataAbertura);
    const dataSituacaoObj = new Date(dataSituacao);
    
    // Resetar horas para comparar apenas datas
    dataAbertura.setHours(0, 0, 0, 0);
    dataSituacaoObj.setHours(0, 0, 0, 0);
    
    // Validar se não é anterior à data de abertura
    if (dataSituacaoObj < dataAbertura) {
        return {
            valido: false,
            mensagem: `A data da situação não pode ser anterior à data de abertura da empresa (${formatarData(empresa.dataAbertura)}).`
        };
    }
    
    // Validar se não é no futuro
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataSituacaoObj > hoje) {
        return {
            valido: false,
            mensagem: 'A data da situação não pode ser no futuro.'
        };
    }
    
    // Validar duplicidade
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const situacaoExistente = situacoes.find(s => 
        s.cnpjEmpresa === cnpjEmpresa && 
        s.dataSituacao === dataSituacao &&
        (!situacaoId || s.id !== situacaoId)
    );
    
    if (situacaoExistente) {
        return {
            valido: false,
            mensagem: `Já existe uma situação cadastrada para esta empresa na data ${formatarData(dataSituacao)}.`,
            situacaoExistente: situacaoExistente
        };
    }
    
    return { valido: true };
}

// Adicionar validação em tempo real no campo de data
// Adicionar evento para validar data em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const dataSituacaoInput = document.getElementById('dataSituacao');
    const cnpjEmpresaSelect = document.getElementById('cnpjEmpresa');
    
    if (dataSituacaoInput) {
        // Validar quando o campo perder o foco
        dataSituacaoInput.addEventListener('blur', validarDataSituacaoEmTempoReal);
        // Validar quando a empresa for selecionada
        if (cnpjEmpresaSelect) {
            cnpjEmpresaSelect.addEventListener('change', validarDataSituacaoEmTempoReal);
        }
    }
});

function validarDataSituacaoEmTempoReal() {
    const cnpjEmpresa = document.getElementById('cnpjEmpresa').value;
    const dataSituacao = document.getElementById('dataSituacao').value;
    const situacaoId = document.getElementById('situacaoId') ? document.getElementById('situacaoId').value : null;
    
    if (!cnpjEmpresa || !dataSituacao) return;
    
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    
    if (!empresa) return;
    
    // Criar elemento de feedback se não existir
    let feedbackElement = document.getElementById('dataSituacaoFeedback');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'dataSituacaoFeedback';
        feedbackElement.style.cssText = `
            margin-top: 5px;
            font-size: 0.85rem;
            font-weight: 500;
            padding: 5px;
            border-radius: 4px;
        `;
        document.getElementById('dataSituacao').parentNode.appendChild(feedbackElement);
    }
    
    const dataAbertura = new Date(empresa.dataAbertura);
    const dataSituacaoObj = new Date(dataSituacao);
    
    // Resetar horas
    dataAbertura.setHours(0, 0, 0, 0);
    dataSituacaoObj.setHours(0, 0, 0, 0);
    
    // Verificar data de abertura
    if (dataSituacaoObj < dataAbertura) {
        feedbackElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ERRO: Data anterior à abertura da empresa (${formatarData(empresa.dataAbertura)})`;
        feedbackElement.className = 'feedback-erro';
        document.getElementById('dataSituacao').classList.add('input-invalido');
        document.getElementById('dataSituacao').classList.remove('input-valido');
        return;
    }
    
    // Verificar se não é futuro
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataSituacaoObj > hoje) {
        feedbackElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ERRO: Data não pode ser no futuro`;
        feedbackElement.className = 'feedback-erro';
        document.getElementById('dataSituacao').classList.add('input-invalido');
        document.getElementById('dataSituacao').classList.remove('input-valido');
        return;
    }
    
    // Verificar duplicidade
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const situacoesDaEmpresa = situacoes.filter(s => s.cnpjEmpresa === cnpjEmpresa);
    
    const dataDuplicada = situacoesDaEmpresa.find(s => {
        const dataExistente = new Date(s.dataSituacao);
        dataExistente.setHours(0, 0, 0, 0);
        return dataExistente.getTime() === dataSituacaoObj.getTime() &&
               (!situacaoId || s.id !== situacaoId);
    });
    
    if (dataDuplicada) {
        feedbackElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ALERTA: Já existe situação nesta data`;
        feedbackElement.className = 'feedback-alerta';
        document.getElementById('dataSituacao').classList.add('input-invalido');
        document.getElementById('dataSituacao').classList.remove('input-valido');
    } else {
        feedbackElement.innerHTML = `<i class="fas fa-check-circle"></i> Data válida`;
        feedbackElement.className = 'feedback-sucesso';
        document.getElementById('dataSituacao').classList.add('input-valido');
        document.getElementById('dataSituacao').classList.remove('input-invalido');
    }
}

// Função auxiliar para criar elemento de feedback
function criarElementoFeedback(inputId) {
    const input = document.getElementById(inputId);
    const feedback = document.createElement('div');
    feedback.id = `${inputId}Feedback`;
    feedback.style.cssText = `
        margin-top: 5px;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.3s;
    `;
    input.parentNode.appendChild(feedback);
    return feedback;
}

// Função para editar situação (chamada pelo botão)
function editarSituacao(id) {
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const situacao = situacoes.find(s => s.id === id);
    
    if (situacao) {
        preencherFormularioSituacao(situacao);
    } else {
        mostrarModal('Erro', 'Situação não encontrada para edição.');
    }
}

function excluirSituacao(id) {
    mostrarModal('Excluir Situação', 'Tem certeza que deseja excluir este registro de situação?', () => {
        const situacoes = JSON.parse(localStorage.getItem('situacoes'));
        const situacoesAtualizadas = situacoes.filter(situacao => situacao.id !== id);
        localStorage.setItem('situacoes', JSON.stringify(situacoesAtualizadas));
        
        carregarSituacoes();
        mostrarMensagem('Situação excluída com sucesso!');
    });
}

// Função para verificar histórico de situações de uma empresa
function verificarHistoricoSituacoes(cnpjEmpresa) {
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    
    if (!situacoes || !clientes) return null;
    
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    if (!empresa) return null;
    
    const situacoesEmpresa = situacoes
        .filter(s => s.cnpjEmpresa === cnpjEmpresa)
        .sort((a, b) => new Date(a.dataSituacao) - new Date(b.dataSituacao));
    
    return {
        empresa: empresa,
        situacoes: situacoesEmpresa,
        total: situacoesEmpresa.length,
        primeiraData: situacoesEmpresa.length > 0 ? situacoesEmpresa[0].dataSituacao : null,
        ultimaData: situacoesEmpresa.length > 0 ? situacoesEmpresa[situacoesEmpresa.length - 1].dataSituacao : null
    };
}

// ========== GERENCIAMENTO DE VENDAS ==========
function salvarVendas(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const cnpjEmpresa = document.getElementById('cnpjVendas').value;
    const mesVendas = document.getElementById('mesVendas').value;
    const valorVendas = parseFloat(document.getElementById('valorVendas').value.replace(',', '.'));
    
    if (!cnpjEmpresa) {
        mostrarModal('Erro', 'Selecione uma empresa para registrar as vendas.');
        return;
    }
    
    if (!mesVendas) {
        mostrarModal('Erro', 'Selecione o mês/ano de referência.');
        document.getElementById('mesVendas').focus();
        return;
    }
    
    if (!valorVendas || isNaN(valorVendas) || valorVendas <= 0) {
        mostrarModal('Erro', 'Informe um valor válido para as vendas.');
        document.getElementById('valorVendas').focus();
        return;
    }
    
    // Buscar nome da empresa
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    const nomeEmpresa = empresa ? empresa.nomeFantasia : 'Empresa selecionada';
    
    // Verificar se já existem vendas para este mês/empresa
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const vendaExistente = vendas.find(v => v.cnpjEmpresa === cnpjEmpresa && v.mes === mesVendas);
    
    if (vendaExistente) {
        mostrarModal('Vendas já Registradas', 
            `Já existem vendas registradas para ${nomeEmpresa} em ${formatarMesAno(mesVendas)}.\n` +
            `Valor atual: ${formatarMoeda(vendaExistente.valor)}\n\n` +
            'Deseja atualizar com o novo valor?', 
        () => {
            // Atualizar venda existente
            const index = vendas.findIndex(v => v.cnpjEmpresa === cnpjEmpresa && v.mes === mesVendas);
            vendas[index].valor = valorVendas;
            vendas[index].dataAtualizacao = new Date().toISOString();
            localStorage.setItem('vendas', JSON.stringify(vendas));
            
            carregarVendas();
            mostrarMensagem(`Vendas de ${formatarMesAno(mesVendas)} atualizadas para ${formatarMoeda(valorVendas)}!`);
        });
        return;
    }
    
    // Criar nova venda
    const novaVenda = {
        id: Date.now().toString(),
        cnpjEmpresa,
        mes: mesVendas,
        valor: valorVendas,
        dataRegistro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    // Salvar no localStorage
    vendas.push(novaVenda);
    localStorage.setItem('vendas', JSON.stringify(vendas));
    
    // Atualizar interface
    carregarVendas();
    
    mostrarMensagem(`Vendas de ${formatarMesAno(mesVendas)} registradas para ${nomeEmpresa}!`);
    
    // Não limpar o formulário automaticamente
    // limparFormVendas();
}

function limparFormVendas() {
    document.getElementById('vendasForm').reset();
}

function carregarVendas() {
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const listaVendas = document.getElementById('listaVendas');
    
    if (!vendas || vendas.length === 0) {
        listaVendas.innerHTML = '<div class="placeholder"><p>Nenhuma venda registrada ainda.</p></div>';
        return;
    }
    
    // Ordenar por mês (mais recente primeiro)
    vendas.sort((a, b) => b.mes.localeCompare(a.mes));
    
    listaVendas.innerHTML = '';
    
    vendas.forEach(venda => {
        // Buscar informações da empresa
        const clientes = JSON.parse(localStorage.getItem('clientes'));
        const empresa = clientes.find(c => c.cnpj === venda.cnpjEmpresa);
        const nomeEmpresa = empresa ? empresa.nomeFantasia : 'Empresa não encontrada';
        
        // Formatar mês/ano
        const mesFormatado = formatarMesAno(venda.mes);
        
        // Formatar valor
        const valorFormatado = formatarMoeda(venda.valor);
        
        const item = document.createElement('div');
        item.className = 'item-lista';
        item.innerHTML = `
            <div class="item-info">
                <h4>${nomeEmpresa}</h4>
                <p><strong>Período:</strong> ${mesFormatado}</p>
                <p><strong>Valor das Vendas:</strong> ${valorFormatado}</p>
                <p><small>Registrado em: ${formatarDataHora(venda.dataRegistro)}</small></p>
            </div>
            <div class="item-acoes">
                <button class="btn-secondary" onclick="editarVenda('${venda.id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-secondary" onclick="excluirVenda('${venda.id}')"><i class="fas fa-trash-alt"></i> Excluir</button>
            </div>
        `;
        listaVendas.appendChild(item);
    });
}

function editarVenda(id) {
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const venda = vendas.find(v => v.id === id);
    
    if (venda) {
        document.getElementById('cnpjVendas').value = venda.cnpjEmpresa;
        document.getElementById('mesVendas').value = venda.mes;
        document.getElementById('valorVendas').value = venda.valor.toFixed(2).replace('.', ',');
        
        // Adicionar indicador visual que está editando
        const titulo = document.querySelector('#vendasTab h2');
        const originalTitulo = titulo.innerHTML;
        titulo.innerHTML = '<i class="fas fa-shopping-cart"></i> Editando Registro de Vendas';
        
        // Alterar texto do botão de submit
        const submitBtn = document.querySelector('#vendasForm .btn-primary');
        const originalTexto = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Vendas';
        
        // Restaurar quando sair da aba
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.target.classList.contains('active')) {
                    titulo.innerHTML = originalTitulo;
                    submitBtn.innerHTML = originalTexto;
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(document.getElementById('vendasTab'), { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        // Ir para a aba de vendas
        switchTab('vendas');
        
        // Focar no campo de valor
        document.getElementById('valorVendas').focus();
    }
}

function excluirVenda(id) {
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const venda = vendas.find(v => v.id === id);
    
    if (!venda) return;
    
    // Buscar nome da empresa
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === venda.cnpjEmpresa);
    const nomeEmpresa = empresa ? empresa.nomeFantasia : 'Empresa';
    
    mostrarModal('Excluir Venda', 
        `Tem certeza que deseja excluir este registro de vendas?\n\n` +
        `Empresa: ${nomeEmpresa}\n` +
        `Período: ${formatarMesAno(venda.mes)}\n` +
        `Valor: ${formatarMoeda(venda.valor)}`, 
    () => {
        const vendasAtualizadas = vendas.filter(venda => venda.id !== id);
        localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
        
        carregarVendas();
        mostrarMensagem('Venda excluída com sucesso!');
    });
}

// ========== SIMPLES NACIONAL ==========
function salvarFaixaSimples(e) {
    e.preventDefault();
    
    const faixaId = document.getElementById('faixaId').value;
	const faixaAnexo = document.getElementById('faixaAnexo').value;
    const faixaNome = document.getElementById('faixaNome').value.trim();
    const faixaAtiva = document.getElementById('faixaAtiva').value === 'true';
    const faixaInicio = parseFloat(document.getElementById('faixaInicio').value);
    const faixaFim = document.getElementById('faixaFim').value ? parseFloat(document.getElementById('faixaFim').value) : null;
    const faixaAliquota = parseFloat(document.getElementById('faixaAliquota').value);
    const faixaDeduzir = document.getElementById('faixaDeduzir').value ? parseFloat(document.getElementById('faixaDeduzir').value) : 0;
    
    // Validações
    if (!faixaNome || isNaN(faixaInicio) || isNaN(faixaAliquota)) {
        mostrarModal('Erro', 'Preencha todos os campos obrigatórios.');
        return;
    }
    
    if (faixaFim && faixaFim <= faixaInicio) {
        mostrarModal('Erro', 'O valor final deve ser maior que o inicial.');
        return;
    }
	
	if (!faixaAnexo) {
        mostrarModal('Erro', 'Selecione o anexo da faixa.');
        return;
    }
    
    const reparticao = {
        IRPJ: parseFloat(document.getElementById('repIRPJ').value),
        CSLL: parseFloat(document.getElementById('repCSLL').value),
        COFINS: parseFloat(document.getElementById('repCOFINS').value),
        PIS: parseFloat(document.getElementById('repPIS').value),
        CPP: parseFloat(document.getElementById('repCPP').value),
        ICMS: parseFloat(document.getElementById('repICMS').value),
        ISS: parseFloat(document.getElementById('repISS').value),
        IPI: document.getElementById('repIPI').value ? parseFloat(document.getElementById('repIPI').value) : 0,
        INSS: document.getElementById('repINSS').value ? parseFloat(document.getElementById('repINSS').value) : 0
    };
    
    // Validar soma da repartição (aproximadamente 100%)
    const somaReparticao = Object.values(reparticao).reduce((a, b) => a + b, 0);
    if (Math.abs(somaReparticao - 100) > 1) {
        mostrarModal('Aviso', `A soma da repartição é ${somaReparticao.toFixed(2)}%. Verifique os valores.`);
    }
    
    const faixa = {
        id: faixaId || Date.now().toString(),
		anexo: faixaAnexo,
        nome: faixaNome,
        ativa: faixaAtiva,
        inicio: faixaInicio,
        fim: faixaFim,
        aliquota: faixaAliquota,
        deduzir: faixaDeduzir,
        reparticao: reparticao,
        dataCadastro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    // Salvar no histórico
    registrarHistorico('simples', faixaAtiva ? 'CRIAÇÃO' : 'INATIVAÇÃO', faixa);
    
    // Salvar no localStorage
    const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
    
    if (faixaId) {
        // Atualizar
        const index = faixas.findIndex(f => f.id === faixaId);
        faixas[index] = faixa;
        mostrarMensagem('Faixa atualizada com sucesso!');
    } else {
        // Nova faixa
        faixas.push(faixa);
        mostrarMensagem('Nova faixa cadastrada com sucesso!');
    }
    
    localStorage.setItem('paramFaixasSimples', JSON.stringify(faixas));
    
    // Atualizar interface
    carregarFaixasSimples();
    limparFormFaixaSimples();
}

function novaFaixaSimples() {
    limparFormFaixaSimples();
    document.getElementById('faixaNome').focus();
}

function limparFormFaixaSimples() {
    document.getElementById('formFaixaSimples').reset();
    document.getElementById('faixaId').value = '';
    document.getElementById('faixaAtiva').value = 'true';
    
    // Valores padrão para repartição
    document.getElementById('repIRPJ').value = '5.5';
    document.getElementById('repCSLL').value = '3.5';
    document.getElementById('repCOFINS').value = '12.74';
    document.getElementById('repPIS').value = '2.76';
    document.getElementById('repCPP').value = '42';
    document.getElementById('repICMS').value = '20';
    document.getElementById('repISS').value = '5';
    document.getElementById('repIPI').value = '';
    document.getElementById('repINSS').value = '';
}

function carregarFaixasSimples(filtroAnexo = '') {
    const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
    const lista = document.getElementById('listaFaixasSimples');
    
    if (!faixas || faixas.length === 0) {
        lista.innerHTML = '<div class="placeholder"><p>Nenhuma faixa cadastrada ainda.</p></div>';
        return;
    }
	
	// Filtrar por anexo se especificado
    let faixasFiltradas = faixas;
    if (filtroAnexo) {
        faixasFiltradas = faixas.filter(f => f.anexo === filtroAnexo);
    }
    
    // Ordenar por anexo e valor inicial
    faixasFiltradas.sort((a, b) => {
        if (a.anexo !== b.anexo) {
            return a.anexo.localeCompare(b.anexo);
        }
        return a.inicio - b.inicio;
    });
    
    lista.innerHTML = '';
	
	let anexoAtual = '';
    
	faixasFiltradas.forEach(faixa => {
        // Agrupar por anexo
        if (faixa.anexo !== anexoAtual) {
            anexoAtual = faixa.anexo;
            const header = document.createElement('div');
            header.className = 'anexo-header';
            header.innerHTML = `
                <h5 style="margin: 20px 0 10px 0; color: #4a6491;">
                    <span class="anexo-badge anexo-${faixa.anexo}" style="font-size: 1rem;">Anexo ${faixa.anexo}</span>
                    ${getDescricaoAnexo(faixa.anexo)}
                </h5>
            `;
            lista.appendChild(header);
        }
	});
	
    faixas.forEach(faixa => {
        const item = document.createElement('div');
        item.className = 'item-parametro';
        
        let limiteTexto = faixa.fim ? 
            `R$ ${formatarMoeda(faixa.inicio)} a R$ ${formatarMoeda(faixa.fim)}` :
            `Acima de R$ ${formatarMoeda(faixa.inicio)}`;
        
        item.innerHTML = `
            <div class="param-header">
                <h5>${faixa.nome}</h5>
                <span class="param-status ${faixa.ativa ? 'status-ativa' : 'status-inativa'}">
                    ${faixa.ativa ? 'ATIVA' : 'INATIVA'}
                </span>
            </div>
            <div class="param-detalhes">
                <div class="param-detalhe">
                    <strong>Faixa de Receita:</strong>
                    ${limiteTexto}
                </div>
                <div class="param-detalhe">
                    <strong>Alíquota:</strong>
                    ${faixa.aliquota.toFixed(2)}%
                </div>
                <div class="param-detalhe">
                    <strong>Valor a Deduzir:</strong>
                    R$ ${formatarMoeda(faixa.deduzir)}
                </div>
                <div class="param-detalhe">
                    <strong>IRPJ:</strong>
                    ${faixa.reparticao.IRPJ.toFixed(2)}%
                </div>
                <div class="param-detalhe">
                    <strong>CSLL:</strong>
                    ${faixa.reparticao.CSLL.toFixed(2)}%
                </div>
                <div class="param-detalhe">
                    <strong>COFINS:</strong>
                    ${faixa.reparticao.COFINS.toFixed(2)}%
                </div>
            </div>
            <div class="param-acoes">
                <button class="btn-secondary" onclick="editarFaixaSimples('${faixa.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-secondary" onclick="alternarStatusFaixa('${faixa.id}')">
                    <i class="fas fa-toggle-${faixa.ativa ? 'off' : 'on'}"></i> ${faixa.ativa ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn-secondary" onclick="excluirFaixaSimples('${faixa.id}')">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

function editarFaixaSimples(id) {
    const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
    const faixa = faixas.find(f => f.id === id);
    
    if (faixa) {
        document.getElementById('faixaId').value = faixa.id;
        document.getElementById('faixaNome').value = faixa.nome;
        document.getElementById('faixaAtiva').value = faixa.ativa.toString();
        document.getElementById('faixaInicio').value = faixa.inicio;
        document.getElementById('faixaFim').value = faixa.fim || '';
        document.getElementById('faixaAliquota').value = faixa.aliquota;
        document.getElementById('faixaDeduzir').value = faixa.deduzir;
        
        // Repartição
        document.getElementById('repIRPJ').value = faixa.reparticao.IRPJ;
        document.getElementById('repCSLL').value = faixa.reparticao.CSLL;
        document.getElementById('repCOFINS').value = faixa.reparticao.COFINS;
        document.getElementById('repPIS').value = faixa.reparticao.PIS;
        document.getElementById('repCPP').value = faixa.reparticao.CPP;
        document.getElementById('repICMS').value = faixa.reparticao.ICMS;
        document.getElementById('repISS').value = faixa.reparticao.ISS;
        document.getElementById('repIPI').value = faixa.reparticao.IPI || '';
        document.getElementById('repINSS').value = faixa.reparticao.INSS || '';
        
        // Ir para a aba de parametrização
        switchTab('parametrizacao');
        switchSubTab('simples');
    }
}

function alternarStatusFaixa(id) {
    const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
    const index = faixas.findIndex(f => f.id === id);
    
    if (index !== -1) {
        const novaSituacao = !faixas[index].ativa;
        const acao = novaSituacao ? 'ATIVAÇÃO' : 'INATIVAÇÃO';
        
        mostrarModal('Alterar Status', 
            `Tem certeza que deseja ${novaSituacao ? 'ativar' : 'desativar'} esta faixa?`,
            () => {
                faixas[index].ativa = novaSituacao;
                faixas[index].dataAtualizacao = new Date().toISOString();
                
                // Registrar no histórico
                registrarHistorico('simples', acao, faixas[index]);
                
                localStorage.setItem('paramFaixasSimples', JSON.stringify(faixas));
                carregarFaixasSimples();
                mostrarMensagem(`Faixa ${novaSituacao ? 'ativada' : 'desativada'} com sucesso!`);
            }
        );
    }
}

function excluirFaixaSimples(id) {
    mostrarModal('Excluir Faixa', 
        'Tem certeza que deseja excluir permanentemente esta faixa?',
        () => {
            const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
            const faixaExcluida = faixas.find(f => f.id === id);
            
            // Registrar no histórico antes de excluir
            if (faixaExcluida) {
                registrarHistorico('simples', 'EXCLUSÃO', faixaExcluida);
            }
            
            const novasFaixas = faixas.filter(f => f.id !== id);
            localStorage.setItem('paramFaixasSimples', JSON.stringify(novasFaixas));
            carregarFaixasSimples();
            mostrarMensagem('Faixa excluída com sucesso!');
        }
    );
}

// ========== LUCRO PRESUMIDO ==========
function salvarConfigPresumido(e) {
    e.preventDefault();
    
    const configId = document.getElementById('configPresumidoId').value;
    const configNome = document.getElementById('configNome').value.trim();
    const configAtiva = document.getElementById('configAtiva').value === 'true';
    
    const config = {
        id: configId || Date.now().toString(),
        nome: configNome,
        ativa: configAtiva,
        aliquotas: {
            IRPJ: parseFloat(document.getElementById('presumidoIRPJ').value),
            IRPJAdicional: parseFloat(document.getElementById('presumidoIRPJAdicional').value),
            CSLL: parseFloat(document.getElementById('presumidoCSLL').value),
            PIS: parseFloat(document.getElementById('presumidoPIS').value),
            COFINS: parseFloat(document.getElementById('presumidoCOFINS').value)
        },
        limites: {
            adicionalIRPJ: parseFloat(document.getElementById('presumidoLimiteAdicional').value)
        },
        presuncoes: {
            servicos: parseFloat(document.getElementById('presuncaoServicos').value),
            comercio: parseFloat(document.getElementById('presuncaoComercio').value),
            industria: parseFloat(document.getElementById('presuncaoIndustria').value)
        },
        dataCadastro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    // Registrar no histórico
    registrarHistorico('presumido', configAtiva ? 'CRIAÇÃO' : 'INATIVAÇÃO', config);
    
    // Salvar
    const configs = JSON.parse(localStorage.getItem('paramConfigPresumido'));
    
    if (configId) {
        const index = configs.findIndex(c => c.id === configId);
        configs[index] = config;
        mostrarMensagem('Configuração atualizada!');
    } else {
        configs.push(config);
        mostrarMensagem('Nova configuração cadastrada!');
    }
    
    localStorage.setItem('paramConfigPresumido', JSON.stringify(configs));
    carregarConfigsPresumido();
    limparFormConfigPresumido();
}

function novaConfigPresumido() {
    limparFormConfigPresumido();
    document.getElementById('configNome').focus();
}

function limparFormConfigPresumido() {
    document.getElementById('formConfigPresumido').reset();
    document.getElementById('configPresumidoId').value = '';
    document.getElementById('configAtiva').value = 'true';
}

function carregarConfigsPresumido() {
    const configs = JSON.parse(localStorage.getItem('paramConfigPresumido'));
    const lista = document.getElementById('listaConfigsPresumido');
    
    if (!configs || configs.length === 0) {
        lista.innerHTML = '<div class="placeholder"><p>Nenhuma configuração cadastrada.</p></div>';
        return;
    }
    
    lista.innerHTML = '';
    
    configs.forEach(config => {
        const item = document.createElement('div');
        item.className = 'item-parametro';
        
        item.innerHTML = `
            <div class="param-header">
                <h5>${config.nome}</h5>
                <span class="param-status ${config.ativa ? 'status-ativa' : 'status-inativa'}">
                    ${config.ativa ? 'ATIVA' : 'INATIVA'}
                </span>
            </div>
            <div class="param-detalhes">
                <div class="param-detalhe">
                    <strong>IRPJ:</strong>
                    ${config.aliquotas.IRPJ}%
                </div>
                <div class="param-detalhe">
                    <strong>IRPJ Adicional:</strong>
                    ${config.aliquotas.IRPJAdicional}%
                </div>
                <div class="param-detalhe">
                    <strong>CSLL:</strong>
                    ${config.aliquotas.CSLL}%
                </div>
                <div class="param-detalhe">
                    <strong>PIS:</strong>
                    ${config.aliquotas.PIS}%
                </div>
                <div class="param-detalhe">
                    <strong>COFINS:</strong>
                    ${config.aliquotas.COFINS}%
                </div>
                <div class="param-detalhe">
                    <strong>Presunção Serviços:</strong>
                    ${config.presuncoes.servicos}%
                </div>
                <div class="param-detalhe">
                    <strong>Limite Adicional:</strong>
                    R$ ${formatarMoeda(config.limites.adicionalIRPJ)}
                </div>
            </div>
            <div class="param-acoes">
                <button class="btn-secondary" onclick="editarConfigPresumido('${config.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-secondary" onclick="alternarStatusConfigPresumido('${config.id}')">
                    <i class="fas fa-toggle-${config.ativa ? 'off' : 'on'}"></i> ${config.ativa ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

function editarConfigPresumido(id) {
    const configs = JSON.parse(localStorage.getItem('paramConfigPresumido'));
    const config = configs.find(c => c.id === id);
    
    if (config) {
        document.getElementById('configPresumidoId').value = config.id;
        document.getElementById('configNome').value = config.nome;
        document.getElementById('configAtiva').value = config.ativa.toString();
        
        document.getElementById('presumidoIRPJ').value = config.aliquotas.IRPJ;
        document.getElementById('presumidoIRPJAdicional').value = config.aliquotas.IRPJAdicional;
        document.getElementById('presumidoCSLL').value = config.aliquotas.CSLL;
        document.getElementById('presumidoPIS').value = config.aliquotas.PIS;
        document.getElementById('presumidoCOFINS').value = config.aliquotas.COFINS;
        document.getElementById('presumidoLimiteAdicional').value = config.limites.adicionalIRPJ;
        
        document.getElementById('presuncaoServicos').value = config.presuncoes.servicos;
        document.getElementById('presuncaoComercio').value = config.presuncoes.comercio;
        document.getElementById('presuncaoIndustria').value = config.presuncoes.industria;
        
        switchTab('parametrizacao');
        switchSubTab('presumido');
    }
}

function alternarStatusConfigPresumido(id) {
    const configs = JSON.parse(localStorage.getItem('paramConfigPresumido'));
    const index = configs.findIndex(c => c.id === id);
    
    if (index !== -1) {
        const novaSituacao = !configs[index].ativa;
        
        mostrarModal('Alterar Status',
            `Tem certeza que deseja ${novaSituacao ? 'ativar' : 'desativar'} esta configuração?`,
            () => {
                configs[index].ativa = novaSituacao;
                configs[index].dataAtualizacao = new Date().toISOString();
                
                registrarHistorico('presumido', novaSituacao ? 'ATIVAÇÃO' : 'INATIVAÇÃO', configs[index]);
                
                localStorage.setItem('paramConfigPresumido', JSON.stringify(configs));
                carregarConfigsPresumido();
                mostrarMensagem(`Configuração ${novaSituacao ? 'ativada' : 'desativada'}!`);
            }
        );
    }
}

// ========== LUCRO REAL ==========
function salvarConfigReal(e) {
    e.preventDefault();
    
    const configId = document.getElementById('configRealId').value;
    const configNome = document.getElementById('realNome').value.trim();
    const configAtiva = document.getElementById('realAtiva').value === 'true';
    
    const config = {
        id: configId || Date.now().toString(),
        nome: configNome,
        ativa: configAtiva,
        aliquotas: {
            IRPJ: parseFloat(document.getElementById('realIRPJ').value),
            IRPJAdicional: parseFloat(document.getElementById('realIRPJAdicional').value),
            CSLL: parseFloat(document.getElementById('realCSLL').value),
            PIS: parseFloat(document.getElementById('realPIS').value),
            COFINS: parseFloat(document.getElementById('realCOFINS').value),
            INSSPatronal: parseFloat(document.getElementById('realINSSPatronal').value),
            IRRFRetido: parseFloat(document.getElementById('realIRRFRetido').value) || 0,
            CSLLAdicional: parseFloat(document.getElementById('realCSLLAdicional').value) || 0
        },
        limites: {
            adicionalIRPJ: parseFloat(document.getElementById('realLimiteAdicional').value)
        },
        dataCadastro: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    // Registrar histórico
    registrarHistorico('real', configAtiva ? 'CRIAÇÃO' : 'INATIVAÇÃO', config);
    
    // Salvar
    const configs = JSON.parse(localStorage.getItem('paramConfigReal'));
    
    if (configId) {
        const index = configs.findIndex(c => c.id === configId);
        configs[index] = config;
        mostrarMensagem('Configuração atualizada!');
    } else {
        configs.push(config);
        mostrarMensagem('Nova configuração cadastrada!');
    }
    
    localStorage.setItem('paramConfigReal', JSON.stringify(configs));
    carregarConfigsReal();
    limparFormConfigReal();
}

// ========== FUNÇÕES DO LUCRO REAL ==========

function novaConfigReal() {
    limparFormConfigReal();
    document.getElementById('realNome').focus();
}

function limparFormConfigReal() {
    document.getElementById('formConfigReal').reset();
    document.getElementById('configRealId').value = '';
    document.getElementById('realAtiva').value = 'true';
    
    // Valores padrão para Lucro Real
    document.getElementById('realIRPJ').value = '15';
    document.getElementById('realIRPJAdicional').value = '10';
    document.getElementById('realCSLL').value = '9';
    document.getElementById('realPIS').value = '1.65';
    document.getElementById('realCOFINS').value = '7.6';
    document.getElementById('realLimiteAdicional').value = '20000';
    document.getElementById('realINSSPatronal').value = '20';
    document.getElementById('realIRRFRetido').value = '1.5';
    document.getElementById('realCSLLAdicional').value = '0';
}

function carregarConfigsReal() {
    const configs = JSON.parse(localStorage.getItem('paramConfigReal'));
    const lista = document.getElementById('listaConfigsReal');
    
    if (!configs || configs.length === 0) {
        lista.innerHTML = '<div class="placeholder"><p>Nenhuma configuração cadastrada.</p></div>';
        return;
    }
    
    lista.innerHTML = '';
    
    configs.forEach(config => {
        const item = document.createElement('div');
        item.className = 'item-parametro';
        
        item.innerHTML = `
            <div class="param-header">
                <h5>${config.nome}</h5>
                <span class="param-status ${config.ativa ? 'status-ativa' : 'status-inativa'}">
                    ${config.ativa ? 'ATIVA' : 'INATIVA'}
                </span>
            </div>
            <div class="param-detalhes">
                <div class="param-detalhe">
                    <strong>IRPJ:</strong>
                    ${config.aliquotas.IRPJ}%
                </div>
                <div class="param-detalhe">
                    <strong>IRPJ Adicional:</strong>
                    ${config.aliquotas.IRPJAdicional}%
                </div>
                <div class="param-detalhe">
                    <strong>CSLL:</strong>
                    ${config.aliquotas.CSLL}%
                </div>
                <div class="param-detalhe">
                    <strong>PIS:</strong>
                    ${config.aliquotas.PIS}%
                </div>
                <div class="param-detalhe">
                    <strong>COFINS:</strong>
                    ${config.aliquotas.COFINS}%
                </div>
                <div class="param-detalhe">
                    <strong>INSS Patronal:</strong>
                    ${config.aliquotas.INSSPatronal || 0}%
                </div>
                <div class="param-detalhe">
                    <strong>Limite Adicional:</strong>
                    R$ ${formatarMoeda(config.limites.adicionalIRPJ)}
                </div>
            </div>
            <div class="param-acoes">
                <button class="btn-secondary" onclick="editarConfigReal('${config.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-secondary" onclick="alternarStatusConfigReal('${config.id}')">
                    <i class="fas fa-toggle-${config.ativa ? 'off' : 'on'}"></i> ${config.ativa ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

function editarConfigReal(id) {
    const configs = JSON.parse(localStorage.getItem('paramConfigReal'));
    const config = configs.find(c => c.id === id);
    
    if (config) {
        document.getElementById('configRealId').value = config.id;
        document.getElementById('realNome').value = config.nome;
        document.getElementById('realAtiva').value = config.ativa.toString();
        
        document.getElementById('realIRPJ').value = config.aliquotas.IRPJ;
        document.getElementById('realIRPJAdicional').value = config.aliquotas.IRPJAdicional;
        document.getElementById('realCSLL').value = config.aliquotas.CSLL;
        document.getElementById('realPIS').value = config.aliquotas.PIS;
        document.getElementById('realCOFINS').value = config.aliquotas.COFINS;
        document.getElementById('realLimiteAdicional').value = config.limites.adicionalIRPJ;
        
        document.getElementById('realINSSPatronal').value = config.aliquotas.INSSPatronal;
        document.getElementById('realIRRFRetido').value = config.aliquotas.IRRFRetido || '';
        document.getElementById('realCSLLAdicional').value = config.aliquotas.CSLLAdicional || '';
        
        switchTab('parametrizacao');
        switchSubTab('real');
    }
}

function alternarStatusConfigReal(id) {
    const configs = JSON.parse(localStorage.getItem('paramConfigReal'));
    const index = configs.findIndex(c => c.id === id);
    
    if (index !== -1) {
        const novaSituacao = !configs[index].ativa;
        
        mostrarModal('Alterar Status',
            `Tem certeza que deseja ${novaSituacao ? 'ativar' : 'desativar'} esta configuração?`,
            () => {
                configs[index].ativa = novaSituacao;
                configs[index].dataAtualizacao = new Date().toISOString();
                
                registrarHistorico('real', novaSituacao ? 'ATIVAÇÃO' : 'INATIVAÇÃO', configs[index]);
                
                localStorage.setItem('paramConfigReal', JSON.stringify(configs));
                carregarConfigsReal();
                mostrarMensagem(`Configuração ${novaSituacao ? 'ativada' : 'desativada'}!`);
            }
        );
    }
}

function calcularImpostosLucroRealAtualizado(faturamento) {
    const configs = JSON.parse(localStorage.getItem('paramConfigReal'));
    const configAtiva = configs.find(c => c.ativa);
    
    if (!configAtiva) {
        return calcularImpostosLucroReal(faturamento);
    }
    
    const config = configAtiva;
    
    // Para simplificação, vamos considerar um lucro de 20% do faturamento
    const margemLucro = 0.20;
    const baseCalculo = faturamento * margemLucro;
    
    // Cálculo IRPJ
    let irpj = baseCalculo * (config.aliquotas.IRPJ / 100);
    
    // Adicional de IRPJ
    if (baseCalculo > config.limites.adicionalIRPJ) {
        irpj += (baseCalculo - config.limites.adicionalIRPJ) * (config.aliquotas.IRPJAdicional / 100);
    }
    
    // Cálculo CSLL
    let csll = baseCalculo * (config.aliquotas.CSLL / 100);
    
    // CSLL Adicional se existir
    if (config.aliquotas.CSLLAdicional && config.aliquotas.CSLLAdicional > 0) {
        csll += baseCalculo * (config.aliquotas.CSLLAdicional / 100);
    }
    
    // PIS/COFINS não cumulativos
    const pis = faturamento * (config.aliquotas.PIS / 100);
    const cofins = faturamento * (config.aliquotas.COFINS / 100);
    
    // INSS Patronal (sobre folha de pagamento)
    // Para simplificação, vamos considerar 20% do faturamento como folha
    const inssPatronal = (faturamento * 0.20) * (config.aliquotas.INSSPatronal / 100);
    
    // IRRF Retido na fonte
    const irrfRetido = faturamento * ((config.aliquotas.IRRFRetido || 0) / 100);
    
    const totalImpostos = irpj + csll + pis + cofins + inssPatronal + irrfRetido;
    
    return {
        regime: 'Lucro Real',
        config: config.nome,
        irpj: irpj,
        csll: csll,
        pis: pis,
        cofins: cofins,
        inssPatronal: inssPatronal,
        irrfRetido: irrfRetido,
        valorImposto: totalImpostos,
        baseCalculo: baseCalculo,
        margemLucro: '20%'
    };
}

// ... funções similares para Lucro Real (novaConfigReal, limparFormConfigReal, carregarConfigsReal, editarConfigReal)

// ========== HISTÓRICO DE PARAMETRIZAÇÃO ==========
function registrarHistorico(tipo, acao, dados) {
    const historico = JSON.parse(localStorage.getItem('paramHistorico'));
    
    const registro = {
        id: Date.now().toString(),
        tipo: tipo,
        acao: acao,
        dados: dados,
        data: new Date().toISOString(),
        usuario: 'Sistema' // Em uma versão real, pegaria do login
    };
    
    historico.unshift(registro); // Adicionar no início
    localStorage.setItem('paramHistorico', JSON.stringify(historico));
}

function carregarHistoricoParam() {
    const historico = JSON.parse(localStorage.getItem('paramHistorico'));
    const lista = document.getElementById('listaHistoricoParam');
    
    if (!historico || historico.length === 0) {
        lista.innerHTML = '<div class="placeholder"><p>Nenhum histórico registrado.</p></div>';
        return;
    }
    
    lista.innerHTML = '';
    
    historico.forEach(registro => {
        const item = document.createElement('div');
        item.className = 'item-historico-param';
        
        let tipoClass = '';
        let tipoTexto = '';
        
        switch(registro.tipo) {
            case 'simples':
                tipoClass = 'tipo-simples';
                tipoTexto = 'Simples Nacional';
                break;
            case 'presumido':
                tipoClass = 'tipo-presumido';
                tipoTexto = 'Lucro Presumido';
                break;
            case 'real':
                tipoClass = 'tipo-real';
                tipoTexto = 'Lucro Real';
                break;
        }
        
        item.innerHTML = `
            <div class="historico-header">
                <div>
                    <span class="historico-tipo ${tipoClass}">${tipoTexto}</span>
                    <strong>${registro.acao}</strong>
                </div>
                <div>
                    <small>${formatarDataHora(registro.data)}</small>
                </div>
            </div>
            <div class="historico-detalhes">
                <p><strong>Usuário:</strong> ${registro.usuario}</p>
                <p><strong>Configuração:</strong> ${registro.dados.nome || 'N/A'}</p>
            </div>
            <div class="historico-alteracoes">
                <p><strong>Detalhes:</strong> ${obterDetalhesHistorico(registro)}</p>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

function obterDetalhesHistorico(registro) {
    switch(registro.tipo) {
        case 'simples':
            return `Faixa: ${registro.dados.nome}, Alíquota: ${registro.dados.aliquota}%`;
        case 'presumido':
        case 'real':
            return `IRPJ: ${registro.dados.aliquotas.IRPJ}%, CSLL: ${registro.dados.aliquotas.CSLL}%`;
        default:
            return 'Alteração registrada';
    }
}

function aplicarFiltroHistoricoParam() {
    // Implementar filtros
    carregarHistoricoParam();
}

function limparFiltroHistoricoParam() {
    document.getElementById('filtroTipoParam').value = '';
    document.getElementById('filtroDataParam').value = '';
    document.getElementById('filtroUsuarioParam').value = '';
    carregarHistoricoParam();
}

// ========== INTEGRAÇÃO COM CÁLCULO DE IMPOSTOS ==========
function obterFaixaSimplesPorReceita(receita, anexo) {
    const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
    // Filtrar por anexo e status ativo
    const faixasFiltradas = faixas.filter(f => 
        f.ativa && 
        f.anexo === anexo
    );
	
	// Encontrar a faixa correta
    for (const faixa of faixasFiltradas) {
        if (receita >= faixa.inicio && (!faixa.fim || receita <= faixa.fim)) {
            return faixa;
        }
    }
    
    // Se não encontrou, retornar a última faixa do anexo (sem limite superior)
    const ultimaFaixaAnexo = faixasFiltradas
        .filter(f => !f.fim)
        .sort((a, b) => b.inicio - a.inicio)[0];
    
    if (ultimaFaixaAnexo && receita >= ultimaFaixaAnexo.inicio) {
        return ultimaFaixaAnexo;
    }
       
    return null;
}

function calcularImpostosSimplesNacionalAtualizado(faturamento) {
    const faixa = obterFaixaSimplesPorReceita(faturamento);
    
    if (!faixa) {
        // Fallback para cálculo padrão
        return calcularImpostosSimplesNacionalAtualizado(faturamento);
    }
    
    // Cálculo usando a faixa parametrizada
    const impostoTotal = (faturamento * (faixa.aliquota / 100)) - faixa.deduzir;
    const impostoFinal = impostoTotal > 0 ? impostoTotal : 0;
    
    // Calcular repartição
    const reparticao = {};
    for (const [tributo, percentual] of Object.entries(faixa.reparticao)) {
        reparticao[tributo] = (impostoFinal * (percentual / 100));
    }
    
    return {
        regime: 'Simples Nacional',
        faixa: faixa.nome,
        aliquota: faixa.aliquota.toFixed(2) + '%',
        valorDeduzir: faixa.deduzir,
        valorImposto: impostoFinal,
        reparticao: reparticao,
        baseCalculo: faturamento
    };
}

// ========== CÁLCULO DE IMPOSTOS ==========
function calcularImpostos() {
    const cnpjEmpresa = document.getElementById('cnpjCalculo').value;
    const mesCalculo = document.getElementById('mesCalculo').value;
    
    if (!cnpjEmpresa || !mesCalculo) {
        mostrarModal('Erro', 'Selecione uma empresa e um mês/ano para calcular os impostos.');
        return;
    }
    
    // Buscar empresa
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
    
    if (!empresa) {
        mostrarModal('Erro', 'Empresa não encontrada.');
        return;
    }
    
    // Buscar situação atual da empresa (mais recente)
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const situacoesEmpresa = situacoes
        .filter(s => s.cnpjEmpresa === cnpjEmpresa)
        .sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));
    
    const situacaoAtual = situacoesEmpresa.length > 0 ? situacoesEmpresa[0] : null;
    
    if (!situacaoAtual) {
        mostrarModal('Erro', 'Nenhuma situação cadastrada para esta empresa.');
        return;
    }
    
    // Buscar vendas do mês selecionado
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const vendaMes = vendas.find(v => v.cnpjEmpresa === cnpjEmpresa && v.mes === mesCalculo);
    
    if (!vendaMes) {
        mostrarModal('Erro', 'Nenhuma venda registrada para este mês/ano.');
        return;
    }
    
    // Calcular impostos conforme regime tributário
    const valorVendas = vendaMes.valor;
    let resultado = {};
    
	switch(situacaoAtual.tributacao) {
        case 'simples':
            // VERIFICAR SE TEM ANEXO
            if (!situacaoAtual.anexo) {
                mostrarModal('Erro', 'Esta empresa não tem anexo definido no Simples Nacional.');
                return;
            }
            resultado = calcularImpostosSimplesNacionalAtualizado(valorVendas, situacaoAtual.anexo);
            break;
        case 'presumido':
            resultado = calcularImpostosLucroPresumidoAtualizado(valorVendas);
            break;
        case 'real':
            resultado = calcularImpostosLucroRealAtualizado(valorVendas);
            break;
        default:
            mostrarModal('Erro', 'Regime tributário não reconhecido.');
            return;
    }
    
    // Exibir resultado
    exibirResultadoCalculo(empresa, situacaoAtual, vendaMes, resultado);
}

// Atualizar função de cálculo do Simples Nacional para receber anexo
function calcularImpostosSimplesNacionalAtualizado(faturamento, anexo) {
    const faixa = obterFaixaSimplesPorReceita(faturamento, anexo);
    
    if (!faixa) {
        // Fallback para cálculo padrão
        return calcularImpostosSimplesNacionalAtualizado(faturamento);
    }
    
    // Cálculo usando a faixa parametrizada
    const impostoTotal = (faturamento * (faixa.aliquota / 100)) - faixa.deduzir;
    const impostoFinal = impostoTotal > 0 ? impostoTotal : 0;
    
    // Calcular repartição
    const reparticao = {};
    for (const [tributo, percentual] of Object.entries(faixa.reparticao)) {
        reparticao[tributo] = (impostoFinal * (percentual / 100));
    }
    
    return {
        regime: 'Simples Nacional',
        anexo: `Anexo ${faixa.anexo} - ${getDescricaoAnexo(faixa.anexo)}`,
        faixa: faixa.nome,
        aliquota: faixa.aliquota.toFixed(2) + '%',
        valorDeduzir: faixa.deduzir,
        valorImposto: impostoFinal,
        reparticao: reparticao,
        baseCalculo: faturamento
    };
}

function calcularImpostosLucroPresumido(faturamento) {
    // Cálculo simplificado para Lucro Presumido
    const aliquotaIRPJ = 0.15; // 15%
    const adicionalIRPJ = 0.10; // 10% sobre o que ultrapassar R$ 20.000/mês
    const aliquotaCSLL = 0.09; // 9%
    
    // Base de cálculo (presunção de lucro de 8% para serviços, 32% para comércio)
    // Usaremos 8% como exemplo para serviços
    const presuncaoLucro = 0.08;
    const baseCalculo = faturamento * presuncaoLucro;
    
    // Cálculo IRPJ
    let irpj = baseCalculo * aliquotaIRPJ;
    
    // Adicional de IRPJ (sobre o que ultrapassar R$ 20.000/mês na base de cálculo)
    if (baseCalculo > 20000) {
        irpj += (baseCalculo - 20000) * adicionalIRPJ;
    }
    
    // Cálculo CSLL
    const csll = baseCalculo * aliquotaCSLL;
    
    // PIS/COFINS cumulativos (aproximado)
    const pisCofins = faturamento * 0.034; // 3,4%
    
    const totalImpostos = irpj + csll + pisCofins;
    
    return {
        regime: 'Lucro Presumido',
        irpj: irpj,
        csll: csll,
        pisCofins: pisCofins,
        valorImposto: totalImpostos,
        baseCalculo: baseCalculo,
        presuncaoLucro: (presuncaoLucro * 100).toFixed(0) + '%'
    };
}

function calcularImpostosLucroPresumidoAtualizado(faturamento) {
    const configs = JSON.parse(localStorage.getItem('paramConfigPresumido'));
    const configAtiva = configs.find(c => c.ativa);
    
    if (!configAtiva) {
        return calcularImpostosLucroPresumido(faturamento);
    }
    
    const config = configAtiva;
    
    // Usar presunção de serviços como padrão
    const presuncaoLucro = config.presuncoes.servicos / 100;
    const baseCalculo = faturamento * presuncaoLucro;
    
    // Cálculo IRPJ
    let irpj = baseCalculo * (config.aliquotas.IRPJ / 100);
    
    // Adicional de IRPJ
    if (baseCalculo > config.limites.adicionalIRPJ) {
        irpj += (baseCalculo - config.limites.adicionalIRPJ) * (config.aliquotas.IRPJAdicional / 100);
    }
    
    // Cálculo CSLL
    const csll = baseCalculo * (config.aliquotas.CSLL / 100);
    
    // PIS/COFINS
    const pis = faturamento * (config.aliquotas.PIS / 100);
    const cofins = faturamento * (config.aliquotas.COFINS / 100);
    
    const totalImpostos = irpj + csll + pis + cofins;
    
    return {
        regime: 'Lucro Presumido',
        config: config.nome,
        irpj: irpj,
        csll: csll,
        pis: pis,
        cofins: cofins,
        valorImposto: totalImpostos,
        baseCalculo: baseCalculo,
        presuncaoLucro: config.presuncoes.servicos + '%'
    };
}

function calcularImpostosLucroReal(faturamento) {
    // Cálculo simplificado para Lucro Real
    const aliquotaIRPJ = 0.15; // 15%
    const adicionalIRPJ = 0.10; // 10% sobre o que ultrapassar R$ 20.000/mês
    const aliquotaCSLL = 0.09; // 9%
    
    // Para simplificação, vamos considerar um lucro de 20% do faturamento
    const margemLucro = 0.20;
    const baseCalculo = faturamento * margemLucro;
    
    // Cálculo IRPJ
    let irpj = baseCalculo * aliquotaIRPJ;
    
    // Adicional de IRPJ (sobre o que ultrapassar R$ 20.000/mês na base de cálculo)
    if (baseCalculo > 20000) {
        irpj += (baseCalculo - 20000) * adicionalIRPJ;
    }
    
    // Cálculo CSLL
    const csll = baseCalculo * aliquotaCSLL;
    
    // PIS/COFINS não cumulativos (aproximado)
    const pisCofins = faturamento * 0.0925; // 9,25%
    
    const totalImpostos = irpj + csll + pisCofins;
    
    return {
        regime: 'Lucro Real',
        irpj: irpj,
        csll: csll,
        pisCofins: pisCofins,
        valorImposto: totalImpostos,
        baseCalculo: baseCalculo,
        margemLucro: (margemLucro * 100).toFixed(0) + '%'
    };
}

function exibirResultadoCalculo(empresa, situacao, venda, resultado) {
    const resultadoElement = document.getElementById('resultadoCalculo');
    
    // Mapear tributação para texto
    const tributacaoText = {
        'simples': 'Simples Nacional',
        'presumido': 'Lucro Presumido',
        'real': 'Lucro Real'
    }[situacao.tributacao] || situacao.tributacao;
    
    // Cor baseada no tipo de tributação
    let corTributacao = '#4a6491';
    if (situacao.tributacao === 'simples') corTributacao = '#2ecc71';
    if (situacao.tributacao === 'presumido') corTributacao = '#e74c3c';
    if (situacao.tributacao === 'real') corTributacao = '#3498db';
    
    // Informações específicas do anexo
    let anexoHTML = '';
    if (situacao.tributacao === 'simples' && situacao.anexo) {
        anexoHTML = `
            <p><strong>Anexo:</strong> 
                <span class="anexo-badge anexo-${situacao.anexo}" style="margin-left: 5px;">
                    Anexo ${situacao.anexo}
                </span>
            </p>
            ${situacao.atividadesAnexo ? `<p><strong>Atividades:</strong> ${situacao.atividadesAnexo}</p>` : ''}
        `;
    }
    
    let resultadoHTML = `
        <h3><i class="fas fa-file-invoice-dollar"></i> Resultado do Cálculo</h3>
        <div class="detalhes-empresa" style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Empresa:</strong> ${empresa.nomeFantasia} (${formatarCNPJ(empresa.cnpj)})</p>
            <p><strong>Regime Tributário:</strong> <span style="color: ${corTributacao}; font-weight: bold">${tributacaoText}</span></p>
            ${anexoHTML}
            <p><strong>Mês/Ano:</strong> ${formatarMesAno(venda.mes)}</p>
            <p><strong>Faturamento:</strong> ${formatarMoeda(venda.valor)}</p>
        </div>
        <div class="detalhes-impostos">
            <h4>Detalhamento dos Impostos</h4>
    `;
        
    if (resultado.regime === 'Simples Nacional') {
        resultadoHTML += `
            <p><strong>Alíquota Aplicada:</strong> ${resultado.aliquota}</p>
            <p><strong>Parcela a Deduzir:</strong> ${formatarMoeda(resultado.parcelaDeduzir)}</p>
            <p><strong>Base de Cálculo:</strong> ${formatarMoeda(resultado.baseCalculo)}</p>
            <div class="total-imposto" style="background-color: ${corTributacao}; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin: 0; text-align: center;"><strong>Total de Impostos a Pagar:</strong> ${formatarMoeda(resultado.valorImposto)}</h3>
            </div>
        `;
    } else {
        resultadoHTML += `
            <p><strong>IRPJ:</strong> ${formatarMoeda(resultado.irpj)}</p>
            <p><strong>CSLL:</strong> ${formatarMoeda(resultado.csll)}</p>
            <p><strong>PIS/COFINS:</strong> ${formatarMoeda(resultado.pisCofins)}</p>
            <p><strong>Base de Cálculo (${resultado.presuncaoLucro || resultado.margemLucro} do faturamento):</strong> ${formatarMoeda(resultado.baseCalculo)}</p>
            <div class="total-imposto" style="background-color: ${corTributacao}; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin: 0; text-align: center;"><strong>Total de Impostos a Pagar:</strong> ${formatarMoeda(resultado.valorImposto)}</h3>
            </div>
        `;
    }
    
    resultadoHTML += `
        </div>
        <div class="observacoes" style="margin-top: 20px; padding: 10px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><i class="fas fa-info-circle"></i> <em>Este cálculo é uma estimativa simplificada. Consulte um contador para valores exatos.</em></p>
        </div>
    `;
    
    resultadoElement.innerHTML = resultadoHTML;
}

// Função para carregar dados padrão dos anexos (opcional)
function carregarDadosPadraoAnexos() {
    const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples'));
    
    if (faixas.length === 0) {
        // Dados padrão do Anexo I (Comércio)
        const faixasPadrao = [
            {
                id: '1',
                anexo: 'I',
                nome: '1ª Faixa',
                ativa: true,
                inicio: 0,
                fim: 180000,
                aliquota: 4.0,
                deduzir: 0,
                reparticao: {
                    IRPJ: 5.5,
                    CSLL: 3.5,
                    COFINS: 12.74,
                    PIS: 2.76,
                    CPP: 42.0,
                    ICMS: 20.0,
                    ISS: 5.0,
                    IPI: 0,
                    INSS: 9.5
                },
                dataCadastro: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString()
            },
            {
                id: '2',
                anexo: 'I',
                nome: '2ª Faixa',
                ativa: true,
                inicio: 180000.01,
                fim: 360000,
                aliquota: 7.3,
                deduzir: 5940,
                reparticao: {
                    IRPJ: 5.5,
                    CSLL: 3.5,
                    COFINS: 12.74,
                    PIS: 2.76,
                    CPP: 42.0,
                    ICMS: 20.0,
                    ISS: 5.0,
                    IPI: 0,
                    INSS: 9.5
                },
                dataCadastro: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString()
            },
            // Adicione mais faixas para outros anexos conforme necessário
        ];
        
        localStorage.setItem('paramFaixasSimples', JSON.stringify(faixasPadrao));
        mostrarMensagem('Dados padrão dos anexos carregados com sucesso!');
    }
}

// ========== HISTÓRICO E FILTROS ==========
function aplicarFiltroHistorico() {
    const filtroEmpresa = document.getElementById('filtroEmpresa').value;
    const filtroAno = document.getElementById('filtroAno').value;
    
    // Buscar todos os dados
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    
    let historicoHTML = '<h3>Histórico Consolidado</h3>';
    
    // Filtrar vendas
    let vendasFiltradas = vendas;
    if (filtroEmpresa) {
        vendasFiltradas = vendasFiltradas.filter(v => v.cnpjEmpresa === filtroEmpresa);
    }
    if (filtroAno) {
        vendasFiltradas = vendasFiltradas.filter(v => v.mes.startsWith(filtroAno));
    }
    
    // Ordenar vendas por mês
    vendasFiltradas.sort((a, b) => b.mes.localeCompare(a.mes));
    
    if (vendasFiltradas.length > 0) {
        historicoHTML += '<h4 style="margin-top: 20px; color: #4a6491;">Registros de Vendas</h4>';
        
        vendasFiltradas.forEach(venda => {
            const empresa = clientes.find(c => c.cnpj === venda.cnpjEmpresa);
            const nomeEmpresa = empresa ? empresa.nomeFantasia : 'Empresa não encontrada';
            
            historicoHTML += `
                <div class="item-historico" style="padding: 10px; border-bottom: 1px solid #eee;">
                    <p style="margin: 0;"><strong>${nomeEmpresa}</strong> - ${formatarMesAno(venda.mes)}: ${formatarMoeda(venda.valor)}</p>
                </div>
            `;
        });
    } else {
        historicoHTML += '<p>Nenhuma venda encontrada com os filtros aplicados.</p>';
    }
    
    // Filtrar situações
    let situacoesFiltradas = situacoes;
    if (filtroEmpresa) {
        situacoesFiltradas = situacoesFiltradas.filter(s => s.cnpjEmpresa === filtroEmpresa);
    }
    if (filtroAno) {
        situacoesFiltradas = situacoesFiltradas.filter(s => s.dataSituacao.startsWith(filtroAno));
    }
    
    // Ordenar situações por data
    situacoesFiltradas.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));
    
    if (situacoesFiltradas.length > 0) {
        historicoHTML += '<h4 style="margin-top: 20px; color: #4a6491;">Histórico de Situações</h4>';
        
        situacoesFiltradas.forEach(situacao => {
            const empresa = clientes.find(c => c.cnpj === situacao.cnpjEmpresa);
            const nomeEmpresa = empresa ? empresa.nomeFantasia : 'Empresa não encontrada';
            
            const tributacaoText = {
                'simples': 'Simples Nacional',
                'presumido': 'Lucro Presumido',
                'real': 'Lucro Real'
            }[situacao.tributacao] || situacao.tributacao;
            
            historicoHTML += `
                <div class="item-historico" style="padding: 10px; border-bottom: 1px solid #eee;">
                    <p style="margin: 0 0 5px 0;"><strong>${nomeEmpresa}</strong> - ${formatarData(situacao.dataSituacao)}: ${tributacaoText}</p>
                    <p style="margin: 0; font-size: 0.9em; color: #666;">${situacao.endereco}</p>
                </div>
            `;
        });
    }
    
    document.getElementById('conteudoHistorico').innerHTML = historicoHTML;
}

// Adicionar filtro por anexo
document.getElementById('aplicarFiltroAnexo').addEventListener('click', function() {
    const filtroAnexo = document.getElementById('filtroAnexo').value;
    carregarFaixasSimples(filtroAnexo);
});

// ========== FUNÇÕES AUXILIARES ==========
function atualizarSelects() {
    const clientes = JSON.parse(localStorage.getItem('clientes'));
    
    if (!clientes || clientes.length === 0) {
        // Atualizar todos os selects
        const selects = [
            'cnpjEmpresa',
            'cnpjVendas',
            'cnpjCalculo',
            'filtroEmpresa'
        ];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Manter apenas a primeira opção
                while (select.options.length > 1) {
                    select.remove(1);
                }
            }
        });
        return;
    }
    
    // Ordenar clientes por nome
    clientes.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
    
    // Atualizar selects de CNPJ
    const selects = [
        'cnpjEmpresa',
        'cnpjVendas',
        'cnpjCalculo',
        'filtroEmpresa'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Salvar valor atual
            const valorAtual = select.value;
            
            // Limpar opções (exceto a primeira)
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Adicionar opções
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.cnpj;
                option.textContent = `${cliente.nomeFantasia} (${formatarCNPJ(cliente.cnpj)})`;
                select.appendChild(option);
            });
            
            // Restaurar valor selecionado se ainda existir
            if (valorAtual && Array.from(select.options).some(opt => opt.value === valorAtual)) {
                select.value = valorAtual;
            }
        }
    });
    
    // Atualizar filtro de anos
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const anos = [...new Set(vendas.map(v => v.mes.substring(0, 4)))].sort().reverse();
    
    const filtroAno = document.getElementById('filtroAno');
    if (filtroAno) {
        // Salvar valor atual
        const valorAtual = filtroAno.value;
        
        // Limpar opções (exceto a primeira)
        while (filtroAno.options.length > 1) {
            filtroAno.remove(1);
        }
        
        // Adicionar opções
        anos.forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAno.appendChild(option);
        });
        
        // Restaurar valor selecionado se ainda existir
        if (valorAtual && Array.from(filtroAno.options).some(opt => opt.value === valorAtual)) {
            filtroAno.value = valorAtual;
        }
    }
}

function removerDadosRelacionados(cnpj) {
    // Remover situações relacionadas
    const situacoes = JSON.parse(localStorage.getItem('situacoes'));
    const situacoesAtualizadas = situacoes.filter(s => s.cnpjEmpresa !== cnpj);
    localStorage.setItem('situacoes', JSON.stringify(situacoesAtualizadas));
    
    // Remover vendas relacionadas
    const vendas = JSON.parse(localStorage.getItem('vendas'));
    const vendasAtualizadas = vendas.filter(v => v.cnpjEmpresa !== cnpj);
    localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
    
    // Recarregar listas
    carregarSituacoes();
    carregarVendas();
}

// ========== EXPORTAÇÃO/IMPORTAÇÃO DE DADOS ==========
function exportarDados() {
    const dados = {
		 // Dados principais
        clientes: JSON.parse(localStorage.getItem('clientes')),
        situacoes: JSON.parse(localStorage.getItem('situacoes')),
        vendas: JSON.parse(localStorage.getItem('vendas')),
		  // Dados de parametrização
        parametrizacao: {
            faixasSimples: JSON.parse(localStorage.getItem('paramFaixasSimples')),
            configPresumido: JSON.parse(localStorage.getItem('paramConfigPresumido')),
            configReal: JSON.parse(localStorage.getItem('paramConfigReal')),
            historicoParam: JSON.parse(localStorage.getItem('paramHistorico'))
		},
		
		// Metadados
        dataExportacao: new Date().toISOString(),
        versao: '2.0',
        totalClientes: JSON.parse(localStorage.getItem('clientes')).length,
        totalSituacoes: JSON.parse(localStorage.getItem('situacoes')).length,
        totalVendas: JSON.parse(localStorage.getItem('vendas')).length,
        totalFaixasSimples: JSON.parse(localStorage.getItem('paramFaixasSimples')).length,
        totalConfigPresumido: JSON.parse(localStorage.getItem('paramConfigPresumido')).length,
        totalConfigReal: JSON.parse(localStorage.getItem('paramConfigReal')).length
    };
    
    const dadosJSON = JSON.stringify(dados, null, 2);
    const blob = new Blob([dadosJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-vendas-impostos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
	// Mensagem atualizada
    let mensagem = `Dados exportados com sucesso!\n`;
    mensagem += `• ${dados.totalClientes} cliente(s)\n`;
    mensagem += `• ${dados.totalSituacoes} situação(ões)\n`;
    mensagem += `• ${dados.totalVendas} venda(s)\n`;
    mensagem += `• ${dados.totalFaixasSimples} faixa(s) do Simples\n`;
    mensagem += `• ${dados.totalConfigPresumido} configuração(ões) do Presumido\n`;
    mensagem += `• ${dados.totalConfigReal} configuração(ões) do Real`;
	
    mostrarMensagem(mensagem);
}

function importarDados() {
    document.getElementById('fileImport').click();
    document.getElementById('fileImport').onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const dados = JSON.parse(event.target.result);
                
                // Validação básica da estrutura (versão antiga ou nova)
                if (!dados.clientes || !dados.situacoes || !dados.vendas) {
                    throw new Error('Formato de arquivo inválido - estrutura básica não encontrada');
                }
                
                // Verificar se é backup antigo (sem parametrização)
                const temParametrizacao = dados.parametrizacao !== undefined;
                
                let mensagemConfirmacao = `Isso substituirá todos os dados atuais.\n\n`;
                mensagemConfirmacao += `Arquivo contém:\n`;
                mensagemConfirmacao += `• ${dados.clientes.length} cliente(s)\n`;
                mensagemConfirmacao += `• ${dados.situacoes.length} situação(ões)\n`;
                mensagemConfirmacao += `• ${dados.vendas.length} venda(s)\n`;
                
                if (temParametrizacao) {
                    mensagemConfirmacao += `• ${dados.parametrizacao.faixasSimples.length} faixa(s) do Simples\n`;
                    mensagemConfirmacao += `• ${dados.parametrizacao.configPresumido.length} configuração(ões) do Presumido\n`;
                    mensagemConfirmacao += `• ${dados.parametrizacao.configReal.length} configuração(ões) do Real`;
                }
                
                mostrarModal('Importar Dados', mensagemConfirmacao, () => {
                    // Salvar dados principais
                    localStorage.setItem('clientes', JSON.stringify(dados.clientes));
                    localStorage.setItem('situacoes', JSON.stringify(dados.situacoes));
                    localStorage.setItem('vendas', JSON.stringify(dados.vendas));
                    
                    // Salvar dados de parametrização (se existirem)
                    if (temParametrizacao) {
                        localStorage.setItem('paramFaixasSimples', JSON.stringify(dados.parametrizacao.faixasSimples));
                        localStorage.setItem('paramConfigPresumido', JSON.stringify(dados.parametrizacao.configPresumido));
                        localStorage.setItem('paramConfigReal', JSON.stringify(dados.parametrizacao.configReal));
                        localStorage.setItem('paramHistorico', JSON.stringify(dados.parametrizacao.historicoParam));
                    } else {
                        // Backup antigo - inicializar parametrização se não existir
                        initParametrizacao();
                    }
                    
                    // Atualizar interface
                    carregarClientes();
                    carregarSituacoes();
                    carregarVendas();
                    carregarFaixasSimples();
                    carregarConfigsPresumido();
                    carregarConfigsReal();
                    carregarHistoricoParam();
                    atualizarSelects();
                    
                    // Mensagem de sucesso
                    let mensagemSucesso = `Dados importados com sucesso!\n`;
                    mensagemSucesso += `• ${dados.clientes.length} cliente(s)\n`;
                    mensagemSucesso += `• ${dados.situacoes.length} situação(ões)\n`;
                    mensagemSucesso += `• ${dados.vendas.length} venda(s)`;
                    
                    if (temParametrizacao) {
                        mensagemSucesso += `\n• ${dados.parametrizacao.faixasSimples.length} faixa(s) do Simples`;
                        mensagemSucesso += `\n• ${dados.parametrizacao.configPresumido.length} configuração(ões) do Presumido`;
                        mensagemSucesso += `\n• ${dados.parametrizacao.configReal.length} configuração(ões) do Real`;
                    }
                    
                    mostrarMensagem(mensagemSucesso);
                });
            } catch (error) {
                console.error('Erro na importação:', error);
                mostrarModal('Erro na Importação', 
                    `Arquivo inválido ou corrompido.\n\n` +
                    `Detalhes: ${error.message}\n\n` +
                    `Verifique se é um arquivo JSON válido gerado por este aplicativo.`);
            }
        };
        reader.readAsText(file);
        
        // Limpar input para permitir nova importação
        e.target.value = '';
    };
}

function confirmarLimpezaDados() {
    const totalClientes = JSON.parse(localStorage.getItem('clientes')).length;
    const totalSituacoes = JSON.parse(localStorage.getItem('situacoes')).length;
    const totalVendas = JSON.parse(localStorage.getItem('vendas')).length;
    const totalFaixasSimples = JSON.parse(localStorage.getItem('paramFaixasSimples')).length;
    const totalConfigPresumido = JSON.parse(localStorage.getItem('paramConfigPresumido')).length;
    const totalConfigReal = JSON.parse(localStorage.getItem('paramConfigReal')).length;
    
    let mensagem = `Tem certeza que deseja apagar TODOS os dados?\n\n`;
    mensagem += `Isso removerá permanentemente:\n`;
    mensagem += `• ${totalClientes} cliente(s)\n`;
    mensagem += `• ${totalSituacoes} situação(ões)\n`;
    mensagem += `• ${totalVendas} venda(s)\n`;
    mensagem += `• ${totalFaixasSimples} faixa(s) do Simples\n`;
    mensagem += `• ${totalConfigPresumido} configuração(ões) do Presumido\n`;
    mensagem += `• ${totalConfigReal} configuração(ões) do Real\n\n`;
    mensagem += `Esta ação não pode ser desfeita.`;
    
    mostrarModal('Limpar Todos os Dados', mensagem, () => {
        // Limpar dados principais
        localStorage.setItem('clientes', JSON.stringify([]));
        localStorage.setItem('situacoes', JSON.stringify([]));
        localStorage.setItem('vendas', JSON.stringify([]));
        
        // Limpar dados de parametrização
        localStorage.setItem('paramFaixasSimples', JSON.stringify([]));
        localStorage.setItem('paramConfigPresumido', JSON.stringify([]));
        localStorage.setItem('paramConfigReal', JSON.stringify([]));
        localStorage.setItem('paramHistorico', JSON.stringify([]));
        
        // Atualizar interface
        carregarClientes();
        carregarSituacoes();
        carregarVendas();
        carregarFaixasSimples();
        carregarConfigsPresumido();
        carregarConfigsReal();
        carregarHistoricoParam();
        atualizarSelects();
        
        mostrarMensagem('Todos os dados foram removidos!');
    });
}

// ========== MODAL E MENSAGENS ==========
let modalCallback = null;

function mostrarModal(titulo, mensagem, callback = null) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalMessage').textContent = mensagem;
    modalCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('confirmModal').style.display = 'none';
    modalCallback = null;
}

function confirmarAcaoModal() {
    if (modalCallback) {
        modalCallback();
    }
    fecharModal();
}

function mostrarMensagem(texto) {
    // Criar elemento de mensagem
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-flutuante';
    mensagem.innerHTML = `<i class="fas fa-check-circle"></i> ${texto}`;
    mensagem.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #48bb78;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(mensagem);
    
    // Remover após 3 segundos
    setTimeout(() => {
        mensagem.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (mensagem.parentNode) {
                mensagem.parentNode.removeChild(mensagem);
            }
        }, 300);
    }, 3000);
}

// Adicionar estilos de animação para mensagens
if (!document.querySelector('#animacaoMensagens')) {
    const style = document.createElement('style');
    style.id = 'animacaoMensagens';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ========== FUNÇÕES ESPECÍFICAS PARA ANEXOS DO SIMPLES NACIONAL ==========

// Mostrar/ocultar campo de anexo quando selecionar Simples Nacional
document.getElementById('tributacao').addEventListener('change', function() {
    const anexoContainer = document.getElementById('anexoContainer');
    if (this.value === 'simples') {
        anexoContainer.style.display = 'flex';
        document.getElementById('anexoSimples').required = true;
    } else {
        anexoContainer.style.display = 'none';
        document.getElementById('anexoSimples').required = false;
        document.getElementById('anexoSimples').value = '';
        document.getElementById('atividadesAnexo').value = '';
    }
	// Se estava editando e mudou a tributação, remover ID
    if (document.getElementById('situacaoId')) {
        document.getElementById('situacaoId').remove();
        
        // Restaurar texto do botão
        const submitBtn = document.querySelector('#situacaoForm .btn-primary');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Situação';
    }
});

// Função auxiliar para obter descrição do anexo
function getDescricaoAnexo(anexo) {
    const descricoes = {
        'I': 'Comércio',
        'II': 'Indústria',
        'III': 'Locação de bens móveis e serviços não relacionados',
        'IV': 'Prestação de serviços relacionados (§ 5o-C do art. 18)',
        'V': 'Prestação de serviços relacionados (§ 5o-I do art. 18)'
    };
    return descricoes[anexo] || 'Anexo não especificado';
}

// ========== FUNÇÕES DE FORMATAÇÃO ==========
function formatarCNPJ(cnpj) {
    if (!cnpj || cnpj.length !== 14) return cnpj || '';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatarData(data) {
    if (!data) return '';
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function formatarDataHora(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleString('pt-BR');
}

function formatarMesAno(mesAno) {
    if (!mesAno) return '';
    const [ano, mes] = mesAno.split('-');
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
}

function formatarMoeda(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return 'R$ 0,00';
    return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}