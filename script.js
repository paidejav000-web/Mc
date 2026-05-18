const VERSION = "1.1.5";
const ADMIN_PASSWORD = "admin123";

let peopleData = JSON.parse(localStorage.getItem("creditData")) || [];

let undoStack = {};
let redoStack = {};

let editTarget = null;

// ELEMENTS
const peopleContainer = document.getElementById("peopleContainer");

const addPersonBtn = document.getElementById("addPersonBtn");
const personModal = document.getElementById("personModal");
const savePersonBtn = document.getElementById("savePersonBtn");
const newPersonName = document.getElementById("newPersonName");

const txModal = document.getElementById("txModal");
const submitTxBtn = document.getElementById("submitTxBtn");
const txPersonId = document.getElementById("txPersonId");
const txType = document.getElementById("txType");
const txAmount = document.getElementById("txAmount");
const txReason = document.getElementById("txReason");
const txPassword = document.getElementById("txPassword");
const txModalTitle = document.getElementById("txModalTitle");

const versionText = document.getElementById("versionText");
versionText.innerText = VERSION;

// SAVE
function saveData() {
    localStorage.setItem("creditData", JSON.stringify(peopleData));
    render();
}

// AVATAR
function getAvatar(name) {
    const colors = ["#2563eb","#ef4444","#22c55e","#f59e0b","#a855f7"];
    const color = colors[name.length % colors.length];
    return { letter: name[0].toUpperCase(), color };
}

// BALANCE ANIMATION
function animateBalance(el, start, end) {
    let cur = start;
    const step = (end - start) / 20;

    const interval = setInterval(() => {
        cur += step;
        if ((step > 0 && cur >= end) || (step < 0 && cur <= end)) {
            cur = end;
            clearInterval(interval);
        }

        el.innerText =
            cur < 0
                ? `-$${Math.abs(cur).toFixed(2)}`
                : `$${cur.toFixed(2)}`;
    }, 15);
}

// RENDER
function render() {
    peopleContainer.innerHTML = "";

    peopleData.forEach(person => {

        const card = document.createElement("div");
        card.className = "card";

        const avatar = getAvatar(person.name);

        let historyHTML = "";

        person.history.slice(-5).reverse().forEach((t, i) => {
            historyHTML += `
                <li class="history-item ${t.type}">
                    <span>${t.reason}</span>
                    <span>$${t.amount.toFixed(2)}</span>

                    <button onclick="editTx('${person.id}',${person.history.length-1-i})">✏</button>
                    <button onclick="deleteTx('${person.id}',${person.history.length-1-i})">🗑</button>
                </li>
            `;
        });

        const balance =
            person.balance < 0
                ? `-$${Math.abs(person.balance).toFixed(2)}`
                : `$${person.balance.toFixed(2)}`;

        card.innerHTML = `
            <div class="card-header">
                <div style="display:flex;gap:10px;align-items:center;">
                    <div class="avatar" style="background:${avatar.color}">
                        ${avatar.letter}
                    </div>
                    <h2>${person.name}</h2>
                </div>

                <button onclick="promptDelete('${person.id}')">Delete</button>
            </div>

            <div class="balance-display">
                <div class="amount" data-id="${person.id}">
                    ${balance}
                </div>
            </div>

            <div class="card-actions">
                <button onclick="openTx('${person.id}','plus')">+ Add</button>
                <button onclick="openTx('${person.id}','minus')">- Deduct</button>

                <button onclick="undo('${person.id}')">Undo</button>
                <button onclick="redo('${person.id}')">Redo</button>
            </div>

            <ul>${historyHTML}</ul>
        `;

        peopleContainer.appendChild(card);
    });
}

// ADD PERSON
addPersonBtn.onclick = () => personModal.classList.add("active");

savePersonBtn.onclick = () => {

    const name = newPersonName.value.trim();
    if (!name) return;

    peopleData.push({
        id: "p_" + Date.now(),
        name,
        balance: 0,
        history: []
    });

    saveData();
    personModal.classList.remove("active");
};

// OPEN TX
window.openTx = (id, type) => {
    const p = peopleData.find(x => x.id === id);

    txPersonId.value = id;
    txType.value = type;

    txModalTitle.innerText =
        type === "plus"
            ? `Add to ${p.name}`
            : `Deduct from ${p.name}`;

    txAmount.value = "";
    txReason.value = "";
    txPassword.value = "";

    txModal.classList.add("active");
};

// SUBMIT TX
submitTxBtn.onclick = () => {

    const id = txPersonId.value;
    const type = txType.value;

    const amount = parseFloat(txAmount.value);
    const reason = txReason.value;
    const pass = txPassword.value;

    if (!amount || amount <= 0) return;
    if (!reason) return;
    if (pass !== ADMIN_PASSWORD) return;

    const person = peopleData.find(p => p.id === id);

    // clear redo stack on new action
    redoStack[id] = [];

    undoStack[id] = undoStack[id] || [];
    undoStack[id].push({
        balanceBefore: person.balance,
        tx: null
    });

    if (type === "plus") person.balance += amount;
    else person.balance -= amount;

    person.history.push({
        type,
        amount,
        reason
    });

    saveData();
    txModal.classList.remove("active");

    const el = document.querySelector(`[data-id="${id}"]`);
    animateBalance(el, person.balance - (type==="plus"?amount:-amount), person.balance);
};

// UNDO
window.undo = (id) => {

    const person = peopleData.find(p => p.id === id);
    const stack = undoStack[id];

    if (!stack || !stack.length) return;

    const last = stack.pop();

    redoStack[id] = redoStack[id] || [];
    redoStack[id].push({
        balanceBefore: person.balance
    });

    person.balance = last.balanceBefore;

    person.history.pop();

    saveData();
};

// REDO
window.redo = (id) => {

    const person = peopleData.find(p => p.id === id);
    const stack = redoStack[id];

    if (!stack || !stack.length) return;

    const redo = stack.pop();

    person.balance = redo.balanceBefore;

    saveData();
};

// EDIT TX
window.editTx = (id, index) => {

    const person = peopleData.find(p => p.id === id);
    const t = person.history[index];

    const newAmount = parseFloat(prompt("New amount:", t.amount));
    const newReason = prompt("New reason:", t.reason);

    if (!newAmount || !newReason) return;

    const diff = newAmount - t.amount;

    person.balance += (t.type === "plus" ? diff : -diff);

    t.amount = newAmount;
    t.reason = newReason;

    saveData();
};

// DELETE TX
window.deleteTx = (id, index) => {

    const person = peopleData.find(p => p.id === id);
    const t = person.history[index];

    if (!t) return;

    person.balance += (t.type === "plus" ? -t.amount : t.amount);

    person.history.splice(index, 1);

    saveData();
};

// DELETE PERSON
window.promptDelete = (id) => {
    peopleData = peopleData.filter(p => p.id !== id);
    saveData();
};

render();
