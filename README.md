# Observer Chamados - Backend com Redis

## Visão Geral

Este projeto é o serviço de backend para a aplicação **Observer Chamados**, projetado para estudantes de desenvolvimento web. Ele fornece uma API REST para gerenciar "chamados" (tickets) e utiliza Server-Sent Events (SSE) para notificar os clientes sobre atualizações em tempo real, com suporte a múltiplas instâncias através de Redis.

A arquitetura consiste em uma aplicação Node.js que utiliza o framework Express para expor os endpoints da API. O serviço se conecta a um banco de dados PostgreSQL para persistência de dados e a um servidor Redis para coordenação de eventos entre múltiplas instâncias. A funcionalidade de tempo real é implementada através de um sistema pub/sub do Redis que distribui eventos para todas as instâncias conectadas, que por sua vez retransmitem as atualizações para os clientes via SSE.

### Principais Funcionalidades

*   API REST completa para operações de Criar, Ler, Atualizar e Deletar (CRUD) chamados.
*   Busca de chamados com suporte a paginação e filtro por estado.
*   Endpoint de Server-Sent Events (SSE) para atualizações em tempo real sobre o ciclo de vida dos chamados.
*   Suporte a múltiplas instâncias do backend através de Redis Pub/Sub.
*   Sistema de heartbeat para manter conexões SSE ativas.

## Requisitos

*   **Sistema Operacional**: (indeterminado)
*   **Pré-requisitos**: (indeterminado)

**Fonte**: `package.json`

## Configuração e Instalação

1.  Clone o repositório para sua máquina local:
    ```sh
    git clone <URL_DO_REPOSITORIO>
    ```

2.  Navegue até o diretório do projeto:
    ```sh
    cd node-backend-observer-redis-chamados-2025
    ```

3.  Instale as dependências do projeto. O gerenciador de pacotes utilizado é (indeterminado).
    ```sh
    npm install
    ```

4.  **Variáveis de Ambiente**: Crie um arquivo `.env` na raiz do projeto. As seguintes variáveis são necessárias para a conexão com o banco de dados PostgreSQL, servidor Redis e configuração do servidor.

| Variável | Exemplo | Obrigatória? | Descrição |
| --- | --- | --- | --- |
| `PORT` | `5000` | Não | Porta em que o servidor Express será executado. O padrão é `5000`. |
| `DB_HOST` | `localhost` | Sim | Endereço do servidor de banco de dados PostgreSQL. |
| `DB_PORT` | `5432` | Sim | Porta do servidor de banco de dados PostgreSQL. |
| `DB_USER` | `postgres` | Sim | Nome de usuário para a conexão com o banco de dados. |
| `DB_PASSWORD` | `secret` | Sim | Senha para a conexão com o banco de dados. |
| `DB_DATABASE` | `observer_db` | Sim | Nome do banco de dados a ser utilizado. |
| `REDIS_HOST` | `localhost` | Sim | Endereço do servidor Redis. |
| `REDIS_PORT` | `6379` | Sim | Porta do servidor Redis. |
| `REDIS_PASSWORD` | `redis_secret` | Não | Senha para a conexão com o Redis (opcional). |

5.  **Inicialização de Dados**: O projeto inclui um script para resetar e popular o banco de dados com dados de exemplo.
    ```sh
    npm run reset-database
    ```

**Fontes**: `package.json`, `src/server/server.js`, `src/database/database.js`, `src/services/sseService.js`, `src/services/redisService.js`

## Executar em Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento com recarga automática (`hot-reloading`), execute o seguinte comando:

```sh
npm run dev
```

O servidor estará disponível na URL e porta padrão `http://localhost:5000` (ou na porta definida em `PORT`). O `nodemon` monitora as alterações nos arquivos e reinicia o servidor automaticamente.

**Fonte**: `package.json`, `src/server/server.js`

## Execução com Containers

(não aplicável)

## Scripts Disponíveis

*   `test`: Exibe uma mensagem de erro, pois não há testes configurados.
*   `dev`: Inicia o servidor em modo de desenvolvimento usando `nodemon`.
*   `reset-database`: Executa o script para resetar e popular o banco de dados.
*   `start`: Inicia o servidor em modo de produção.

**Fonte**: `package.json`

## Qualidade, Testes e Padrões

*   **Testes**: (indeterminado)
*   **Qualidade e Estilo de Código**: (indeterminado)
*   **Convenções de Commit**: (indeterminado)

**Fonte**: `package.json`

## Build e Deploy (Produção)

As mesmas variáveis de ambiente da seção de configuração são necessárias em produção, incluindo as configurações do Redis.

Para construir e iniciar o projeto em um ambiente de produção, utilize os seguintes comandos:

*   **Build**: Não há um passo de build explícito.
*   **Start**: `npm start`

**Fonte**: `package.json`

## Documentação de API

Não há uma documentação de API gerada automaticamente. Os endpoints podem ser consultados diretamente no código-fonte.

*   **Exemplo de Leitura (GET)**: Listar chamados com paginação.
    ```http
    GET /api/chamados?page=1&pageSize=10
    ```

*   **Exemplo de Escrita (POST)**: Criar um novo chamado.
    ```http
    POST /api/chamados
    Content-Type: application/json

    {
      "Usuarios_id": 1,
      "texto": "Meu computador não liga.",
      "estado": "a",
      "urlImagem": "http://example.com/imagem.png"
    }
    ```

*   **Endpoint SSE**: Conectar para receber atualizações em tempo real.
    ```http
    GET /api/chamados/events
    ```

*   **Códigos de Status HTTP Utilizados**:
    *   `200 OK`: Sucesso em requisições `GET`.
    *   `201 Created`: Sucesso na criação de um recurso com `POST`.
    *   `204 No Content`: Sucesso na remoção de um recurso com `DELETE`.
    *   `400 Bad Request`: Erro na requisição do cliente (ex: ID inválido, campos faltando).
    *   `404 Not Found`: Recurso não encontrado.
    *   `500 Internal Server Error`: Erro interno no servidor.

**Fonte**: `src/routes/chamadoRoutes.js`, `src/controllers/chamadoController.js`

## Ambiente de Demonstração

(não aplicável)

## Troubleshooting (FAQ)

*   **Problema**: O servidor falha ao iniciar com um erro relacionado à conexão com o banco de dados.
    *   **Solução**: Verifique se as variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`) no seu arquivo `.env` estão corretas e se o serviço do PostgreSQL está em execução.

*   **Problema**: O servidor falha ao iniciar com um erro relacionado à conexão com o Redis.
    *   **Solução**: Verifique se as variáveis de ambiente (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`) no seu arquivo `.env` estão corretas e se o serviço do Redis está em execução.

*   **Problema**: O servidor falha ao iniciar com um erro `EADDRINUSE`.
    *   **Solução**: A porta `5000` (ou a definida em `PORT`) já está em uso por outro processo. Altere o valor da variável `PORT` ou finalize o processo que está utilizando a porta.

*   **Problema**: As atualizações em tempo real não funcionam com múltiplas instâncias.
    *   **Solução**: Certifique-se de que o Redis está configurado corretamente e que todas as instâncias conseguem se conectar ao mesmo servidor Redis.

**Fonte**: `src/database/database.js`, `src/server/server.js`, `src/services/redisService.js`

## Roadmap e Contribuição

(não aplicável)

## Licença e Créditos

*   **Licença**: ISC
*   **Autor**: (indeterminado)

**Fonte**: `package.json`
