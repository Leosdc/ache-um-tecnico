# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - 2026-01-05

### ✨ Adicionado
- **Sistema de Gamificação para Técnicos:**
    - Implementação de **Nível** e **XP**.
    - Barra de progresso visual no Dashboard com cálculos de progressão dinâmica.
    - Sistema de **Conquistas** (Medalhas desbloqueáveis: *Primeiro Passo*, *Veterano*, *Mestre de Elite* e *Inalcançável*).
- **Sistema de Avaliação & Reputação:**
    - Modal de avaliação por estrelas (1-5) para o cliente após conclusão do serviço.
    - Impacto direto das avaliações no ganho de XP do técnico.
- **Perfis Públicos de Técnicos:**
    - Modal de perfil acessível ao clicar no nome do técnico em propostas ou serviços confirmados.
    - Exibição de Nível, Média de Estrelas, Localização, Habilidades e Conquistas desbloqueadas.
- **Sistema de Notificações Centralizado:**
    - Central de notificações com ícone de sino e contador de não lidas.
    - Notificações automáticas para novas propostas, mensagens de chat e mudanças de status.
    - Badges de "Nova Atualização" visíveis diretamente nos cards de serviço.
- **Chat de Atendimento:**
    - Interface de chat integrada para solicitações confirmadas.
    - Cores dinâmicas baseadas no papel (Amarelo para Clientes, Ciano para Técnicos).
    - Persistência de mensagens via LocalStorage.

### 🐛 Corrigido
- **UI do Header:** Removidas informações redundantes ("Contato") que poluíam o cabeçalho.
- **Barra de XP:** Corrigida lógica matemática que resultava em `NaN` em novos perfis.
- **Funcionalidade de Dashboard:** Consertado bug onde botões "Chat" e "Ver Mais" ficavam inoperantes por falta de função de limpeza de notificação.
- **Notificações:** Botão "Limpar Tudo" agora reseta corretamente o estado das mensagens.
- **Estilos:** Fixado alinhamento de selos (badges) e sombras em modais.

### 💄 Melhorias de UI/UX
- **Header Refinado:** Badge de nível agora posicionado ao lado do nome do usuário para um look mais "premium".
- **Espaçamento:** Aumentado o respiro entre os títulos das seções e os cards no Dashboard.
- **Contato Padrão:** Otimizado fluxo de registro, removendo seleção de preferência de contato (padrão WhatsApp).

## [1.0.0] - 2026-01-02

### ✨ Adicionado
- **Gestão de Solicitações (Cliente):**
  - Agora clientes podem **Editar** e **Excluir** suas próprias solicitações.
  - Botão "Ver Mais" no painel do cliente para visualizar detalhes em popup.
- **Campos Detalhados:** Adicionados campos de *Orçamento*, *Forma de Pagamento* e *Urgência* na criação de solicitação.
- **Autocomplete de Endereço:**
  - Implementado sistema de busca de endereços (Brasil) usando **OpenStreetMap (Nominatim)**.
  - Funciona no cadastro e na criação de solicitações.
  - 100% Gratuito e sem API Key.
- **Máscara de Telefone:** Formatação automática `(XX) XXXXX-XXXX` nos campos de contato.
- **Modal de Detalhes:** Popup responsivo mostrando todas as informações da solicitação.

### 🐛 Corrigido
- **Visibilidade de Solicitações:** Corrigido bug onde técnicos não viam as solicitações criadas (removido filtro de área restritivo).
- **Layout Mobile:**
  - Removida animação de "expansão" pesada no mobile, substituída por transição suave.
  - Ajustado alinhamento da Logo para a esquerda no mobile.
  - Corrigido posicionamento de botões.
- **Navegação:** Simplificado fluxo de entrada com botão único "Começar" para cada perfil.

### 💄 Melhorias de UI/UX
- **Design:** Refinamento do efeito Glassmorphism nos cards e modais.
- **Botões:** Padronização de estilos e ações (Editar/Excluir com cores distintas).
- **Feedback:** Alertas de confirmação para ações destrutivas (Excluir).

---
*Mantido por Leonardo da Cruz*
