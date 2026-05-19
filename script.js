const VERSION = "1.1.13";

let peopleData =
JSON.parse(localStorage.getItem("creditData")) || [];

let settings =
JSON.parse(localStorage.getItem("settings")) || {
    theme:"blue",
    adminPassword:"admin123"
};

let undoStack = {};
let redoStack = {};
let deleteTarget = null;
let chart = null;

/* APPLY THEME */
function applyTheme(){
    document.body.className = settings.theme;
}
applyTheme();

/* SAVE */
function save(){
    localStorage.setItem("creditData",JSON.stringify(peopleData));
    render();
}

function saveSettings(){
    localStorage.setItem("settings",JSON.stringify(settings));
}

/* ELEMENTS */
document.getElementById("versionText").innerText = VERSION;

/* THEME CHANGE */
document.getElementById("themeSelect").value = settings.theme;

document.getElementById("themeSelect").onchange = (e)=>{
    settings.theme = e.target.value;
    saveSettings();
    applyTheme();
};

/* CLOSE MODALS */
window.closeAll = () =>
document.querySelectorAll(".modal")
.forEach(m=>m.classList.remove("active"));

/* SETTINGS */
window.openSettings = ()=>{
    document.getElementById("adminPasswordInput").value = settings.adminPassword;
    document.getElementById("settingsModal").classList.add("active");
};

document.getElementById("saveSettingsBtn").onclick = ()=>{
    settings.adminPassword =
    document.getElementById("adminPasswordInput").value;
    saveSettings();
    closeAll();
};

/* CHANGELOG */
const LOG = [
{version:"1.1.13",changes:["Fixed theme system","Button consistency","Scrollable logs"]},
{version:"1.1.12",changes:["Graphs","Logs system"]},
{version:"1.1.11",changes:["Glass UI","Settings"]},
];

window.openChangelog = ()=>{
    const box = document.getElementById("changelogText");
    box.innerHTML = "";

    LOG.forEach(l=>{
        const div = document.createElement("div");
        div.innerHTML = `<h3 style="color:var(--accent)">v${l.version}</h3>
        <ul>${l.changes.map(c=>`<li>${c}</li>`).join("")}</ul>`;
        box.appendChild(div);
    });

    document.getElementById("changelogModal").classList.add("active");
};

/* RENDER */
function render(){

    const container = document.getElementById("peopleContainer");
    container.innerHTML = "";

    let list = [...peopleData];

    list.forEach(p=>{

        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <h3>${p.name}</h3>
            <div>$${p.balance.toFixed(2)}</div>

            <div class="actions">

                <button onclick="tx('${p.id}','plus')">Add</button>
                <button onclick="tx('${p.id}','minus')">Deduct</button>
                <button onclick="openHistory('${p.id}')">Logs</button>
                <button onclick="undo('${p.id}')">Undo</button>
                <button onclick="redo('${p.id}')">Redo</button>
                <button class="danger-btn" onclick="del('${p.id}')">Delete</button>

            </div>
        `;

        container.appendChild(div);
    });
}

/* TRANSACTIONS */
window.tx = (id,type)=>{

    const amount = prompt("Amount:");
    const reason = prompt("Reason:");
    const pass = prompt("Admin password:");

    if(pass !== settings.adminPassword) return;

    const p = peopleData.find(x=>x.id===id);
    if(!p) return;

    undoStack[id] = undoStack[id]||[];
    redoStack[id] = [];

    undoStack[id].push({balance:p.balance});

    const val = parseFloat(amount);

    if(type==="plus") p.balance += val;
    else p.balance -= val;

    p.history = p.history||[];
    p.history.push({type,amount:val,reason,date:new Date()});

    save();
};

/* DELETE */
window.del = (id)=>{
    deleteTarget = id;
    document.getElementById("deleteModal").classList.add("active");
};

document.getElementById("confirmDeleteBtn").onclick = ()=>{
    peopleData = peopleData.filter(p=>p.id!==deleteTarget);
    save();
    closeAll();
};

/* UNDO / REDO */
window.undo = (id)=>{
    const p = peopleData.find(x=>x.id===id);
    if(!p || !undoStack[id]?.length) return;

    redoStack[id] = redoStack[id]||[];
    redoStack[id].push({balance:p.balance});

    p.balance = undoStack[id].pop().balance;
    save();
};

window.redo = (id)=>{
    const p = peopleData.find(x=>x.id===id);
    if(!p || !redoStack[id]?.length) return;

    undoStack[id].push({balance:p.balance});
    p.balance = redoStack[id].pop().balance;
    save();
};

/* HISTORY + GRAPH */
window.openHistory = (id)=>{

    const p = peopleData.find(x=>x.id===id);
    if(!p) return;

    document.getElementById("historyModal").classList.add("active");

    const box = document.getElementById("historyList");

    box.innerHTML = (p.history||[]).map(h=>
        `<div class="history-item">
            <span>${h.reason}</span>
            <span>${h.type==="plus"?"+":"-"}$${h.amount}</span>
        </div>`
    ).join("");

    let labels=[], data=[], bal=0;

    (p.history||[]).forEach((h,i)=>{
        bal += h.type==="plus"?h.amount:-h.amount;
        labels.push(i+1);
        data.push(bal);
    });

    const ctx = document.getElementById("historyChart");

    if(chart) chart.destroy();

    chart = new Chart(ctx,{
        type:"line",
        data:{
            labels,
            datasets:[{data,borderColor:"var(--accent)"}]
        }
    });
};

/* ADD PERSON */
document.getElementById("addPersonBtn").onclick = ()=>{
    const name = prompt("Name:");
    if(!name) return;

    peopleData.push({
        id:Date.now()+"",
        name,
        balance:0,
        history:[]
    });

    save();
};

/* SEARCH/SORT */
document.getElementById("searchInput").oninput = render;
document.getElementById("sortSelect").onchange = render;

render();
