const VERSION = "1.1.4";
const ADMIN_PASSWORD = "admin123";

let peopleData = JSON.parse(localStorage.getItem("creditData")) || [];

let deleteTargetId = null;
let undoStack = {}; // stores last transaction per user

// Elements
const peopleContainer = document.getElementById("peopleContainer");

const addPersonBtn = document.getElementById("addPersonBtn");
const personModal = document.getElementById("personModal");
const closeModal = document.getElementById("closeModal");
const savePersonBtn = document.getElementById("savePersonBtn");
const newPersonName = document.getElementById("newPersonName");

const txModal = document.getElementById("txModal");
const closeTxModal = document.getElementById("closeTxModal");
const submitTxBtn = document.getElementById("submitTxBtn");

const txPersonId = document.getElementById("txPersonId");
const txType = document.getElementById("txType");
const txAmount = document.getElementById("txAmount");
const txReason = document.getElementById("txReason");
const txPassword = document.getElementById("txPassword");
const txModalTitle = document.getElementById("txModalTitle");

const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmOkBtn = document.getElementById("confirmOkBtn");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const versionText = document.getElementById("versionText");
versionText.innerText = VERSION;

// SAVE
function saveData() {
    localStorage.setItem("creditData", JSON.stringify(peopleData));
    renderDashboard();
}

// ALERT
function showAlert(msg) {
    alert(msg);
}

// RENDER
function renderDashboard() {
    peopleContainer.innerHTML = "";

    let filtered = [...peopleData];

    const search = searchInput.value.toLowerCase();
    if (search) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search)
        );
    }

    if (sortSelect.value === "highest") {
        filtered.sort((a, b) => b.balance - a.balance);
    }

    if (sortSelect.value === "lowest") {
        filtered.sort((a, b) => a.balance - b.balance);
    }

    if (sortSelect.value === "alphabetical") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    filtered.forEach(person => {

        const card = document.createElement("div");
        card.className = "card";

        let historyHTML = "";

        if (!person.history.length) {
            historyHTML = `<li class="history-item">No history yet</li>`;
        } else {
            [...person.history]
                .slice(-5)
                .reverse()
                .forEach(item => {

                    historyHTML += `
                        <li class="history-item ${item.type}">
                            <span>${item.reason}</span>
                            <span>
                                ${item.type === "plus" ? "+" : "-"}
                                $${item.amount.toFixed(2)}
                            </span>
                        </li>
                    `;
                });
        }

        const formatted =
            person.balance < 0
                ? `-$${Math.abs(person.balance).toFixed(2)}`
                : `$${person.balance.toFixed(2)}`;

        const canUndo =
            undoStack[person.id] !== undefined;

        card.innerHTML = `
            <div class="card-header">
                <h2>${person.name}</h2>

                <button class="btn btn-danger"
                onclick="promptDeletePerson('${person.id}')">
                    Delete
                </button>
            </div>

            <div class="balance-display">
                <span>Balance</span>

                <div class="amount"
                style="color:${person.balance < 0 ? '#ef4444' : '#60a5fa'}">
                    ${formatted}
                </div>

                ${person.balance < 0 ? `<div class="debt-badge">IN DEBT</div>` : ""}
            </div>

            <div class="card-actions">

                <button class="btn btn-primary"
                onclick="openTransactionModal('${person.id}','plus')">
                    + Add
                </button>

                <button class="btn btn-secondary"
                onclick="openTransactionModal('${person.id}','minus')">
                    - Deduct
                </button>

                <button class="btn btn-warning"
                onclick="undoTransaction('${person.id}')"
                ${!canUndo ? "disabled" : ""}>
                    Undo
                </button>

            </div>

            <div class="history-section">
                <h4>Recent Activity</h4>
                <ul class="history-list">${historyHTML}</ul>
            </div>
        `;

        peopleContainer.appendChild(card);
    });
}

// ADD PERSON
addPersonBtn.onclick = () => {
    personModal.classList.add("active");
};

closeModal.onclick = () => {
    personModal.classList.remove("active");
};

savePersonBtn.onclick = () => {

    const name = newPersonName.value.trim();

    if (!name) return showAlert("Enter name");

    peopleData.push({
        id: "p_" + Date.now(),
        name,
        balance: 0,
        history: []
    });

    newPersonName.value = "";
    personModal.classList.remove("active");

    saveData();
};

// OPEN TX
window.openTransactionModal = function (id, type) {

    const person = peopleData.find(p => p.id === id);
    if (!person) return;

    txPersonId.value = id;
    txType.value = type;

    txModalTitle.innerText =
        type === "plus"
            ? `Add Credits to ${person.name}`
            : `Deduct Credits from ${person.name}`;

    txAmount.value = "";
    txReason.value = "";
    txPassword.value = "";

    txModal.classList.add("active");
};

// CLOSE TX
closeTxModal.onclick = () => {
    txModal.classList.remove("active");
};

// SUBMIT TX
submitTxBtn.onclick = () => {

    const id = txPersonId.value;
    const type = txType.value;

    const amount = parseFloat(txAmount.value);
    const reason = txReason.value.trim();
    const password = txPassword.value;

    if (!amount || amount <= 0) return showAlert("Invalid amount");
    if (!reason) return showAlert("Reason required");
    if (password !== ADMIN_PASSWORD) return showAlert("Wrong password");

    const person = peopleData.find(p => p.id === id);
    if (!person) return;

    // SAVE FOR UNDO
    undoStack[id] = {
        prevBalance: person.balance,
        prevHistoryLength: person.history.length
    };

    if (type === "plus") {
        person.balance += amount;
    } else {
        person.balance -= amount;
    }

    person.history.push({
        type,
        amount,
        reason,
        date: new Date().toLocaleString()
    });

    txModal.classList.remove("active");
    saveData();
};

// UNDO
window.undoTransaction = function (id) {

    const person = peopleData.find(p => p.id === id);
    if (!person) return;

    const undo = undoStack[id];
    if (!undo) return;

    person.balance = undo.prevBalance;
    person.history.length = undo.prevHistoryLength;

    delete undoStack[id];

    saveData();
};

// DELETE
window.promptDeletePerson = function (id) {

    const person = peopleData.find(p => p.id === id);
    if (!person) return;

    deleteTargetId = id;

    confirmMessage.innerText = `Delete ${person.name}?`;

    confirmModal.classList.add("active");
};

confirmCancelBtn.onclick = () => {
    confirmModal.classList.remove("active");
};

confirmOkBtn.onclick = () => {

    peopleData = peopleData.filter(p => p.id !== deleteTargetId);

    delete undoStack[deleteTargetId];

    confirmModal.classList.remove("active");

    saveData();
};

// SEARCH + SORT
searchInput.oninput = renderDashboard;
sortSelect.onchange = renderDashboard;

// DARK MODE
document.getElementById("darkModeToggle").onclick = () => {
    document.body.classList.toggle("dark");
};

// START
renderDashboard();
