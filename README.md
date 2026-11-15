# Plano de leitura bíblica

Planos de 30, 90, 180 e 365 dias distribuídos pelos 1.189 capítulos; calendário, progresso, histórico e notas locais.

Você também pode usar **Baixar backup** para salvar seus planos, marcações e anotações em JSON e **Restaurar backup** para recuperá-los em outro navegador ou dispositivo. O aplicativo valida backups JSON de até 32 MB. A restauração pede confirmação e publica os dados depois que o armazenamento local aceita a gravação. Guarde o arquivo em lugar seguro: ele pode conter anotações pessoais, e não existe sincronização automática na nuvem.

## Como executar

Requisitos: Node.js 24 e npm.

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
O armazenamento é local: limpar os dados do navegador pode apagar o progresso. Exporte um backup antes de trocar de dispositivo ou limpar o navegador.

## Arquitetura e fontes

A interface usa React e TypeScript, com Vite para desenvolvimento e build. A lógica do domínio e a validação dos backups ficam em módulos de `src/`, separados da interface, e os testes em `tests/`. Os planos e anotações são salvos no armazenamento local do navegador.

As fontes e licenças estão em [docs/FONTES.md](docs/FONTES.md). A licença do código está em [LICENSE](LICENSE). O fluxo em `.github/workflows/ci.yml` executa testes e build em pushes e pull requests.
