const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'inquerito.db'));
db.pragma('foreign_keys = ON');
const schemaSql = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8');
db.exec(schemaSql);

function semearBanco() {
    const count = db.prepare('SELECT COUNT(*) AS total FROM Investigador').get().total;
    if (count === 0) {
        const hash = bcrypt.hashSync('123456', 12);
        const insertInv = db.prepare(
            'INSERT INTO Investigador (Nome, Email, Matricula, Unidade, SenhaHash) VALUES (?, ?, ?, ?, ?)'
        );
        const insertMural = db.prepare('INSERT INTO Mural (CodInvestigador) VALUES (?)');

        const tx = db.transaction(() => {
            const seed = [
                ['Karim Soares Lentz', 'karim@pcmg.gov.br', 'MAT-1001', '1ª DP — Campus'],
                ['Júlio César Requena Fraga', 'julio@pcmg.gov.br', 'MAT-1002', '2ª DP — Campus'],
                ['Rafaella Tavares Moreira', 'rafaella@pcmg.gov.br', 'MAT-1003', '3ª DP — Campus']
            ];
            for (const [nome, email, mat, unidade] of seed) {
                const res = insertInv.run(nome, email, mat, unidade, hash);
                insertMural.run(res.lastInsertRowid);
            }
        });
        tx();
    }
}
semearBanco();

