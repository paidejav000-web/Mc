let people = JSON.parse(localStorage.getItem("people")) || [];
let settings = JSON.parse(localStorage.getItem("settings")) || {
    theme:"blue",
    admin:"1234"
};

let undo = {};
let redo = {};
let chart;

let currentTxId = null;
let currentTxType = null;

/* THEME */
function applyTheme(){
    document.body.className = settings.theme;
}
applyTheme();

/* SAVE */
function save(){
    localStorage.setItem("people",JSON.stringify(people));
    render();
}

/* RENDER */
function render(){

    const box = document.getElementById("people");
    box.innerHTML = "";

    people.forEach(p=>{

        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <h3>${p.name}</h3>

            <div class="balance">
                $${p.balance.toFixed(2)}
            </div>

            <div class="actions">

                <button onclick="openTx('${p.id}','plus')">Add</button>
                <button onclick="openTx('${p.id}','minus')">Deduct</button>
                <button onclick="openHistory('${p.id}')">History</button>
                <button onclick="undoTx('${p.id}')">Undo</button>
                <button onclick="redoTx('${p.id}')">Redo</button>
                <button class="danger" onclick="del('${p.id}')">Delete</button>

            </div>
        `;

        box.appendChild(div);
    });
}

/* ADD PERSON (UI ONLY) */
function openAdd(){
    document.getElementById("addModal").classList.add("active");
}

function confirmAdd(){

    const name = document.getElementById("addName").value;
    if(!name) return;

    people.push({
        id:Date.now()+"",
        name,
        balance:0,
        history:[]
    });

    document.getElementById("addName").value = "";
    closeAll();
    save();
}

/* TRANSACTION UI */
function openTx(id,type){

    currentTxId = id;
    currentTxType = type;

    document.getElementById("txModal").classList.add("active");
    document.getElementById("txTitle").innerText =
    type==="plus" ? "Add Credits" : "Deduct Credits";
}

function confirmTx(){

    const amt = parseFloat(document.getElementById("txAmount").value);
    const reason = document.getElementById("txReason").value;
    const pass = document.getElementById("txPass").value;

    if(pass !== settings.admin || !amt) return;

    let p = people.find(x=>x.id===currentTxId);

    undo[currentTxId] = undo[currentTxId] || [];
    redo[currentTxId] = [];

    undo[currentTxId].push(p.balance);

    if(currentTxType==="plus") p.balance += amt;
    else p.balance -= amt;

    p.history.push({
        type:currentTxType,
        amt,
        reason,
        date:new Date().toLocaleString()
    });

    document.getElementById("txAmount").value="";
    document.getElementById("txReason").value="";
    document.getElementById("txPass").value="";

    closeAll();
    save();
}

/* HISTORY */
function openHistory(id){

    const p = people.find(x=>x.id===id);

    document.getElementById("historyModal").classList.add("active");

    document.getElementById("historyTitle").innerText = p.name;

    document.getElementById("historyList").innerHTML =
    p.history.map(h=>`
        <div>${h.reason} — $${h.amt}</div>
    `).join("");

    let labels=[],data=[],b=0;

    p.history.forEach((h,i)=>{
        b += h.type==="plus"?h.amt:-h.amt;
        labels.push(i);
        data.push(b);
    });

    if(chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"),{
        type:"line",
        data:{labels,datasets:[{data}]}
    });
}

/* UNDO */
function undoTx(id){
    let p = people.find(x=>x.id===id);
    if(!undo[id]?.length) return;

    redo[id] = redo[id] || [];
    redo[id].push(p.balance);

    p.balance = undo[id].pop();
    save();
}

/* REDO */
function redoTx(id){
    let p = people.find(x=>x.id===id);
    if(!redo[id]?.length) return;

    undo[id].push(p.balance);
    p.balance = redo[id].pop();
    save();
}

/* DELETE */
function del(id){
    people = people.filter(p=>p.id!==id);
    save();
}

/* LOGS (FULL HISTORY FIXED) */
function openLogs(){

    const logs = [
        "v1.0 - start",
        "v1.1 - themes",
        "v1.2 - graphs",
        "v1.2.1 - UI fix",
        "v1.2.2 - UI-only transactions (NO prompts)"
    ];

    document.getElementById("logModal").classList.add("active");

    document.getElementById("logList").innerHTML =
    logs.map(l=>`<div>${l}</div>`).join("");
}

/* CLOSE */
function closeAll(){
    document.querySelectorAll(".modal")
    .forEach(m=>m.classList.remove("active"));
}

/* CONTROLS */
document.getElementById("theme").onchange=(e)=>{
    settings.theme = e.target.value;
    applyTheme();
};

document.getElementById("search").oninput=render;
document.getElementById("sort").onchange=render;

render();
