// App State management
let peopleData = JSON.parse(localStorage.getItem('axy_credits')) || [];
const ADMIN_PASSWORD = "1234";
let deleteTargetId = null;

// DOM Elements
const peopleContainer = document.getElementById('people-container');
const addPersonBtn = document.getElementById('add-person-btn');
const personModal = document.getElementById('person-modal');
const closeModal = document.getElementById('close-modal');
const savePersonBtn = document.getElementById('save-person-btn');
const newPersonNameInput = document.getElementById('new-person-name');

// Transaction Modal Elements
const txModal = document.getElementById('tx-modal');
const closeTxModal = document.getElementById('close-tx-modal');
const submitTxBtn = document.getElementById('submit-tx-btn');
const txModalTitle = document.getElementById('tx-modal-title');
const txPersonId = document.getElementById('tx-person-id');
const txType = document.getElementById('tx-type');
const txAmountInput = document.getElementById('tx-amount');
const txReasonInput = document.getElementById('tx-reason');
const txPasswordInput = document.getElementById('tx-password');

// Custom Alert Modal Elements
const alertModal = document.getElementById('alert-modal');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const closeAlertBtn = document.getElementById('close-alert-btn');

// Custom Confirmation Modal Elements
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmOkBtn = document.getElementById('confirm-ok-btn');

// Custom Alert Function (Replaces standard window.alert)
function showAlert(title, message) {
    alertTitle.innerText = title;
    alertMessage.innerText = message;
    alertModal.classList.add('active');
}
closeAlertBtn.addEventListener('click', () => alertModal.classList.remove('active'));

// Save data helper
function saveData() {
    localStorage.setItem('axy_credits', JSON.stringify(peopleData));
    renderDashboard();
}

// Render interface dynamically
function renderDashboard() {
    peopleContainer.innerHTML = '';

    if (peopleData.length === 0) {
        peopleContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 3rem 0;">No profiles found. Click "+ Add New Person" to begin.</p>`;
        return;
    }

    peopleData.forEach(person => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Build History List Elements
        let historyHTML = '';
        if (person.history.length === 0) {
            historyHTML = '<li class="history-item" style="color:#94a3b8">No history yet</li>';
        } else {
            // Show latest 4 transactions
            [...person.history].reverse().slice(0, 4).forEach(item => {
                historyHTML += `
                    <li class="history-item ${item.type}">
                        <span class="history-reason">${item.reason}</span>
                        <span class="history-amt">${item.type === 'plus' ? '+' : '-'}$${Math.abs(item.amount).toFixed(2)}</span>
                    </li>
                `;
            });
        }

        // Format balance string cleanly, handling negative signs correctly
        const formattedBalance = person.balance < 0 
            ? `-$${Math.abs(person.balance).toFixed(2)}` 
            : `$${person.balance.toFixed(2)}`;

        card.innerHTML = `
            <div class="card-header">
                <h2>${person.name}</h2>
                <button class="btn btn-delete-card" onclick="promptDeletePerson('${person.id}')">Delete</button>
            </div>
            <div class="balance-display">
                <span>Current Balance</span>
                <div class="amount" style="color: ${person.balance < 0 ? 'var(--danger)' : 'var(--primary-blue)'}">${formattedBalance}</div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="openTransactionModal('${person.id}', 'plus')">+ Add</button>
                <button class="btn btn-secondary" style="border: 1px solid #2563eb; color: #2563eb" onclick="openTransactionModal('${person.id}', 'minus')">- Deduct</button>
            </div>
            <div class="history-section">
                <h4>Recent Activity</h4>
                <ul class="history-list">${historyHTML}</ul>
            </div>
        `;
        peopleContainer.appendChild(card);
    });
}

// Open Person Addition Modal
addPersonBtn.addEventListener('click', () => personModal.classList.add('active'));
closeModal.addEventListener('click', () => {
    personModal.classList.remove('active');
    newPersonNameInput.value = '';
});

// Save New Profile Action
savePersonBtn.addEventListener('click', () => {
    const name = newPersonNameInput.value.trim();
    if (!name) {
        showAlert("Input Required", "Please enter a valid profile name.");
        return;
    }

    const newPerson = {
        id: 'p_' + Date.now(),
        name: name,
        balance: 0.00,
        history: []
    };

    peopleData.push(newPerson);
    saveData();
    
    // reset/close
    newPersonNameInput.value = '';
    personModal.classList.remove('active');
});

// Open credit action controls
window.openTransactionModal = function(id, type) {
    const person = peopleData.find(p => p.id === id);
    if (!person) return;

    txPersonId.value = id;
    txType.value = type;
    txModalTitle.innerText = type === 'plus' ? `Add Credits to ${person.name}` : `Deduct Credits from ${person.name}`;
    
    // Reset Form Input fields
    txAmountInput.value = '';
    txReasonInput.value = '';
    txPasswordInput.value = '';
    
    txModal.classList.add('active');
};

// Close transaction window
closeTxModal.addEventListener('click', () => txModal.classList.remove('active'));

// Handle Credit Adjusting Math and Logic Verification
submitTxBtn.addEventListener('click', () => {
    const id = txPersonId.value;
    const type = txType.value;
    const amount = parseFloat(parseFloat(txAmountInput.value).toFixed(2));
    const reason = txReasonInput.value.trim();
    const password = txPasswordInput.value;

    const personIndex = peopleData.findIndex(p => p.id === id);
    if (personIndex === -1) return;

    // Validation checks
    if (isNaN(amount) || amount <= 0) {
        showAlert("Invalid Amount", "Please input a numeric amount higher than 0.00.");
        return;
    }
    if (!reason) {
        showAlert("Reason Required", "A valid reason description is mandatory for transaction logs.");
        return;
    }
    if (password !== ADMIN_PASSWORD) {
        showAlert("Access Denied", "Incorrect Admin Password! Changes rejected.");
        return;
    }

    // Apply arithmetic updates (allowing balances to go below 0)
    if (type === 'plus') {
        peopleData[personIndex].balance += amount;
    } else {
        peopleData[personIndex].balance -= amount;
    }

    // Push details safely
    peopleData[personIndex].history.push({
        type: type,
        amount: amount,
        reason: reason,
        date: new Date().toLocaleDateString()
    });

    saveData();
    txModal.classList.remove('active');
});

// Custom Modal confirmation logic for Profile Deletion
window.promptDeletePerson = function(id) {
    const person = peopleData.find(p => p.id === id);
    if (!person) return;
    
    deleteTargetId = id;
    confirmMessage.innerText = `Are you sure you want to permanently delete ${person.name}? All history tracking logs will be removed.`;
    confirmModal.classList.add('active');
};

confirmCancelBtn.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    deleteTargetId = null;
});

confirmOkBtn.addEventListener('click', () => {
    if (deleteTargetId) {
        peopleData = peopleData.filter(p => p.id !== deleteTargetId);
        saveData();
    }
    confirmModal.classList.remove('active');
    deleteTargetId = null;
});

// Initial system deployment run loop
renderDashboard();