app.use(express.json());
app.use(session({
    secret: 'inquerito-digital-segredo-2026',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 30 * 60 * 1000,
        httpOnly: true
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

function limparDigitos(v) {
    return String(v || '').replace(/\D/g, '');
}

function validarCPF(cpfRaw) {
    const cpf = limparDigitos(cpfRaw);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
    let d1 = (soma * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(cpf[9], 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
    let d2 = (soma * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === parseInt(cpf[10], 10);
}

function exigirSessao(req, res, next) {
    if (!req.session || !req.session.investigador) {
        return res.status(401).json({ codigo: 'IE_SessaoExpirada', mensagem: 'Sessão não autentica ou expirada.' });
    }
    next();
}

// 1. AUTENTICAÇÃO (RF001, RF002)
app.post('/api/auth/login', (req, res) => {
    const { credencial, senha } = req.body;
    if (!credencial || !senha) {
        return res.status(400).json({ codigo: 'IE_LoginCamposObrigatorios', mensagem: 'Informe e-mail e senha' });
    }

    const inv = db.prepare(
        'SELECT * FROM Investigador WHERE LOWER(Email) = LOWER(?) OR LOWER(Matricula) = LOWER(?)'
    ).get(credencial.trim(), credencial.trim());

    if (!inv || !bcrypt.compareSync(senha, inv.SenhaHash)) {
        return res.status(401).json({ codigo: 'IE_LoginSenhaInvalida', mensagem: 'Credenciais inválidas' });
    }

    const usuario = { id: inv.Id, nome: inv.Nome, email: inv.Email, matricula: inv.Matricula, unidade: inv.Unidade };
    req.session.investigador = usuario;
    res.json({ codigo: 'IS_Login', mensagem: 'Login realizado com sucesso', usuario });
});

app.post('/api/auth/register', (req, res) => {
    const { nome, unidade, email, matricula, senha } = req.body;
    if (!nome?.trim() || !unidade?.trim() || !email?.trim() || !senha || senha.length < 6 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            codigo: 'IE_CadastroInvestigadorCampoInvalido',
            mensagem: 'Nome, e-mail, unidade e senha (mínimo 6 caracteres) são obrigatórios'
        });
    }

    const dupEmail = db.prepare('SELECT Id FROM Investigador WHERE LOWER(Email) = LOWER(?)').get(email.trim());
    if (dupEmail) {
        return res.status(409).json({
            codigo: 'IE_InvestigadorDuplicado',
            mensagem: 'Já existe investigador cadastrado com este e-mail'
        });
    }

    if (matricula?.trim()) {
        const dupMat = db.prepare('SELECT Id FROM Investigador WHERE LOWER(Matricula) = LOWER(?)').get(matricula.trim());
        if (dupMat) {
            return res.status(409).json({
                codigo: 'IE_InvestigadorDuplicado',
                mensagem: 'Já existe investigador cadastrado com esta matrícula'
            });
        }
    }

    const hash = bcrypt.hashSync(senha, 12);
    const tx = db.transaction(() => {
        const info = db.prepare(
            'INSERT INTO Investigador (Nome, Email, Matricula, Unidade, SenhaHash) VALUES (?, ?, ?, ?, ?)'
        ).run(nome.trim(), email.trim(), matricula?.trim() || null, unidade.trim(), hash);
        db.prepare('INSERT INTO Mural (CodInvestigador) VALUES (?)').run(info.lastInsertRowid);
        return info.lastInsertRowid;
    });

    const id = tx();
    res.status(201).json({
        codigo: 'IS_CadastroInvestigador',
        mensagem: 'Investigador cadastrado com sucesso. Faça seu login.',
        id
    });
});

app.get('/api/auth/me', exigirSessao, (req, res) => {
    const investigadores = db.prepare('SELECT Id, Nome, Email, Matricula, Unidade FROM Investigador ORDER BY Nome').all();
    res.json({ usuario: req.session.investigador, investigadores });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => res.json({ codigo: 'IS_Logout', mensagem: 'Sessão encerrada.' }));
});

// 2. SUSPEITOS (RF003 – RF007)
app.get('/api/suspeitos', exigirSessao, (req, res) => {
    const { busca, status } = req.query;
    let sql = `
        SELECT s.*,
               (SELECT COUNT(*) FROM Investigacao i WHERE i.CodSuspeito = s.Id) AS TotalVinculos
        FROM Suspeito s
        WHERE 1=1
    `;
    const params = [];
    if (status && ['ATIVO', 'INATIVO'].includes(status)) {
        sql += ' AND s.Status = ?';
        params.push(status);
    }
    if (busca?.trim()) {
        sql += ' AND (s.Nome LIKE ? OR s.Cpf LIKE ? OR s.Apelido LIKE ?)';
        const termo = `%${busca.trim()}%`;
        params.push(termo, `%${limparDigitos(busca)}%`, termo);
    }
    sql += ' ORDER BY s.Id DESC LIMIT 20';
    res.json(db.prepare(sql).all(...params));
});

app.post('/api/suspeitos', exigirSessao, (req, res) => {
    const { nome, cpf, apelido, telefone, descricao } = req.body;
    const cpfLimpo = limparDigitos(cpf);

    if (!nome?.trim() || !validarCPF(cpfLimpo)) {
        return res.status(400).json({
            codigo: 'IE_CadastroSuspeitoCampoInvalido',
            mensagem: 'Nome completo e CPF válido (11 dígitos) são obrigatórios.'
        });
    }

    const dup = db.prepare('SELECT Id FROM Suspeito WHERE Cpf = ?').get(cpfLimpo);
    if (dup) {
        return res.status(409).json({
            codigo: 'IE_CadastroSuspeitoDuplicado',
            mensagem: 'Já existe suspeito cadastrado com este CPF.'
        });
    }

    const info = db.prepare(`
        INSERT INTO Suspeito (Nome, Cpf, Apelido, Telefone, Descricao, Status)
        VALUES (?, ?, ?, ?, ?, 'ATIVO')
    `).run(nome.trim(), cpfLimpo, apelido?.trim() || null, telefone?.trim() || null, descricao?.trim() || null);

    const criado = db.prepare('SELECT * FROM Suspeito WHERE Id = ?').get(info.lastInsertRowid);
    res.status(201).json({ codigo: 'IS_CadastroSuspeito', mensagem: 'Suspeito cadastrado com sucesso.', dado: criado });
});

app.put('/api/suspeitos/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const { nome, cpf, apelido, telefone, descricao } = req.body;
    const cpfLimpo = limparDigitos(cpf);

    if (!nome?.trim() || !validarCPF(cpfLimpo)) {
        return res.status(400).json({
            codigo: 'IE_CadastroSuspeitoCampoInvalido',
            mensagem: 'Nome completo e CPF válido (11 dígitos) são obrigatórios.'
        });
    }

    const dup = db.prepare('SELECT Id FROM Suspeito WHERE Cpf = ? AND Id != ?').get(cpfLimpo, id);
    if (dup) {
        return res.status(409).json({
            codigo: 'IE_AlteracaoSuspeitoDuplicado',
            mensagem: 'Já existe suspeito cadastrado com este CPF.'
        });
    }

    db.prepare(`
        UPDATE Suspeito SET Nome = ?, Cpf = ?, Apelido = ?, Telefone = ?, Descricao = ?
        WHERE Id = ?
    `).run(nome.trim(), cpfLimpo, apelido?.trim() || null, telefone?.trim() || null, descricao?.trim() || null, id);

    const atualizado = db.prepare('SELECT * FROM Suspeito WHERE Id = ?').get(id);
    res.json({ codigo: 'IS_AlteracaoSuspeito', mensagem: 'Suspeito atualizado com sucesso.', dado: atualizado });
});

app.patch('/api/suspeitos/:id/inativar', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const vinculos = db.prepare('SELECT COUNT(*) AS c FROM Investigacao WHERE CodSuspeito = ?').get(id).c;
    if (vinculos === 0) {
        return res.status(400).json({
            codigo: 'IE_SuspeitoSemVinculo',
            mensagem: 'A inativação só é permitida quando há vínculo com investigação. Use Excluir.'
        });
    }
    db.prepare("UPDATE Suspeito SET Status = 'INATIVO' WHERE Id = ?").run(id);
    res.json({ codigo: 'IS_InativacaoSuspeito', mensagem: 'Suspeito inativado com sucesso.' });
});

app.delete('/api/suspeitos/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const vinculos = db.prepare('SELECT COUNT(*) AS c FROM Investigacao WHERE CodSuspeito = ?').get(id).c;
    if (vinculos > 0) {
        return res.status(400).json({
            codigo: 'IE_SuspeitoVinculado',
            mensagem: 'Cadastro associado a investigação não pode ser excluído. Utilize Inativar.'
        });
    }
    db.prepare('DELETE FROM Suspeito WHERE Id = ?').run(id);
    res.json({ codigo: 'IS_ExclusaoSuspeito', mensagem: 'Suspeito excluído permanentemente.' });
});

