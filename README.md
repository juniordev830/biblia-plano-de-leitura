# Plano de leitura bíblica

Planos de 30, 90, 180 e 365 dias distribuídos pelos 1.189 capítulos; calendário, progresso, histórico e notas locais.

## Como executar

Requisitos: Node.js 24 e npm. Para a concordância, Python 3.12 também é necessário.

```bash
npm ci
npm run dev
```

Abra o endereço local informado pelo Vite. Para conferir o projeto:

```bash
npm test
npm run build
```

## Exemplo de uso

Selecione um prazo e uma data. Marque os dias concluídos e anote observações por capítulo.

## Limitações

Marca a leitura por dia completo, sem acompanhamento individual de cada capítulo. Cada plano possui histórico próprio no navegador.

## Arquitetura e fontes

A interface usa React e TypeScript, com Vite para desenvolvimento e build. A lógica do domínio fica em módulos de `src/`, separados da interface, e os testes em `tests/`. Os dados pessoais dos recursos que exigem persistência usam armazenamento local do navegador. A concordância possui API FastAPI e índice local em `backend/`.

As fontes e licenças estão em [docs/FONTES.md](docs/FONTES.md). A licença do código está em [LICENSE](LICENSE). O fluxo em `.github/workflows/ci.yml` executa testes e build em pushes e pull requests.
