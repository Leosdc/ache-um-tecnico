// State Management
const state = {
    currentView: 'home',
    userType: null, // 'tecnico' or 'cliente'
    currentUser: null,
    solicitacoes: [],
};

// DOM Elements
const views = {
    home: document.getElementById('home-view'),
    login: document.getElementById('login-view'),
    register: document.getElementById('register-view'),
    dashboard: document.getElementById('dashboard-view')
};

const homeSides = {
    tecnico: document.getElementById('side-tecnico'),
    cliente: document.getElementById('side-cliente')
};

// Persistence Helper
const storage = {
    save: (key, value) => localStorage.setItem(`aut_${key}`, JSON.stringify(value)),
    load: (key) => {
        const item = localStorage.getItem(`aut_${key}`);
        return item ? JSON.parse(item) : null;
    }
};

// Address Autocomplete using OpenStreetMap (FREE!)
let autocompleteTimeout;
let currentAddressInput;

function initAddressAutocomplete() {
    const addressInput = document.getElementById('reg-address');
    if (!addressInput) return;

    currentAddressInput = addressInput;

    // Create dropdown container
    let dropdown = document.getElementById('address-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'address-dropdown';
        dropdown.className = 'address-autocomplete-dropdown';
        addressInput.parentNode.appendChild(dropdown);
    }

    // Listen for input
    addressInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length < 3) {
            dropdown.innerHTML = '';
            dropdown.style.display = 'none';
            return;
        }

        // Debounce API calls
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            searchAddress(query, dropdown);
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== addressInput && e.target.closest('#address-dropdown') === null) {
            dropdown.style.display = 'none';
        }
    });
}

async function searchAddress(query, dropdown) {
    try {
        // Using Nominatim API (OpenStreetMap) - FREE!
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&` +
            `countrycodes=br&` +
            `format=json&` +
            `addressdetails=1&` +
            `limit=5`,
            {
                headers: {
                    'Accept-Language': 'pt-BR'
                }
            }
        );

        const results = await response.json();

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="address-item">Nenhum endereço encontrado</div>';
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = results.map(result => {
            const displayName = result.display_name;
            return `<div class="address-item" data-address="${displayName}">${displayName}</div>`;
        }).join('');

        dropdown.style.display = 'block';

        // Add click handlers
        dropdown.querySelectorAll('.address-item').forEach(item => {
            item.addEventListener('click', () => {
                currentAddressInput.value = item.dataset.address;
                dropdown.style.display = 'none';
            });
        });

    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
    }
}

// Setup address field with autocomplete
function setupAddressField(fieldId) {
    const addressInput = document.getElementById(fieldId);
    if (!addressInput) return;

    // Create dropdown container
    let dropdown = document.getElementById(`${fieldId}-dropdown`);
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = `${fieldId}-dropdown`;
        dropdown.className = 'address-autocomplete-dropdown';
        addressInput.parentNode.appendChild(dropdown);
    }

    // Listen for input
    addressInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length < 3) {
            dropdown.innerHTML = '';
            dropdown.style.display = 'none';
            return;
        }

        // Debounce API calls
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            searchAddressForField(query, dropdown, addressInput);
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== addressInput && !e.target.closest(`#${fieldId}-dropdown`)) {
            dropdown.style.display = 'none';
        }
    });
}