// 3. EVIDÊNCIAS (RF008 – RF012)
const TIPOS_EVIDENCIA = ['Armas', 'Biológico', 'Documentos', 'Veículos', 'Drogas', 'Diversos'];

app.get('/api/evidencias', exigirSessao, (req, res) => {
    const { busca, status } = req.query;
    let sql = `
        SELECT e.*,
               (SELECT COUNT(*) FROM InvestigacaoEvidencia ie WHERE ie.CodEvidencia = e.Id) AS TotalVinculos
        FROM Evidencia e
        WHERE 1=1
    `;
    const params = [];
    if (status && ['ATIVO', 'INATIVO'].includes(status)) {
        sql += ' AND e.Status = ?';
        params.push(status);
    }
    if (busca?.trim()) {
        sql += ' AND (e.Protocolo LIKE ? OR e.Tipo LIKE ? OR e.Descricao LIKE ?)';
        const termo = `%${busca.trim()}%`;
        params.push(termo, termo, termo);
    }
    sql += ' ORDER BY e.Id DESC LIMIT 20';
    res.json(db.prepare(sql).all(...params));
});

app.post('/api/evidencias', exigirSessao, (req, res) => {
    const { protocolo, tipo, descricao, localColeta, dataColeta } = req.body;
    if (!protocolo?.trim() || !TIPOS_EVIDENCIA.includes(tipo) || !descricao?.trim() || !localColeta?.trim() || !dataColeta?.trim()) {
        return res.status(400).json({
            codigo: 'IE_CadastroEvidenciaCampoInvalido',
            mensagem: 'Protocolo, tipo válido, descrição, local e data de coleta são obrigatórios.'
        });
    }

    const dup = db.prepare('SELECT Id FROM Evidencia WHERE UPPER(Protocolo) = UPPER(?)').get(protocolo.trim());
    if (dup) {
        return res.status(409).json({
            codigo: 'IE_CadastroEvidenciaDuplicada',
            mensagem: 'Já existe evidência com este protocolo.'
        });
    }

    const info = db.prepare(`
        INSERT INTO Evidencia (Protocolo, Tipo, Descricao, LocalColeta, DataColeta, Status)
        VALUES (?, ?, ?, ?, ?, 'ATIVO')
    `).run(protocolo.trim().toUpperCase(), tipo, descricao.trim(), localColeta.trim(), dataColeta.trim());

    const criada = db.prepare('SELECT * FROM Evidencia WHERE Id = ?').get(info.lastInsertRowid);
    res.status(201).json({ codigo: 'IS_CadastroEvidencia', mensagem: 'Evidência cadastrada com sucesso.', dado: criada });
});

