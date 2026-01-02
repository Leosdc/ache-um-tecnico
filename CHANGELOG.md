# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

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