async function searchAddressForField(query, dropdown, targetInput) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&` +
            `countrycodes=br&` +
            `format=json&` +
            `addressdetails=1&` +
            `limit=5`,
            {
                headers: {
                    'Accept-Language': 'pt-BR'
                }
            }
        );

        const results = await response.json();

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="address-item">Nenhum endereço encontrado</div>';
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = results.map(result => {
            const displayName = result.display_name;
            return `<div class="address-item" data-address="${displayName}">${displayName}</div>`;
        }).join('');

        dropdown.style.display = 'block';

        // Add click handlers
        dropdown.querySelectorAll('.address-item').forEach(item => {
            item.addEventListener('click', () => {
                targetInput.value = item.dataset.address;
                dropdown.style.display = 'none';
            });
        });

    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
    }
}

// Phone Mask Helper
function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
        value = `(${value}`;
    }

    input.value = value;
}

// Initialize
function init() {
    loadData();
    setupEventListeners();

    // Apply phone mask to all phone inputs
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', (e) => applyPhoneMask(e.target));
    });

    renderView('home');
}

function loadData() {
    state.currentUser = storage.load('current_user');
    state.solicitacoes = storage.load('solicitacoes') || [];

    if (state.currentUser) {
        state.userType = state.currentUser.type;
        renderView('dashboard');
    }
}

function setupEventListeners() {
    // Side Selection (Home)
    // Side Selection (Home) - Now triggered by specific buttons
    document.getElementById('btn-tecnico').addEventListener('click', (e) => {
        e.stopPropagation();
        handleSideSelection('tecnico');
    });

    document.getElementById('btn-cliente').addEventListener('click', (e) => {
        e.stopPropagation();
        handleSideSelection('cliente');
    });

    // Back Buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => renderView('home'));
    });

    // Auth Switch
    document.getElementById('go-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        renderView('register');
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// Side Expansion Logic
function handleSideSelection(type) {
    state.userType = type;
    const splitScreen = document.querySelector('.split-screen');
    const logo = document.getElementById('main-logo');

    // Add class to container to trigger CSS transitions
    if (type === 'tecnico') {
        splitScreen.classList.add('expand-tecnico');
    } else {
        splitScreen.classList.add('expand-cliente');
    }

    // Move logo - ALWAYS to left as requested
    if (logo) {
        logo.classList.remove('pos-right');
        logo.classList.add('pos-left');
    }

    // Wait for animation to finish
    setTimeout(() => {
        renderView('login');
        // Reset home screen state
        splitScreen.classList.remove('expand-tecnico', 'expand-cliente');
    }, 800); // Matches --transition-slow
}

// Routing
function renderView(viewName) {
    state.currentView = viewName;

    // Toggle View Visibility
    Object.keys(views).forEach(v => {
        views[v].classList.toggle('active', v === viewName);
    });

    // Reset Logo Position if Home
    if (viewName === 'home') {
        const logo = document.getElementById('main-logo');
        if (logo) {
            logo.classList.remove('pos-left', 'pos-right');
        }
    }

    // Toggle Global Logo Visibility
    const logo = document.getElementById('main-logo');
    if (logo) {
        logo.style.display = viewName === 'dashboard' ? 'none' : 'block';
    }

    // UI Adjustments based on User Type
    if (state.userType) {
        updateAuthUI();
    }

    if (viewName === 'dashboard') {
        renderDashboard();
    }

    // Initialize address autocomplete for register view
    if (viewName === 'register') {
        setTimeout(() => setupAddressField('reg-address'), 100);
    }
}

function updateAuthUI() {
    const isTecnico = state.userType === 'tecnico';
    const loginTitle = document.getElementById('login-title');
    const regTitle = document.getElementById('register-title');

    loginTitle.innerText = `Login - ${isTecnico ? 'Técnico' : 'Cliente'}`;
    regTitle.innerText = `Cadastro - ${isTecnico ? 'Técnico' : 'Cliente'}`;

    // Toggle fields
    document.querySelectorAll('.tecnico-only').forEach(el => {
        el.style.display = isTecnico ? 'block' : 'none';
    });

    // Theme color adjustments
    const primaryColor = isTecnico ? 'var(--primary-cyan)' : 'var(--primary-yellow)';
    document.querySelectorAll('.btn-primary, .auth-footer a').forEach(el => {
        if (el.tagName === 'A') el.style.color = primaryColor;
        else el.style.backgroundColor = isTecnico ? 'var(--primary-cyan)' : 'var(--primary-yellow)';
    });
}

// Auth Handlers
function handleRegister(e) {
    e.preventDefault();
    const isTecnico = state.userType === 'tecnico';

    const userData = {
        type: state.userType,
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        password: document.getElementById('reg-password').value,
        address: document.getElementById('reg-address').value,
        contactPref: 'both', // Default
        createdAt: new Date().toISOString()
    };

    if (isTecnico) {
        userData.skills = document.getElementById('reg-skills').value;
        userData.area = document.getElementById('reg-area').value;
    }

    // Simple storage: user_{type}_{email}
    const userKey = `user_${userData.type}_${userData.email}`;
    storage.save(userKey, userData);

    alert('Cadastro realizado! Faça login para continuar.');
    renderView('login');
}

// Helper for contact pref display
function formatContactPref(pref) {
    if (pref === 'whatsapp') return 'WhatsApp';
    if (pref === 'email') return 'E-mail';
    return 'WhatsApp e E-mail';
}

// Settings Modal Logic
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        // Set current value
        const select = document.getElementById('settings-contact-pref');
        if (select && state.currentUser) {
            select.value = state.currentUser.contactPref || 'both';
        }
        modal.classList.remove('hidden');
    }
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleSettingsSave(e) {
    e.preventDefault();
    if (!state.currentUser) return;

    const newPref = document.getElementById('settings-contact-pref').value;

    // Update State
    state.currentUser.contactPref = newPref;

    // Update Local Storage
    localStorage.setItem('aut_current_user', JSON.stringify(state.currentUser));

    // Refresh Dashboard UI (simple reload of view)
    renderDashboard(state.userType);

    closeSettings();

    // Optional: Show feedback
    alert('Configurações salvas com sucesso!');
}

// Make functions global
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.handleSettingsSave = handleSettingsSave;
window.handleLogout = handleLogout;
window.renderView = renderView;

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const userKey = `user_${state.userType}_${email}`;
    const userData = storage.load(userKey);

    if (userData && userData.password === password) {
        state.currentUser = userData;
        storage.save('current_user', userData);
        renderView('dashboard');
    } else {
        alert('Credenciais inválidas ou tipo de usuário incorreto!');
    }
}

function handleLogout() {
    localStorage.removeItem('aut_current_user');
    state.currentUser = null;
    state.userType = null;

    // Reset logo
    const logo = document.getElementById('main-logo');
    if (logo) {
        logo.classList.remove('pos-left', 'pos-right');
    }

    renderView('home');
}

// Dashboard Logic
function renderDashboard() {
    const container = document.getElementById('dashboard-view');
    const isTecnico = state.userType === 'tecnico';

    container.innerHTML = `
        <div class="dashboard-container">
            <header class="dash-header" style="background: ${isTecnico ? 'var(--primary-cyan)' : 'var(--primary-yellow)'}">
                <div class="header-content">
                    <div class="user-info">
                        <h1>Olá, ${state.currentUser.name}</h1>
                        <p>${isTecnico ? 'Área: ' + state.currentUser.area : 'Local: ' + state.currentUser.address}</p>
                        <p class="text-sm opacity-80" style="margin-top: 4px;">Contato: ${formatContactPref(state.currentUser.contactPref)}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                         <button onclick="openSettings()" class="btn-logout"><i data-lucide="settings"></i></button>
                         <button onclick="handleLogout()" class="btn-logout"><i data-lucide="log-out"></i> Sair</button>
                    </div>
                </div>
            </header>
            
            <main class="dash-main">
                ${isTecnico ? renderTecnicoDash() : renderClienteDash()}
            </main>
        </div>
    `;
    lucide.createIcons();

    // Attach form listener if it's a client
    if (!isTecnico) {
        const form = document.getElementById('request-form');
        if (form) {
            form.addEventListener('submit', handleCreateRequest);
        }
        // Setup address autocomplete for request location field
        setTimeout(() => setupAddressField('req-location'), 100);
    }
}

// Modal Functions
function openRequestModal(requestId) {
    const request = state.solicitacoes.find(r => r.id === requestId);
    if (!request) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'request-modal';
    modal.innerHTML = `
        <div class="modal request-modal">
            <div class="modal-header">
                <h2>${request.title}</h2>
                <button class="btn-close" onclick="closeRequestModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h3>📝 Descrição</h3>
                    <p>${request.description}</p>
                </div>
                
                <div class="detail-section">
                    <h3>💰 Informações Financeiras</h3>
                    <p><strong>Orçamento:</strong> ${request.budget || 'A combinar'}</p>
                    <p><strong>Forma de Pagamento:</strong> ${request.paymentMethod || 'A combinar'}</p>
                </div>
                
                <div class="detail-section">
                    <h3>⏰ Urgência</h3>
                    <p>${request.urgency || 'Normal'}</p>
                </div>
                
                <div class="detail-section">
                    <h3>📍 Localização</h3>
                    <p>${request.location}</p>
                </div>
                
                <div class="detail-section">
                    <h3>👤 Solicitante</h3>
                    <p><strong>Nome:</strong> ${request.userName}</p>
                    <p><strong>Contato:</strong> ${request.userPhone || request.email}</p>
                </div>
                
                <div class="detail-section">
                    <h3>📅 Data da Solicitação</h3>
                    <p>${new Date(request.createdAt).toLocaleString('pt-BR')}</p>
                </div>
            </div>
            <div class="modal-footer">
                ${state.currentUser.email === request.email ? `
                    <button class="btn-action" onclick="openEditModal(${request.id})" style="background: transparent; border: 1px solid var(--primary-cyan); color: var(--primary-cyan); margin-right: auto;">Editar</button>
                    <button class="btn-action" onclick="deleteRequest(${request.id}); closeRequestModal();" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; margin-right: 1rem;">Excluir</button>
                ` : ''}
                <button class="btn-primary" onclick="closeRequestModal()">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeRequestModal();
    });
}