app.put('/api/evidencias/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const { protocolo, tipo, descricao, localColeta, dataColeta } = req.body;
    if (!protocolo?.trim() || !TIPOS_EVIDENCIA.includes(tipo) || !descricao?.trim() || !localColeta?.trim() || !dataColeta?.trim()) {
        return res.status(400).json({
            codigo: 'IE_CadastroEvidenciaCampoInvalido',
            mensagem: 'Todos os campos obrigatórios devem ser preenchidos.'
        });
    }

    const dup = db.prepare('SELECT Id FROM Evidencia WHERE UPPER(Protocolo) = UPPER(?) AND Id != ?').get(protocolo.trim(), id);
    if (dup) {
        return res.status(409).json({
            codigo: 'IE_CadastroEvidenciaDuplicada',
            mensagem: 'Já existe evidência com este protocolo.'
        });
    }

    db.prepare(`
        UPDATE Evidencia SET Protocolo = ?, Tipo = ?, Descricao = ?, LocalColeta = ?, DataColeta = ?
        WHERE Id = ?
    `).run(protocolo.trim().toUpperCase(), tipo, descricao.trim(), localColeta.trim(), dataColeta.trim(), id);

    const atualizada = db.prepare('SELECT * FROM Evidencia WHERE Id = ?').get(id);
    res.json({ codigo: 'IS_AlteracaoEvidencia', mensagem: 'Evidência atualizada com sucesso.', dado: atualizada });
});

app.patch('/api/evidencias/:id/inativar', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const vinculos = db.prepare('SELECT COUNT(*) AS c FROM InvestigacaoEvidencia WHERE CodEvidencia = ?').get(id).c;
    if (vinculos === 0) {
        return res.status(400).json({
            codigo: 'IE_EvidenciaSemVinculo',
            mensagem: 'A inativação só é permitida quando há vínculo com investigação.'
        });
    }
    db.prepare("UPDATE Evidencia SET Status = 'INATIVO' WHERE Id = ?").run(id);
    res.json({ codigo: 'IS_InativacaoEvidencia', mensagem: 'Evidência inativada com sucesso.' });
});

app.delete('/api/evidencias/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const vinculos = db.prepare('SELECT COUNT(*) AS c FROM InvestigacaoEvidencia WHERE CodEvidencia = ?').get(id).c;
    if (vinculos > 0) {
        return res.status(400).json({
            codigo: 'IE_EvidenciaVinculada',
            mensagem: 'Evidência vinculada a investigação não pode ser excluída fisicamente.'
        });
    }
    db.prepare('DELETE FROM Evidencia WHERE Id = ?').run(id);
    res.json({ codigo: 'IS_ExclusaoEvidencia', mensagem: 'Evidência excluída permanentemente.' });
});

