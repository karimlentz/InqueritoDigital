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