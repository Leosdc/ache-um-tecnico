// State Management
const state = {
    currentView: 'home',
    userType: null, // 'tecnico' or 'cliente'
    currentUser: null,
    solicitacoes: [],
    notifications: [],
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

// Modified Address Autocomplete to fill multiple fields
function setupAddressField(streetId, callback) {
    const addressInput = document.getElementById(streetId);
    if (!addressInput) return;

    // Create dropdown container
    let dropdown = document.getElementById(`${streetId}-dropdown`);
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = `${streetId}-dropdown`;
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
            searchAddressDetailed(query, dropdown, addressInput, callback);
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== addressInput && !e.target.closest(`#${streetId}-dropdown`)) {
            dropdown.style.display = 'none';
        }
    });
}

async function searchAddressDetailed(query, dropdown, targetInput, callback) {
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

        dropdown.innerHTML = results.map((result, index) => {
            const displayName = result.display_name;
            return `<div class="address-item" data-index="${index}">${displayName}</div>`;
        }).join('');

        dropdown.style.display = 'block';

        // Add click handlers
        dropdown.querySelectorAll('.address-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = item.dataset.index;
                const selected = results[index];

                targetInput.value = selected.address.road || selected.display_name.split(',')[0];
                dropdown.style.display = 'none';

                if (callback) callback(selected.address);
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

    renderView(state.currentUser ? 'dashboard' : 'home');
}

function loadData() {
    state.currentUser = storage.load('current_user');
    state.solicitacoes = storage.load('solicitacoes') || [];
    state.notifications = storage.load('notifications') || [];

    // Data Migration: Ensure all requests have an offers array
    state.solicitacoes.forEach(s => {
        if (!s.offers) s.offers = [];
    });

    if (state.currentUser) {
        state.userType = state.currentUser.type;

        // leveling fields initialization for existing users
        if (state.currentUser.type === 'tecnico') {
            if (state.currentUser.level === undefined) state.currentUser.level = 1;
            if (state.currentUser.xp === undefined) state.currentUser.xp = 0;
            if (!state.currentUser.ratings) state.currentUser.ratings = [];
            if (!state.currentUser.achievements) state.currentUser.achievements = [];
        }

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

    // Logo Management
    const logo = document.getElementById('main-logo');
    if (logo) {
        if (viewName === 'home') {
            logo.classList.remove('pos-left', 'pos-right');
            logo.style.display = 'block';
        } else {
            // Login, Register, Dashboard -> Logo Top Left & Small
            logo.classList.add('pos-left');
            logo.style.display = 'block'; // Always show
        }
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
        setTimeout(() => {
            setupAddressField('reg-street', (addr) => {
                setValue('reg-neighborhood', addr.suburb || addr.neighbourhood || '');
                setValue('reg-city', addr.city || addr.town || addr.municipality || '');

                const stateName = addr.state;
                const stateCode = addr.state_code || getStateCode(stateName) || '';
                setValue('reg-state', stateCode);

                document.getElementById('reg-number').focus();
            });

            const phoneInput = document.getElementById('reg-phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', (e) => applyPhoneMask(e.target));
            }
        }, 100);
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

    const street = document.getElementById('reg-street').value;
    const number = document.getElementById('reg-number').value;
    const complement = document.getElementById('reg-complement').value;
    const neighborhood = document.getElementById('reg-neighborhood').value;
    const city = document.getElementById('reg-city').value;
    const stateVal = document.getElementById('reg-state').value;

    const fullAddress = `${street}, ${number} ${complement ? '- ' + complement : ''} - ${neighborhood}, ${city} - ${stateVal}`;

    const userData = {
        type: state.userType,
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        password: document.getElementById('reg-password').value,
        address: fullAddress,
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_neighborhood: neighborhood,
        address_state: stateVal,
        contactPref: 'whatsapp',
        createdAt: new Date().toISOString(),
        level: 1,
        xp: 0,
        ratings: [],
        achievements: []
    };

    if (isTecnico) {
        userData.skills = document.getElementById('reg-skills').value;
        userData.area = document.getElementById('reg-area').value;
    }

    // Simple storage: user_{type}_{email}
    const userKey = `user_${userData.type}_${userData.email}`;
    storage.save(userKey, userData);

    showToast('Cadastro realizado! Faça login para continuar.', 'success');
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
    if (modal && state.currentUser) {
        const user = state.currentUser;
        const isTecnico = state.userType === 'tecnico';

        // Populate Common Fields
        setValue('settings-name', user.name);
        setValue('settings-email', user.email);
        setValue('settings-phone', user.phone);
        setValue('settings-contact-pref', user.contactPref || 'both');

        // Populate Address Components (If available, otherwise try to be smart or leave empty)
        setValue('settings-street', user.address_street || user.address || ''); // Fallback to full address string
        setValue('settings-number', user.address_number || '');
        setValue('settings-complement', user.address_complement || '');
        setValue('settings-neighborhood', user.address_neighborhood || '');
        setValue('settings-city', user.address_city || '');
        setValue('settings-state', user.address_state || '');

        // Apply Phone Mask Immediately
        const phoneInput = document.getElementById('settings-phone');
        if (phoneInput) {
            applyPhoneMask(phoneInput);
            phoneInput.addEventListener('input', (e) => applyPhoneMask(e.target));
        }

        // Populate Technician Fields
        if (isTecnico) {
            setValue('settings-skills', user.skills || '');
            setValue('settings-area', user.area || '');
        }

        // Toggle Visibility
        document.querySelectorAll('.settings-tecnico-only').forEach(el => {
            el.style.display = isTecnico ? 'block' : 'none';
        });

        // Setup Autocomplete with Callback
        setTimeout(() => {
            setupAddressField('settings-street', (addr) => {
                setValue('settings-neighborhood', addr.suburb || addr.neighbourhood || '');
                setValue('settings-city', addr.city || addr.town || addr.municipality || '');

                // Better State Code Extraction
                const stateName = addr.state;
                const stateCode = addr.state_code || getStateCode(stateName) || '';

                setValue('settings-state', stateCode);
                document.getElementById('settings-number').focus(); // Jump to number
            });
        }, 100);

        modal.classList.remove('hidden');
    }
}

function getStateCode(stateName) {
    if (!stateName) return '';
    const map = {
        'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
        'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
        'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
        'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
        'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
        'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
        'Sergipe': 'SE', 'Tocantins': 'TO'
    };
    return map[stateName] || stateName.substring(0, 2).toUpperCase();
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
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

    // Build Address String
    const street = document.getElementById('settings-street').value;
    const number = document.getElementById('settings-number').value;
    const complement = document.getElementById('settings-complement').value;
    const neighborhood = document.getElementById('settings-neighborhood').value;
    const city = document.getElementById('settings-city').value;
    const stateVal = document.getElementById('settings-state').value;

    const fullAddress = `${street}, ${number} ${complement ? '- ' + complement : ''} - ${neighborhood}, ${city} - ${stateVal}`;

    // Update State object
    state.currentUser.name = document.getElementById('settings-name').value;
    state.currentUser.phone = document.getElementById('settings-phone').value;
    state.currentUser.address = fullAddress; // Compatible string
    state.currentUser.contactPref = 'whatsapp';

    // Save structured data for future
    state.currentUser.address_street = street;
    state.currentUser.address_number = number;
    state.currentUser.address_complement = complement;
    state.currentUser.address_neighborhood = neighborhood;
    state.currentUser.address_city = city;
    state.currentUser.address_state = stateVal;

    if (state.userType === 'tecnico') {
        state.currentUser.skills = document.getElementById('settings-skills').value;
        state.currentUser.area = document.getElementById('settings-area').value;
    }

    // Update specific storage key (user_type_email) AND current_user
    const userKey = `user_${state.userType}_${state.currentUser.email}`;
    storage.save(userKey, state.currentUser);
    storage.save('current_user', state.currentUser);

    // Refresh Dashboard UI
    renderDashboard();

    closeSettings();

    // Feedback
    showToast('Configurações salvas com sucesso!', 'success');
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
        showToast('Credenciais inválidas ou tipo de usuário incorreto!', 'error');
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
    const unreadCount = state.notifications.filter(n => !n.read && n.recipientEmail === state.currentUser.email).length;

    container.innerHTML = `
        <div class="dashboard-container">
            <header class="dash-header" style="background: ${isTecnico ? 'var(--primary-cyan)' : 'var(--primary-yellow)'}">
                <div class="header-content">
                    <div class="user-info">
                        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem;">
                            <h1>Olá, ${state.currentUser.name}</h1>
                            ${isTecnico ? `
                                <div class="level-badge" style="margin: 0;">
                                    <i data-lucide="award" style="width:14px;"></i> Nível ${state.currentUser.level || 1}
                                </div>
                            ` : ''}
                        </div>
                        ${isTecnico ? `
                            <div class="xp-container-wrapper">
                                <div class="xp-container">
                                    <div class="xp-bar" style="width: ${Math.min(100, (((state.currentUser.xp || 0) / (100 + ((state.currentUser.level || 1) - 1) * 5)) * 100))}%"></div>
                                </div>
                                <span class="xp-text">${state.currentUser.xp || 0} / ${100 + ((state.currentUser.level || 1) - 1) * 5} XP</span>
                            </div>
                        ` : `
                            <p style="opacity: 0.9; font-size: 0.9rem; display: flex; align-items:center; gap: 4px;">
                                <i data-lucide="map-pin" style="width:14px;"></i> 
                                ${state.currentUser.address_city || 'Local não definido'}
                            </p>
                        `}
                    </div>
                    <div style="display: flex; gap: 0.8rem; align-items: center;">
                         <div class="notification-container">
                             <button onclick="toggleNotifications()" class="btn-logout" title="Notificações">
                                 <i data-lucide="bell"></i>
                                 ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ''}
                             </button>
                             <div id="notif-dropdown" class="notif-dropdown glass">
                                 <div class="notif-header">
                                     <h3>Notificações</h3>
                                     <button onclick="markAllAsRead()" style="background:none; border:none; color:var(--primary-cyan); font-size:0.8rem; cursor:pointer;">Limpar tudo</button>
                                 </div>
                                 <div id="notif-list" class="notif-list">
                                     ${renderNotifications()}
                                 </div>
                             </div>
                         </div>
                         <button onclick="openSettings()" class="btn-logout" title="Configurações"><i data-lucide="settings"></i></button>
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

    // Clear notifications for this request
    clearNotificationsForRequest(requestId);

    if (!request.offers) request.offers = [];

    const isOwner = state.currentUser.email === request.email;
    const isConfirmed = request.status === 'confirmada';
    const myOffer = request.offers.find(o => o.tecnicoEmail === state.currentUser.email);

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

                ${isOwner && request.offers.length > 0 ? `
                    <div class="detail-section">
                        <h3>🤝 Propostas Recebidas (${request.offers.length})</h3>
                        <div class="offer-list">
                            ${request.offers.map(o => {
        const tData = storage.load(`user_tecnico_${o.tecnicoEmail}`);
        const avgRating = tData?.ratings?.length > 0 ? (tData.ratings.reduce((a, b) => a + b, 0) / tData.ratings.length).toFixed(1) : 'S/A';
        return `
                                <div class="offer-card">
                                    <div class="offer-header">
                                        <div style="display:flex; flex-direction:column;">
                                            <strong onclick="openTechnicianProfile('${o.tecnicoEmail}')" style="cursor:pointer; color:var(--primary-cyan); text-decoration:underline;">${o.tecnicoNome}</strong>
                                            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:4px; cursor:pointer;" onclick="openTechnicianProfile('${o.tecnicoEmail}')">
                                                <span class="level-badge" style="padding:0.1rem 0.6rem; font-size:0.65rem; margin-bottom:0; border-width:1px; box-shadow:none;">Nível ${tData?.level || 1}</span>
                                                <div class="rating-display" style="font-size:0.75rem;"><i data-lucide="star" style="width:12px; height:12px; fill:var(--primary-yellow); stroke:var(--primary-yellow);"></i> ${avgRating}</div>
                                            </div>
                                        </div>
                                        <span class="offer-price">R$ ${o.price}</span>
                                    </div>
                                    <p>${o.message}</p>
                                    ${!isConfirmed ? `
                                        <div class="offer-actions">
                                            <button class="btn-primary" onclick="acceptOffer(${request.id}, '${o.tecnicoEmail}')">Aceitar</button>
                                            <button class="btn-action btn-decline" onclick="declineOffer(${request.id}, '${o.tecnicoEmail}')">Recusar</button>
                                        </div>
                                    ` : o.status === 'aceita' ? '<span class="status aceita">Aceita</span>' : ''}
                                </div>
                            `;
    }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${!isOwner && myOffer ? `
                    <div class="detail-section">
                        <h3>Sua Proposta</h3>
                        <div class="offer-card">
                            <div class="offer-header">
                                <span class="offer-price">R$ ${myOffer.price}</span>
                                <span class="status ${myOffer.status}">${myOffer.status}</span>
                            </div>
                            <p>${myOffer.message}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                ${isOwner ? `
                    <button class="btn-action" onclick="openEditModal(${request.id})" style="background: transparent; border: 1px solid var(--primary-cyan); color: var(--primary-cyan); margin-right: auto;">Editar</button>
                ` : ''}

                ${isConfirmed && (isOwner || myOffer?.status === 'aceita') ? `
                    <button class="btn-primary" onclick="openChat(${request.id})">
                        <i data-lucide="message-square" style="width:16px; margin-right:5px;"></i> Abrir Chat
                    </button>
                ` : ''}

                ${!isOwner && state.currentUser.type === 'tecnico' && !myOffer && !isConfirmed ? `
                    <button class="btn-primary" onclick="showProposalForm(${request.id})">Enviar Proposta</button>
                ` : ''}
                
                <button class="btn-action" onclick="closeRequestModal()">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

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
        offers: [],
        createdAt: new Date().toISOString()
    };

    state.solicitacoes.push(newRequest);
    storage.save('solicitacoes', state.solicitacoes);
    showToast('Solicitação criada com sucesso!', 'success');
    renderDashboard();
}

function renderTecnicoDash() {
    // 1. Available Requests
    const available = state.solicitacoes.filter(s => s.status === 'pendente');

    // 2. My Confirmed Services
    const confirmed = state.solicitacoes.filter(s =>
        s.status === 'confirmada' &&
        (s.offers || []).some(o => o.tecnicoEmail === state.currentUser.email && o.status === 'aceita')
    );

    return `
        ${confirmed.length > 0 ? `
            <div class="dash-section">
                <div class="section-header">
                    <h2>Seus Serviços Confirmados</h2>
                    <span class="badge" style="background: #22c55e; color: white;">${confirmed.length} ativo(s)</span>
                </div>
                <div class="cards-grid">
                    ${confirmed.map(s => {
        const hasUnread = state.notifications.some(n => !n.read && n.requestId === s.id && n.recipientEmail === state.currentUser.email);
        return `
                            <div class="request-card glass" style="border-left: 4px solid #22c55e;">
                                <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                                    <div>
                                        <h3>${s.title}</h3>
                                        ${hasUnread ? '<span class="badge-update"><i data-lucide="bell" style="width:10px;"></i> Nova Atualização</span>' : ''}
                                    </div>
                                    <span class="status aceita">Confirmado</span>
                                </div>
                                <p>${s.description.substring(0, 50)}...</p>
                                <div class="card-footer">
                                    <button class="btn-action" onclick="openChat(${s.id})" title="Abrir Chat">
                                        <i data-lucide="message-square" style="width:14px;"></i> Chat
                                    </button>
                                    <button class="btn-primary" onclick="requestClosure(${s.id})" 
                                        style="background: ${s.finishedBy?.includes(state.currentUser.email) ? '#94a3b8' : ''}; font-size: 0.75rem !important;">
                                        ${s.finishedBy?.includes(state.currentUser.email) ? 'Aguardando Cliente' : 'Finalizar'}
                                    </button>
                                    <button class="btn-action" onclick="openRequestModal(${s.id})">Ver Mais</button>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        ` : ''}

        <div class="dash-section mt-4">
            <div class="section-header">
                <h2>Solicitações Disponíveis</h2>
                <span class="badge">${available.length} encontradas</span>
            </div>
            <div class="cards-grid">
                ${available.map(s => {
        const myOffer = (s.offers || []).find(o => o.tecnicoEmail === state.currentUser.email);
        return `
                        <div class="request-card glass">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h3>${s.title}</h3>
                                ${myOffer ? '<span class="badge-offer">Proposta Enviada</span>' : ''}
                            </div>
                            <p>${s.description}</p>
                            <div class="request-details">
                                <p><strong>💰 Orçamento:</strong> ${s.budget || 'A combinar'}</p>
                                <p><strong>⏰ Urgência:</strong> ${s.urgency || 'Normal'}</p>
                            </div>
                            <div class="card-footer">
                                <span><i data-lucide="map-pin"></i> ${s.location}</span>
                                <button class="btn-action" onclick="openRequestModal(${s.id})">
                                    ${myOffer ? 'Ver Minha Proposta' : 'Ver Detalhes'}
                                </button>
                            </div>
                        </div>
                    `;
    }).join('') || '<p class="empty-state">Nenhuma solicitação disponível no momento.</p>'}
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
            <div class="section-header">
                <h2>Minhas Solicitações</h2>
            </div>
            <div id="my-requests" class="cards-grid">
                ${state.solicitacoes.filter(s => s.email === state.currentUser.email).map(s => {
        const hasNewOffers = s.offers && s.offers.length > 0 && s.status === 'pendente';
        const isConfirmed = s.status === 'confirmada';
        const hasUnread = state.notifications.some(n => !n.read && n.requestId === s.id && n.recipientEmail === state.currentUser.email);

        const acceptedOffer = s.offers.find(o => o.status === 'aceita');

        return `
                        <div class="request-card glass" ${isConfirmed ? 'style="border-left: 4px solid #22c55e;"' : ''}>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <div>
                                    <h3>${s.title}</h3>
                                    ${hasUnread ? '<span class="badge-update"><i data-lucide="bell" style="width:10px;"></i> Nova Atualização</span>' : ''}
                                    ${isConfirmed && acceptedOffer ? `
                                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                                            Técnico: <strong onclick="openTechnicianProfile('${acceptedOffer.tecnicoEmail}')" style="cursor:pointer; color:var(--primary-cyan); text-decoration:underline;">${acceptedOffer.tecnicoNome}</strong>
                                        </div>
                                    ` : ''}
                                </div>
                                ${hasNewOffers ? `<span class="badge-offer">${s.offers.length} Proposta(s)</span>` : ''}
                                ${isConfirmed ? `<span class="status aceita">Confirmado</span>` : ''}
                            </div>
                            <p>${s.description.substring(0, 80)}${s.description.length > 80 ? '...' : ''}</p>
                            
                            ${!isConfirmed ? `
                                <div class="request-details">
                                    <span class="status ${s.status}">${s.status}</span>
                                    <p style="margin-top: 0.5rem; font-size: 0.9rem;">📅 ${new Date(s.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            ` : ''}

                            <div class="card-footer">
                                ${isConfirmed ? `
                                    <button class="btn-action" onclick="openChat(${s.id})" title="Abrir Chat">
                                        <i data-lucide="message-square" style="width:14px;"></i> Chat
                                    </button>
                                    ${!s.rated ? `
                                        <button class="btn-primary" onclick="requestClosure(${s.id})"
                                            style="background: var(--primary-yellow); color: var(--dark); ${s.finishedBy?.includes(state.currentUser.email) ? 'background: #94a3b8; color: white;' : ''}; font-size: 0.75rem !important;">
                                            ${s.finishedBy?.includes(state.currentUser.email) ? 'Aguardando Técnico' : 'Finalizar Atendimento'}
                                        </button>
                                    ` : '<span class="status aceita" style="font-size:0.7rem; margin-right:auto; margin-left: 0.5rem;">Avaliado ✅</span>'}
                                ` : ''}
                                <button class="btn-action" onclick="openRequestModal(${s.id})">${hasNewOffers ? 'Ver Propostas' : 'Ver Mais'}</button>
                                ${!isConfirmed ? `
                                    <button class="btn-action" onclick="openEditModal(${s.id})" style="background: transparent; border: 1px solid var(--primary-cyan); color: var(--primary-cyan);">Editar</button>
                                    <button class="btn-action" onclick="deleteRequest(${s.id})" style="background: transparent; border: 1px solid #ef4444; color: #ef4444;">Excluir</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
    }).join('') || '<p class="empty-state">Você ainda não tem solicitações.</p>'}
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
            <form id="edit-form" class="modal-body" style="background: transparent;">
                <div class="request-form" style="padding: 0; gap: 1rem; display: flex; flex-direction: column;">
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
                    <button type="button" class="btn-action" onclick="closeEditModal()" style="background: transparent; border: 1px solid #cbd5e1; color: #64748b;">Cancelar</button>
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
// Toast Notification Helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icons based on type
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Remove after 3s
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.showToast = showToast;

// --- Negotiation Logic ---

window.showProposalForm = function (requestId) {
    const request = state.solicitacoes.find(r => r.id === requestId);
    closeRequestModal();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'proposal-modal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Enviar Proposta</h2>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom:1rem; color:#64748b;">Diga ao cliente quanto você cobra e como pode ajudar.</p>
                <form id="proposal-form">
                    <div class="input-group">
                        <label>Preço Sugerido (R$)</label>
                        <input type="number" id="prop-price" required placeholder="Ex: 150">
                    </div>
                    <div class="input-group" style="margin-top:1rem;">
                        <label>Mensagem / Observações</label>
                        <textarea id="prop-message" required placeholder="Descreva sua experiência com este problema..." style="min-height:100px;"></textarea>
                    </div>
                    <button type="submit" class="btn-primary" style="margin-top:1.5rem; width:100%;">Enviar Proposta</button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    document.getElementById('proposal-form').onsubmit = (e) => {
        e.preventDefault();
        const price = document.getElementById('prop-price').value;
        const message = document.getElementById('prop-message').value;

        if (!request.offers) request.offers = [];
        request.offers.push({
            id: Date.now(),
            tecnicoEmail: state.currentUser.email,
            tecnicoNome: state.currentUser.name,
            price: price,
            message: message,
            status: 'pendente',
            timestamp: new Date().toISOString()
        });

        storage.save('solicitacoes', state.solicitacoes);

        // Notify client
        addNotification(
            'offer',
            'Nova Proposta!',
            `${state.currentUser.name} enviou uma proposta de ${price} para "${request.title}"`,
            requestId,
            request.email
        );

        modal.remove();
        showToast('Proposta enviada com sucesso!', 'success');
        openRequestModal(requestId);
    };
};

window.acceptOffer = function (requestId, tecnicoEmail) {
    const request = state.solicitacoes.find(r => r.id === requestId);
    if (!request) return;

    request.offers.forEach(o => {
        if (o.tecnicoEmail === tecnicoEmail) {
            o.status = 'aceita';
        } else {
            o.status = 'recusada';
        }
    });

    request.status = 'confirmada';
    storage.save('solicitacoes', state.solicitacoes);

    // Notify technician
    addNotification(
        'status',
        'Proposta Aceita! 🎉',
        `Sua proposta para "${request.title}" foi aceita. O chat agora está liberado!`,
        requestId,
        tecnicoEmail
    );

    showToast('Proposta aceita! Chat liberado.', 'success');
    closeRequestModal();
    openRequestModal(requestId);
};

window.declineOffer = function (requestId, tecnicoEmail) {
    const request = state.solicitacoes.find(r => r.id === requestId);
    if (!request) return;

    request.offers = request.offers.filter(o => o.tecnicoEmail !== tecnicoEmail);
    storage.save('solicitacoes', state.solicitacoes);

    // Notify technician
    addNotification(
        'status',
        'Proposta Recusada',
        `Sua proposta para "${request.title}" foi recusada.`,
        requestId,
        tecnicoEmail
    );

    showToast('Proposta recusada.', 'info');
    closeRequestModal();
    openRequestModal(requestId);
};

// --- Chat Logic ---

window.openChat = function (requestId) {
    const request = state.solicitacoes.find(r => r.id === requestId);
    if (!request) return;

    // Clear notifications for this request
    clearNotificationsForRequest(requestId);
    const chatKey = `chat_${requestId}`;
    let messages = storage.load(chatKey) || [];

    const modal = document.createElement('div');
    modal.className = `modal-overlay chat-theme-${state.userType}`;
    modal.id = 'chat-modal';
    modal.innerHTML = `
        <div class="modal glass" style="max-width: 500px;">
            <div class="modal-header">
                <div>
                    <h2>Chat: ${request.title}</h2>
                    <small style="color: var(--primary-color)">Atendimento em curso</small>
                </div>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="chat-window">
                <div class="chat-messages" id="chat-messages">
                    ${messages.map(m => `
                        <div class="message ${m.senderEmail === state.currentUser.email ? 'sent' : 'received'} ${m.senderEmail === state.currentUser.email ? `message-theme-${state.userType}` : ''}">
                            ${m.text}
                            <span class="message-time">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    `).join('') || '<p style="text-align:center; padding:2rem; color:#94a3b8;">Inicie a conversa!</p>'}
                </div>
                <form class="chat-input-area" id="chat-form">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Digite sua mensagem..." autocomplete="off">
                    <button type="submit" class="btn-primary">
                        <i data-lucide="send"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    const msgContainer = document.getElementById('chat-messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;

    document.getElementById('chat-form').onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        const newMessage = {
            senderEmail: state.currentUser.email,
            text: text,
            timestamp: new Date().toISOString()
        };

        messages.push(newMessage);
        storage.save(chatKey, messages);

        // Notification
        const recipientEmail = (state.userType === 'cliente')
            ? request.offers.find(o => o.status === 'aceita').tecnicoEmail
            : request.email;

        addNotification(
            'message',
            `Nova mensagem: ${request.title}`,
            `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
            requestId,
            recipientEmail
        );

        // Update UI
        const msgDiv = document.createElement('div');
        msgDiv.className = `message sent message-theme-${state.userType}`;
        msgDiv.innerHTML = `
            ${text}
            <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        msgContainer.appendChild(msgDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
        input.value = '';
        input.focus();
    };
};

// Notification Functions
function toggleNotifications() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('active');

    // Close on click outside
    if (dropdown.classList.contains('active')) {
        const closeDropdown = (e) => {
            if (!e.target.closest('.notification-container')) {
                dropdown.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
            }
        };
        setTimeout(() => document.addEventListener('click', closeDropdown), 0);
    }
}

function renderNotifications() {
    if (!state.currentUser) return '';

    const myNotifs = state.notifications
        .filter(n => n.recipientEmail === state.currentUser.email)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (myNotifs.length === 0) {
        return '<p class="empty-state" style="padding: 2rem;">Nenhuma notificação por enquanto.</p>';
    }

    return myNotifs.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', ${n.requestId})">
            <div class="notif-item-icon" style="background: ${getNotifColor(n.type)}">
                <i data-lucide="${getNotifIcon(n.type)}" style="width:18px;"></i>
            </div>
            <div class="notif-item-content">
                <div class="notif-item-title">${n.title}</div>
                <div class="notif-item-text">${n.text}</div>
                <div class="notif-item-time">${formatTime(n.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function getNotifIcon(type) {
    switch (type) {
        case 'message': return 'message-square';
        case 'offer': return 'handshake';
        case 'status': return 'activity';
        default: return 'bell';
    }
}

function getNotifColor(type) {
    switch (type) {
        case 'message': return 'var(--primary-cyan)';
        case 'offer': return '#22c55e';
        case 'status': return 'var(--primary-yellow)';
        default: return '#64748b';
    }
}

function formatTime(isoStr) {
    const date = new Date(isoStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 1000 * 60) return 'Agora mesmo';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m atrás`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h atrás`;
    return date.toLocaleDateString('pt-BR');
}

function addNotification(type, title, text, requestId, recipientEmail) {
    const newNotif = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        type,
        title,
        text,
        requestId,
        recipientEmail,
        read: false,
        timestamp: new Date().toISOString()
    };

    state.notifications.push(newNotif);

    // Keep only last 20 notifications per user
    const userNotifs = state.notifications.filter(n => n.recipientEmail === recipientEmail);
    if (userNotifs.length > 20) {
        const toRemove = userNotifs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(0, userNotifs.length - 20);
        state.notifications = state.notifications.filter(n => !toRemove.includes(n));
    }

    storage.save('notifications', state.notifications);
}

function handleNotifClick(notifId, requestId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) {
        notif.read = true;
        storage.save('notifications', state.notifications);
    }

    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.classList.remove('active');

    openRequestModal(requestId);
    renderDashboard();
}

function markAllAsRead() {
    state.notifications
        .filter(n => n.recipientEmail === state.currentUser.email)
        .forEach(n => n.read = true);

    storage.save('notifications', state.notifications);
    renderDashboard();
}

function clearNotificationsForRequest(requestId) {
    state.notifications.forEach(n => {
        if (n.requestId === requestId && n.recipientEmail === state.currentUser.email) {
            n.read = true;
        }
    });
    storage.save('notifications', state.notifications);
}

// --- Leveling & Achievement System ---

window.requestClosure = function (requestId) {
    const request = state.solicitacoes.find(r => r.id === requestId);
    if (!request) return;

    if (!request.finishedBy) request.finishedBy = [];

    if (request.finishedBy.includes(state.currentUser.email)) {
        showToast('Você já confirmou a finalização deste serviço.', 'info');
        return;
    }

    request.finishedBy.push(state.currentUser.email);

    // Notify other party
    const recipientEmail = state.userType === 'cliente' ? request.offers.find(o => o.status === 'aceita')?.tecnicoEmail : request.email;
    if (recipientEmail) {
        addNotification(
            'status',
            'Sinal de Finalização',
            `O ${state.userType === 'cliente' ? 'cliente' : 'técnico'} marcou o serviço "${request.title}" como finalizado.`,
            request.id,
            recipientEmail
        );
    }

    // Check for two-way closure
    if (request.finishedBy.length >= 2) {
        request.status = 'concluída';
        showToast('Serviço finalizado com sucesso!', 'success');

        // If it's the client finishing the two-way closure, or if the client hasn't rated yet
        if (state.userType === 'cliente') {
            const acceptedOffer = request.offers.find(o => o.status === 'aceita');
            if (acceptedOffer) {
                setTimeout(() => openRatingModal(request.id, acceptedOffer.tecnicoEmail), 500);
            }
        }
    } else {
        showToast('Confirmação enviada. Aguardando a outra parte.', 'info');
    }

    storage.save('solicitacoes', state.solicitacoes);
    renderDashboard();
};

window.openRatingModal = function (requestId, tecnicoEmail) {
    const tecnico = storage.load(`user_tecnico_${tecnicoEmail}`);
    if (!tecnico) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px; text-align: center;">
            <div class="modal-header">
                <h2>Avaliar Técnico</h2>
            </div>
            <div class="modal-body">
                <p>Como foi seu atendimento com <strong>${tecnico.name}</strong>?</p>
                <div class="rating-stars" id="rating-stars">
                    <span class="star" data-value="1"><i data-lucide="star"></i></span>
                    <span class="star" data-value="2"><i data-lucide="star"></i></span>
                    <span class="star" data-value="3"><i data-lucide="star"></i></span>
                    <span class="star" data-value="4"><i data-lucide="star"></i></span>
                    <span class="star" data-value="5"><i data-lucide="star"></i></span>
                </div>
                <p id="rating-label" style="font-weight: 700; color: var(--primary-yellow); min-height: 1.5rem;"></p>
            </div>
            <div class="modal-footer" style="justify-content: center;">
                <button class="btn-primary" id="btn-submit-rating" disabled style="width: 100%;">Enviar Avaliação</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    let selectedRating = 0;
    const stars = modal.querySelectorAll('.star');
    const label = modal.getElementById('rating-label');
    const submitBtn = modal.getElementById('btn-submit-rating');

    const labels = ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente!"];

    stars.forEach(s => {
        s.addEventListener('mouseover', () => {
            const val = parseInt(s.dataset.value);
            stars.forEach((star, idx) => {
                if (idx < val) star.classList.add('active');
                else star.classList.remove('active');
            });
            label.textContent = labels[val];
        });

        s.addEventListener('mouseout', () => {
            stars.forEach((star, idx) => {
                if (idx < selectedRating) star.classList.add('active');
                else star.classList.remove('active');
            });
            label.textContent = labels[selectedRating];
        });

        s.addEventListener('click', () => {
            selectedRating = parseInt(s.dataset.value);
            submitBtn.disabled = false;
        });
    });

    submitBtn.onclick = () => {
        rewardXP(tecnicoEmail, selectedRating, requestId);
        document.body.removeChild(modal);
    };
};

function rewardXP(tecnicoEmail, stars, requestId) {
    const tecnico = storage.load(`user_tecnico_${tecnicoEmail}`);
    if (!tecnico) return;

    if (!tecnico.ratings) tecnico.ratings = [];
    tecnico.ratings.push(stars);

    const xpGained = stars * 5;
    tecnico.xp = (tecnico.xp || 0) + xpGained;

    // Level up logic
    let leveledUp = false;
    while (true) {
        const xpToNext = 100 + (tecnico.level - 1) * 5;
        if (tecnico.xp >= xpToNext) {
            tecnico.xp -= xpToNext;
            tecnico.level++;
            leveledUp = true;
        } else {
            break;
        }
    }

    // Achievement checks
    if (!tecnico.achievements) tecnico.achievements = [];
    const checkAchievement = (id, condition) => {
        if (!tecnico.achievements.includes(id) && condition) {
            tecnico.achievements.push(id);
            showToast(`Nova Conquista: ${id}!`, 'success');
            return true;
        }
        return false;
    };

    checkAchievement('Primeiro Passo', tecnico.ratings.length >= 1);
    checkAchievement('Veterano', tecnico.ratings.length >= 5);
    checkAchievement('Mestre de Elite', tecnico.level >= 5);

    // Streaks (simplified)
    const last3 = tecnico.ratings.slice(-3);
    if (last3.length === 3 && last3.every(r => r === 5)) {
        checkAchievement('Inalcançável', true);
    }

    storage.save(`user_tecnico_${tecnicoEmail}`, tecnico);

    // If current user is the tecnico, update state
    if (state.currentUser.email === tecnicoEmail) {
        state.currentUser = tecnico;
        storage.save('current_user', tecnico);
    }

    showToast(`XP Ganhado: +${xpGained}! ${leveledUp ? 'SUBIU DE NÍVEL!' : ''}`, 'success');

    // Update request to avoid re-rating
    const request = state.solicitacoes.find(r => r.id === requestId);
    if (request) {
        request.rated = true;
        storage.save('solicitacoes', state.solicitacoes);
    }

    renderDashboard();
}

window.openTechnicianProfile = function (email) {
    const tecnico = storage.load(`user_tecnico_${email}`);
    if (!tecnico) {
        showToast('Perfil não encontrado.', 'error');
        return;
    }

    const avgRating = tecnico.ratings?.length > 0
        ? (tecnico.ratings.reduce((a, b) => a + b, 0) / tecnico.ratings.length).toFixed(1)
        : 'Nenhuma avaliação';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal profile-modal glass">
            <div class="modal-header">
                <h2>Perfil do Técnico</h2>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="profile-header">
                    <div class="profile-avatar">${tecnico.name.charAt(0)}</div>
                    <h3>${tecnico.name}</h3>
                    <p style="color: #64748b;">${tecnico.area || 'Técnico Especialista'}</p>
                </div>

                <div class="profile-stats">
                    <div class="stat-box">
                        <span class="stat-value">${tecnico.level || 1}</span>
                        <span class="stat-label">Nível</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${tecnico.ratings?.length || 0}</span>
                        <span class="stat-label">Avaliados</span>
                    </div>
                </div>

                <div class="profile-info-grid">
                    <div class="info-item">
                        <i data-lucide="star" style="fill: var(--primary-yellow); stroke: var(--primary-yellow); width: 20px;"></i>
                        <p><strong>Avaliação Média:</strong> ${avgRating} ${tecnico.ratings?.length > 0 ? '⭐' : ''}</p>
                    </div>
                    <div class="info-item">
                        <i data-lucide="map-pin" style="width: 20px;"></i>
                        <p><strong>Localização:</strong> ${tecnico.address_city || ''}, ${tecnico.address_state || ''}</p>
                    </div>
                    <div class="info-item">
                        <i data-lucide="wrench" style="width: 20px;"></i>
                        <p><strong>Habilidades:</strong> ${tecnico.skills || 'Geral'}</p>
                    </div>
                </div>

                <div class="achievements-section">
                    <h4>Conquistas Desbloqueadas</h4>
                    <div class="achievements-grid">
                        ${renderProfileAchievements(tecnico.achievements || [])}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

function renderProfileAchievements(unlocked) {
    const list = [
        { id: 'Primeiro Passo', icon: 'zap', desc: 'Realizou a primeira entrega' },
        { id: 'Veterano', icon: 'shield', desc: 'Completou 5 serviços com sucesso' },
        { id: 'Mestre de Elite', icon: 'award', desc: 'Alcançou o Nível 5' },
        { id: 'Inalcançável', icon: 'flame', desc: '3 avaliações 5 estrelas seguidas' }
    ];

    return list.map(ach => `
        <div class="achievement-badge ${unlocked.includes(ach.id) ? '' : 'locked'}" title="${ach.id}: ${ach.desc}">
            <i data-lucide="${ach.icon}"></i>
        </div>
    `).join('');
}

// Start the app
init();