// 4. INVESTIGAÇÕES & HISTÓRICO (RF013 – RF019)
function montarDossie(id) {
    const inv = db.prepare(`
        SELECT i.*,
               r.Nome AS ResponsavelNome, r.Unidade AS ResponsavelUnidade,
               s.Nome AS SuspeitoNome, s.Cpf AS SuspeitoCpf, s.Apelido AS SuspeitoApelido, s.Status AS SuspeitoStatus
        FROM Investigacao i
        JOIN Investigador r ON r.Id = i.CodInvestigador
        LEFT JOIN Suspeito s ON s.Id = i.CodSuspeito
        WHERE i.Id = ?
    `).get(id);
    if (!inv) return null;

    inv.evidencias = db.prepare(`
        SELECT e.*
        FROM Evidencia e
        JOIN InvestigacaoEvidencia ie ON ie.CodEvidencia = e.Id
        WHERE ie.CodInvestigacao = ?
    `).all(id);

    inv.historico = db.prepare(`
        SELECT h.*, r.Nome AS InvestigadorNome, r.Unidade
        FROM HistoricoResponsavel h
        JOIN Investigador r ON r.Id = h.CodInvestigador
        WHERE h.CodInvestigacao = ?
        ORDER BY h.Id ASC
    `).all(id);

    return inv;
}

app.get('/api/investigacoes', exigirSessao, (req, res) => {
    const rows = db.prepare('SELECT Id FROM Investigacao ORDER BY Id ASC').all();
    res.json(rows.map(r => montarDossie(r.Id)));
});

app.get('/api/investigacoes/:id', exigirSessao, (req, res) => {
    const dossie = montarDossie(Number(req.params.id));
    if (!dossie) return res.status(404).json({ codigo: 'IE_InvestigacaoNaoEncontrada', mensagem: 'Investigação não encontrada.' });
    res.json(dossie);
});

app.post('/api/investigacoes', exigirSessao, (req, res) => {
    const { numeroInquerito, titulo, codInvestigador, codSuspeito, evidenciasIds = [], caixa = 1 } = req.body;
    const respId = Number(codInvestigador || req.session.investigador.id);

    if (!numeroInquerito?.trim() || !titulo?.trim() || !respId) {
        return res.status(400).json({
            codigo: 'IE_CamposObrigatorios',
            mensagem: 'Número do inquérito, título e investigador responsável são obrigatórios.'
        });
    }

    const dup = db.prepare('SELECT Id FROM Investigacao WHERE UPPER(NumeroInquerito) = UPPER(?)').get(numeroInquerito.trim());
    if (dup) {
        return res.status(409).json({
            codigo: 'IE_InvestigacaoDuplicada',
            mensagem: 'Já existe investigação com este número de inquérito.'
        });
    }

    if (codSuspeito) {
        const susp = db.prepare('SELECT Status FROM Suspeito WHERE Id = ?').get(Number(codSuspeito));
        if (!susp || susp.Status !== 'ATIVO') {
            return res.status(400).json({ codigo: 'IE_SuspeitoInativo', mensagem: 'Apenas suspeitos ATIVOS podem ser vinculados.' });
        }
    }

    for (const evId of evidenciasIds) {
        const ev = db.prepare('SELECT Protocolo, Status FROM Evidencia WHERE Id = ?').get(Number(evId));
        if (!ev || ev.Status !== 'ATIVO') {
            return res.status(400).json({ codigo: 'IE_EvidenciaInativa', mensagem: 'Apenas evidências ATIVAS podem ser vinculadas.' });
        }
        const conflito = db.prepare(`
            SELECT i.NumeroInquerito FROM InvestigacaoEvidencia ie
            JOIN Investigacao i ON i.Id = ie.CodInvestigacao
            WHERE ie.CodEvidencia = ? AND i.Status = 'ABERTA'
        `).get(Number(evId));
        if (conflito) {
            return res.status(409).json({
                codigo: 'IE_EvidenciaVinculada',
                mensagem: `Evidência ${ev.Protocolo} já está vinculada ao caso aberto ${conflito.NumeroInquerito}.`
            });
        }
    }

    const tx = db.transaction(() => {
        const resInv = db.prepare(`
            INSERT INTO Investigacao (NumeroInquerito, Titulo, Status, CodInvestigador, CodSuspeito, Caixa)
            VALUES (?, ?, 'ABERTA', ?, ?, ?)
        `).run(numeroInquerito.trim().toUpperCase(), titulo.trim(), respId, codSuspeito ? Number(codSuspeito) : null, Number(caixa) === 2 ? 2 : 1);

        const invId = resInv.lastInsertRowid;
        const insEv = db.prepare('INSERT INTO InvestigacaoEvidencia (CodInvestigacao, CodEvidencia) VALUES (?, ?)');
        for (const evId of evidenciasIds) insEv.run(invId, Number(evId));

        db.prepare('INSERT INTO HistoricoResponsavel (CodInvestigacao, CodInvestigador) VALUES (?, ?)').run(invId, respId);
        return invId;
    });

    const novoId = tx();
    res.status(201).json({
        codigo: 'IS_RegistroInvestigacao',
        mensagem: 'Investigação registrada com sucesso.',
        dado: montarDossie(novoId)
    });
});

