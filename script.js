// script.js

const VERSION = "1.1.3";
const ADMIN_PASSWORD = "admin123";

let peopleData =
JSON.parse(localStorage.getItem("creditData")) || [];

let deleteTargetId = null;

// Elements
const peopleContainer = document.getElementById('peopleContainer');

const addPersonBtn = document.getElementById('addPersonBtn');

const personModal = document.getElementById('personModal');
const closeModal = document.getElementById('closeModal');
const savePersonBtn = document.getElementById('savePersonBtn');
const newPersonName = document.getElementById('newPersonName');

const txModal = document.getElementById('txModal');
const closeTxModal = document.getElementById('closeTxModal');
const submitTxBtn = document.getElementById('submitTxBtn');

const txPersonId = document.getElementById('txPersonId');
const txType = document.getElementById('txType');
const txAmount = document.getElementById('txAmount');
const txReason = document.getElementById('txReason');
const txPassword = document.getElementById('txPassword');
const txModalTitle = document.getElementById('txModalTitle');

const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmOkBtn = document.getElementById('confirmOkBtn');

const versionText = document.getElementById('versionText');

const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

versionText.innerText = VERSION;

function saveData(){
    localStorage.setItem(
        "creditData",
        JSON.stringify(peopleData)
    );

    renderDashboard();
}

function renderDashboard(){

    peopleContainer.innerHTML = '';

    let filtered = [...peopleData];

    const search = searchInput.value.toLowerCase();

    if(search){
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search)
        );
    }

    if(sortSelect.value === 'highest'){
        filtered.sort((a,b)=>b.balance-a.balance);
    }

    if(sortSelect.value === 'lowest'){
        filtered.sort((a,b)=>a.balance-b.balance);
    }

    if(sortSelect.value === 'alphabetical'){
        filtered.sort((a,b)=>a.name.localeCompare(b.name));
    }

    filtered.forEach(person=>{

        const card = document.createElement('div');
        card.className = 'card';

        let historyHTML = '';

        if(person.history.length === 0){
            historyHTML =
            `<li class="history-item">
                No history yet
            </li>`;
        } else {

            [...person.history]
            .reverse()
            .slice(0,5)
            .forEach(item=>{

                historyHTML += `
                    <li class="history-item ${item.type}">
                        <span>${item.reason}</span>
                        <span>
                        ${item.type === 'plus' ? '+' : '-'}
                        $${Math.abs(item.amount).toFixed(2)}
                        </span>
                    </li>
                `;
            });
        }

        const formattedBalance =
        person.balance < 0
        ? `-$${Math.abs(person.balance).toFixed(2)}`
        : `$${person.balance.toFixed(2)}`;

        card.innerHTML = `
            <div class="card-header">
                <h2>${person.name}</h2>

                <button
                class="btn btn-danger"
                onclick="promptDeletePerson('${person.id}')">
                    Delete
                </button>
            </div>

            <div class="balance-display">
                <span>Current Balance</span>

                <div
                class="amount"
                style="color:
                ${person.balance < 0 ? '#ef4444' : '#60a5fa'}">
                    ${formattedBalance}
                </div>

                ${
                    person.balance < 0
                    ? `<div class="debt-badge">IN DEBT</div>`
                    : ''
                }
            </div>

            <div class="card-actions">

                <button
                class="btn btn-primary"
                onclick="openTransactionModal('${person.id}','plus')">
                    + Add
                </button>

                <button
                class="btn btn-secondary"
                onclick="openTransactionModal('${person.id}','minus')">
                    - Deduct
                </button>

            </div>

            <div class="history-section">
                <h4>Recent Activity</h4>
                <ul class="history-list">
                    ${historyHTML}
                </ul>
            </div>
        `;

        peopleContainer.appendChild(card);

    });
}

// Add Person
addPersonBtn.addEventListener('click', ()=>{
    personModal.classList.add('active');
});

closeModal.addEventListener('click', ()=>{
    personModal.classList.remove('active');
});

savePersonBtn.addEventListener('click', ()=>{

    const name = newPersonName.value.trim();

    if(!name){
        alert("Enter a valid name");
        return;
    }

    peopleData.push({
        id:'p_'+Date.now(),
        name,
        balance:0,
        history:[]
    });

    newPersonName.value = '';

    personModal.classList.remove('active');

    saveData();
});

// Transactions
window.openTransactionModal = function(id,type){

    const person =
    peopleData.find(p=>p.id===id);

    if(!person) return;

    txPersonId.value = id;
    txType.value = type;

    txModalTitle.innerText =
    type === 'plus'
    ? `Add Credits to ${person.name}`
    : `Deduct Credits from ${person.name}`;

    txAmount.value = '';
    txReason.value = '';
    txPassword.value = '';

    txModal.classList.add('active');
}

closeTxModal.addEventListener('click', ()=>{
    txModal.classList.remove('active');
});

submitTxBtn.addEventListener('click', ()=>{

    const id = txPersonId.value;
    const type = txType.value;

    const amount =
    parseFloat(
        parseFloat(txAmount.value).toFixed(2)
    );

    const reason = txReason.value.trim();
    const password = txPassword.value;

    if(isNaN(amount) || amount <= 0){
        alert("Invalid amount");
        return;
    }

    if(!reason){
        alert("Reason required");
        return;
    }

    if(password !== ADMIN_PASSWORD){
        alert("Wrong password");
        return;
    }

    const person =
    peopleData.find(p=>p.id===id);

    if(!person) return;

    if(type === 'plus'){
        person.balance += amount;
    } else {
        person.balance -= amount;
    }

    person.history.push({
        type,
        amount,
        reason,
        date:new Date().toLocaleString()
    });

    txModal.classList.remove('active');

    saveData();
});

// Delete
window.promptDeletePerson = function(id){

    const person =
    peopleData.find(p=>p.id===id);

    if(!person) return;

    deleteTargetId = id;

    confirmMessage.innerText =
    `Delete ${person.name}?`;

    confirmModal.classList.add('active');
}

confirmCancelBtn.addEventListener('click', ()=>{
    confirmModal.classList.remove('active');
});

confirmOkBtn.addEventListener('click', ()=>{

    peopleData =
    peopleData.filter(
        p=>p.id!==deleteTargetId
    );

    confirmModal.classList.remove('active');

    saveData();
});

// Search & Sort
searchInput.addEventListener(
    'input',
    renderDashboard
);

sortSelect.addEventListener(
    'change',
    renderDashboard
);

// Theme
document.getElementById('darkModeToggle')
.addEventListener('click', ()=>{

    document.body.classList.toggle('dark');
});

// Start
renderDashboard();