function closeRequestModal() {
    const modal = document.getElementById('request-modal');
    if (modal) modal.remove();
}

// Make modal functions global
window.openRequestModal = openRequestModal;
window.closeRequestModal = closeRequestModal;

function handleCreateRequest(e) {
    e.preventDefault();
    const newRequest = {
        id: Date.now(),
        title: document.getElementById('req-title').value,
        description: document.getElementById('req-desc').value,
        location: document.getElementById('req-location').value,
        budget: document.getElementById('req-budget').value,
        paymentMethod: document.getElementById('req-payment').value,
        urgency: document.getElementById('req-urgency').value,
        email: state.currentUser.email,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        status: 'pendente',
        createdAt: new Date().toISOString()
    };

    state.solicitacoes.push(newRequest);
    storage.save('solicitacoes', state.solicitacoes);
    alert('Solicitação criada com sucesso!');
    renderDashboard();
}

function renderTecnicoDash() {
    // Show ALL pending requests (removed area filter - was causing the bug)
    const matches = state.solicitacoes.filter(s => s.status === 'pendente');

    return `
        <div class="dash-section">
            <div class="section-header">
                <h2>Solicitações Disponíveis</h2>
                <span class="badge">${matches.length} encontradas</span>
            </div>
            <div class="cards-grid">
                ${matches.map(s => `
                    <div class="request-card glass">
                        <h3>${s.title}</h3>
                        <p>${s.description}</p>
                        <div class="request-details">
                            <p><strong>💰 Orçamento:</strong> ${s.budget || 'A combinar'}</p>
                            <p><strong>💳 Pagamento:</strong> ${s.paymentMethod || 'A combinar'}</p>
                            <p><strong>⏰ Urgência:</strong> ${s.urgency || 'Normal'}</p>
                        </div>
                        <div class="card-footer">
                            <span><i data-lucide="map-pin"></i> ${s.location}</span>
                            <button class="btn-action" onclick="openRequestModal(${s.id})">Ver Mais</button>
                        </div>
                    </div>
                `).join('') || '<p class="empty-state">Nenhuma solicitação disponível no momento.</p>'}
            </div>
        </div>
    `;
}