app.put('/api/investigacoes/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const atual = db.prepare('SELECT * FROM Investigacao WHERE Id = ?').get(id);
    if (!atual) return res.status(404).json({ codigo: 'IE_InvestigacaoNaoEncontrada', mensagem: 'Investigação não encontrada.' });
    if (atual.Status !== 'ABERTA') {
        return res.status(400).json({ codigo: 'IE_InvestigacaoEncerrada', mensagem: 'Investigações concluídas ou canceladas não podem ser alteradas.' });
    }

    const { titulo, codInvestigador, codSuspeito, evidenciasIds = [], caixa = 1 } = req.body;
    const novoRespId = Number(codInvestigador || atual.CodInvestigador);

    if (!titulo?.trim() || !novoRespId) {
        return res.status(400).json({ codigo: 'IE_CamposObrigatorios', mensagem: 'Título e responsável são obrigatórios.' });
    }

    for (const evId of evidenciasIds) {
        const conflito = db.prepare(`
            SELECT i.NumeroInquerito, e.Protocolo FROM InvestigacaoEvidencia ie
            JOIN Investigacao i ON i.Id = ie.CodInvestigacao
            JOIN Evidencia e ON e.Id = ie.CodEvidencia
            WHERE ie.CodEvidencia = ? AND i.Status = 'ABERTA' AND i.Id != ?
        `).get(Number(evId), id);
        if (conflito) {
            return res.status(409).json({
                codigo: 'IE_EvidenciaVinculada',
                mensagem: `Evidência ${conflito.Protocolo} já está vinculada ao caso aberto ${conflito.NumeroInquerito}.`
            });
        }
    }

    const tx = db.transaction(() => {
        db.prepare(`
            UPDATE Investigacao SET Titulo = ?, CodInvestigador = ?, CodSuspeito = ?, Caixa = ?
            WHERE Id = ?
        `).run(titulo.trim(), novoRespId, codSuspeito ? Number(codSuspeito) : null, Number(caixa) === 2 ? 2 : 1, id);

        if (novoRespId !== atual.CodInvestigador) {
            db.prepare('UPDATE HistoricoResponsavel SET DataFim = CURRENT_TIMESTAMP WHERE CodInvestigacao = ? AND DataFim IS NULL').run(id);
            db.prepare('INSERT INTO HistoricoResponsavel (CodInvestigacao, CodInvestigador) VALUES (?, ?)').run(id, novoRespId);
        }

        db.prepare('DELETE FROM InvestigacaoEvidencia WHERE CodInvestigacao = ?').run(id);
        const insEv = db.prepare('INSERT INTO InvestigacaoEvidencia (CodInvestigacao, CodEvidencia) VALUES (?, ?)');
        for (const evId of evidenciasIds) insEv.run(id, Number(evId));
    });

    tx();
    res.json({ codigo: 'IS_AtualizacaoInvestigacao', mensagem: 'Caso atualizado com sucesso.', dado: montarDossie(id) });
});

app.patch('/api/investigacoes/:id/cancelar', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const { justificativa } = req.body;
    if (!justificativa?.trim()) {
        return res.status(400).json({ codigo: 'IE_CancelamentoInvestigacaoJustificativa', mensagem: 'Justificativa é obrigatória para cancelar.' });
    }
    db.prepare(`
        UPDATE Investigacao SET Status = 'CANCELADA', Justificativa = ?, DataFechamento = CURRENT_TIMESTAMP
        WHERE Id = ? AND Status = 'ABERTA'
    `).run(justificativa.trim(), id);
    res.json({ codigo: 'IS_CancelamentoInvestigacao', mensagem: 'Investigação cancelada com sucesso.', dado: montarDossie(id) });
});

app.patch('/api/investigacoes/:id/concluir', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const { justificativa } = req.body;
    if (!justificativa?.trim()) {
        return res.status(400).json({ codigo: 'IE_ConclusaoInvestigacaoJustificativa', mensagem: 'Justificativa é obrigatória para concluir.' });
    }
    db.prepare(`
        UPDATE Investigacao SET Status = 'CONCLUIDA', Justificativa = ?, DataFechamento = CURRENT_TIMESTAMP
        WHERE Id = ? AND Status = 'ABERTA'
    `).run(justificativa.trim(), id);
    res.json({ codigo: 'IS_ConclusaoInvestigacao', mensagem: 'Investigação concluída com sucesso.', dado: montarDossie(id) });
});

app.delete('/api/investigacoes/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const existe = db.prepare('SELECT Id FROM Investigacao WHERE Id = ?').get(id);
    if (!existe) return res.status(404).json({ codigo: 'IE_InvestigacaoNaoEncontrada', mensagem: 'Investigação não encontrada.' });

    const tx = db.transaction(() => {
        db.prepare('DELETE FROM InvestigacaoEvidencia WHERE CodInvestigacao = ?').run(id);
        db.prepare('DELETE FROM HistoricoResponsavel WHERE CodInvestigacao = ?').run(id);
        db.prepare('DELETE FROM Investigacao WHERE Id = ?').run(id);
    });
    tx();
    res.json({ codigo: 'IS_ExclusaoInvestigacao', mensagem: 'Investigação excluída com sucesso.' });
});

// 5. MURAL INDIVIDUAL (RF020)
function obterMuralDoUsuario(invId) {
    let mural = db.prepare('SELECT * FROM Mural WHERE CodInvestigador = ?').get(invId);
    if (!mural) {
        const res = db.prepare('INSERT INTO Mural (CodInvestigador) VALUES (?)').run(invId);
        mural = { CodMural: res.lastInsertRowid, CodInvestigador: invId };
    }
    return mural;
}

app.get('/api/mural', exigirSessao, (req, res) => {
    const mural = obterMuralDoUsuario(req.session.investigador.id);
    const itens = db.prepare('SELECT * FROM ItemMural WHERE CodMural = ? ORDER BY OrdemCamada ASC').all(mural.CodMural);
    const conexoes = db.prepare(`
        SELECT c.* FROM ConexaoMural c
        JOIN ItemMural i ON i.CodItemMural = c.CodItemOrigem
        WHERE i.CodMural = ?
    `).all(mural.CodMural);
    const desenhos = db.prepare('SELECT * FROM DesenhoMural WHERE CodMural = ?').all(mural.CodMural);
    res.json({ mural, itens, conexoes, desenhos });
});

app.post('/api/mural/itens', exigirSessao, (req, res) => {
    const mural = obterMuralDoUsuario(req.session.investigador.id);
    const { tipoItem = 'POST_IT', conteudo = '', codSuspeito = null, codEvidencia = null, posicaoX = 300, posicaoY = 200, rotacao = 0 } = req.body;
    const info = db.prepare(`
        INSERT INTO ItemMural (CodMural, TipoItem, Conteudo, CodSuspeito, CodEvidencia, PosicaoX, PosicaoY, Rotacao, OrdemCamada)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 25)
    `).run(mural.CodMural, tipoItem, conteudo, codSuspeito, codEvidencia, posicaoX, posicaoY, rotacao);

    const item = db.prepare('SELECT * FROM ItemMural WHERE CodItemMural = ?').get(info.lastInsertRowid);
    res.status(201).json(item);
});