function renderClienteDash() {
    return `
        <div class="dash-section">
            <div class="section-header">
                <h2>O que você precisa hoje?</h2>
            </div>
            <form id="request-form" class="glass request-form">
                <input type="text" id="req-title" placeholder="Título (ex: Preciso de ajuda no Excel)" required>
                <textarea id="req-desc" placeholder="Descreva o problema em detalhes..." required></textarea>
                <input type="text" id="req-location" value="${state.currentUser.address}" placeholder="Local do serviço" required>
                
                <div class="form-row">
                    <input type="text" id="req-budget" placeholder="Orçamento (ex: R$ 100,00)" required>
                    <select id="req-payment" required>
                        <option value="">Forma de Pagamento</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Transferência">Transferência</option>
                        <option value="A combinar">A combinar</option>
                    </select>
                </div>
                
                <select id="req-urgency" required>
                    <option value="">Urgência</option>
                    <option value="Baixa">Baixa - Posso esperar alguns dias</option>
                    <option value="Normal">Normal - Dentro de 2-3 dias</option>
                    <option value="Alta">Alta - Preciso urgente (24h)</option>
                    <option value="Emergência">Emergência - Preciso hoje!</option>
                </select>
                
                <button type="submit" class="btn-primary">Criar Solicitação</button>
            </form>
        </div>
        <div class="dash-section mt-4">
            <h2>Minhas Solicitações</h2>
            <div id="my-requests" class="cards-grid">
                ${state.solicitacoes.filter(s => s.email === state.currentUser.email).map(s => `
                    <div class="request-card glass">
                        <h3>${s.title}</h3>
                        <p>${s.description.substring(0, 80)}${s.description.length > 80 ? '...' : ''}</p>
                        
                        <div class="request-details">
                            <span class="status ${s.status}">${s.status}</span>
                            <p style="margin-top: 0.5rem; font-size: 0.9rem;">📅 ${new Date(s.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>

                        <div class="card-footer" style="flex-wrap: wrap; gap: 0.5rem;">
                            <button class="btn-action" onclick="openRequestModal(${s.id})">Ver Mais</button>
                            <button class="btn-action" onclick="openEditModal(${s.id})" style="background: transparent; border: 1px solid var(--primary-cyan); color: var(--primary-cyan);">Editar</button>
                            <button class="btn-action" onclick="deleteRequest(${s.id})" style="background: transparent; border: 1px solid #ef4444; color: #ef4444;">Excluir</button>
                        </div>
                    </div>
                `).join('') || '<p class="empty-state">Você ainda não tem solicitações.</p>'}
            </div>
        </div>
    `;
}

// Global Actions
window.deleteRequest = function (id) {
    if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
        state.solicitacoes = state.solicitacoes.filter(s => s.id !== id);
        storage.save('solicitacoes', state.solicitacoes);
        renderDashboard();
    }
};

window.openEditModal = function (id) {
    const request = state.solicitacoes.find(r => r.id === id);
    if (!request) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'edit-modal';
    modal.innerHTML = `
        <div class="modal request-modal">
            <div class="modal-header">
                <h2>Editar Solicitação</h2>
                <button class="btn-close" onclick="closeEditModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <form id="edit-form" class="modal-body request-form" style="background: transparent; padding: 0;">
                <input type="text" id="edit-title" value="${request.title}" required>
                <textarea id="edit-desc" required>${request.description}</textarea>
                <input type="text" id="edit-location" value="${request.location}" required>
                
                <div class="form-row">
                    <input type="text" id="edit-budget" value="${request.budget || ''}" placeholder="Orçamento" required>
                    <select id="edit-payment" required>
                        <option value="Dinheiro" ${request.paymentMethod === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                        <option value="PIX" ${request.paymentMethod === 'PIX' ? 'selected' : ''}>PIX</option>
                        <option value="Cartão" ${request.paymentMethod === 'Cartão' ? 'selected' : ''}>Cartão</option>
                        <option value="Transferência" ${request.paymentMethod === 'Transferência' ? 'selected' : ''}>Transferência</option>
                        <option value="A combinar" ${request.paymentMethod === 'A combinar' ? 'selected' : ''}>A combinar</option>
                    </select>
                </div>
                
                <select id="edit-urgency" required>
                    <option value="Baixa" ${request.urgency === 'Baixa' ? 'selected' : ''}>Baixa</option>
                    <option value="Normal" ${request.urgency === 'Normal' ? 'selected' : ''}>Normal</option>
                    <option value="Alta" ${request.urgency === 'Alta' ? 'selected' : ''}>Alta</option>
                    <option value="Emergência" ${request.urgency === 'Emergência' ? 'selected' : ''}>Emergência</option>
                </select>
                
                <input type="hidden" id="edit-id" value="${request.id}">
                
                <div class="modal-footer">
                    <button type="button" class="btn-logout" onclick="closeEditModal()" style="border: 1px solid #ccc; background: transparent; color: #333;">Cancelar</button>
                    <button type="submit" class="btn-primary">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    // Setup autocomplete for edit location
    setTimeout(() => setupAddressField('edit-location'), 100);

    // Handle Edit Submit
    document.getElementById('edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedRequest = {
            ...request,
            title: document.getElementById('edit-title').value,
            description: document.getElementById('edit-desc').value,
            location: document.getElementById('edit-location').value,
            budget: document.getElementById('edit-budget').value,
            paymentMethod: document.getElementById('edit-payment').value,
            urgency: document.getElementById('edit-urgency').value,
        };

        const index = state.solicitacoes.findIndex(s => s.id === id);
        if (index !== -1) {
            state.solicitacoes[index] = updatedRequest;
            storage.save('solicitacoes', state.solicitacoes);
            closeEditModal();
            renderDashboard();
            // Also update main modal if open
            if (document.getElementById('request-modal')) {
                closeRequestModal();
                openRequestModal(id);
            }
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditModal();
    });
};

window.closeEditModal = function () {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.remove();
};

// Start the app
init();