app.put('/api/mural/itens/:id', exigirSessao, (req, res) => {
    const id = Number(req.params.id);
    const { conteudo, posicaoX, posicaoY, largura, altura, ordemCamada } = req.body;
    db.prepare(`
        UPDATE ItemMural
        SET Conteudo = COALESCE(?, Conteudo),
            PosicaoX = COALESCE(?, PosicaoX),
            PosicaoY = COALESCE(?, PosicaoY),
            Largura = COALESCE(?, Largura),
            Altura = COALESCE(?, Altura),
            OrdemCamada = COALESCE(?, OrdemCamada)
        WHERE CodItemMural = ?
    `).run(conteudo ?? null, posicaoX ?? null, posicaoY ?? null, largura ?? null, altura ?? null, ordemCamada ?? null, id);
    res.json({ ok: true });
});

app.delete('/api/mural/itens/:id', exigirSessao, (req, res) => {
    db.prepare('DELETE FROM ItemMural WHERE CodItemMural = ?').run(Number(req.params.id));
    res.json({ ok: true });
});

app.post('/api/mural/conexoes', exigirSessao, (req, res) => {
    const { codItemOrigem, codItemDestino } = req.body;
    const info = db.prepare('INSERT INTO ConexaoMural (CodItemOrigem, CodItemDestino) VALUES (?, ?)').run(codItemOrigem, codItemDestino);
    res.status(201).json({ CodConexao: info.lastInsertRowid, CodItemOrigem: codItemOrigem, CodItemDestino: codItemDestino });
});

app.post('/api/mural/desenhos', exigirSessao, (req, res) => {
    const mural = obterMuralDoUsuario(req.session.investigador.id);
    const { coordenadas, cor = '#ef4444', espessura = 4 } = req.body;
    const info = db.prepare('INSERT INTO DesenhoMural (CodMural, Coordenadas, Cor, Espessura) VALUES (?, ?, ?, ?)').run(
        mural.CodMural, JSON.stringify(coordenadas), cor, espessura
    );
    res.status(201).json({ CodDesenho: info.lastInsertRowid });
});

app.delete('/api/mural/limpar', exigirSessao, (req, res) => {
    const mural = obterMuralDoUsuario(req.session.investigador.id);
    db.transaction(() => {
        db.prepare('DELETE FROM DesenhoMural WHERE CodMural = ?').run(mural.CodMural);
        db.prepare(`
            DELETE FROM ConexaoMural WHERE CodItemOrigem IN (
                SELECT CodItemMural FROM ItemMural WHERE CodMural = ?
            )
        `).run(mural.CodMural);
    })();
    res.json({ ok: true });
});

// 6. ROTA DE AUDITORIA DO BANCO (EVIDÊNCIA / PRINT)
app.get('/api/auditoria', exigirSessao, (req, res) => {
    res.json({
        timestamp: new Date().toLocaleString('pt-BR'),
        sessaoAtiva: req.session.investigador,
        bancoDados: 'data/inquerito.db (SQLite)',
        tabelas: {
            Investigador: db.prepare('SELECT Id, Nome, Email, Matricula, Unidade FROM Investigador').all(),
            Suspeito: db.prepare('SELECT * FROM Suspeito').all(),
            Evidencia: db.prepare('SELECT * FROM Evidencia').all(),
            Investigacao: db.prepare('SELECT * FROM Investigacao').all(),
            InvestigacaoEvidencia: db.prepare('SELECT * FROM InvestigacaoEvidencia').all(),
            HistoricoResponsavel: db.prepare('SELECT * FROM HistoricoResponsavel').all(),
            ItemMural: db.prepare('SELECT CodItemMural, CodMural, TipoItem, Conteudo, CodSuspeito, CodEvidencia, PosicaoX, PosicaoY FROM ItemMural').all()
        }
    });
});

app.listen(PORT, () => {
    console.log(`Inquérito Digital rodando em http://localhost:${PORT}`);
});
