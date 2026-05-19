let people = JSON.parse(localStorage.getItem("people")) || [];

let settings = JSON.parse(localStorage.getItem("settings")) || {
    theme:"blue",
    admin:"1234"
};

let undo = {};
let redo = {};
let chart;

/* APPLY THEME */
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
            <p>$${p.balance.toFixed(2)}</p>

            <div class="actions">

                <button onclick="tx('${p.id}',1)">+ Add</button>
                <button onclick="tx('${p.id}',-1)">- Deduct</button>
                <button onclick="openHistory('${p.id}')">History</button>
                <button onclick="undoTx('${p.id}')">Undo</button>
                <button onclick="redoTx('${p.id}')">Redo</button>

            </div>
        `;

        box.appendChild(div);
    });
}

/* ADD PERSON */
function addPerson(){
    const name = prompt("Name:");
    if(!name) return;

    people.push({
        id:Date.now()+"",
        name,
        balance:0,
        history:[]
    });

    save();
}

/* TRANSACTIONS */
function tx(id,type){

    const amt = parseFloat(prompt("Amount"));
    const reason = prompt("Reason");
    const pass = prompt("Password");

    if(pass !== settings.admin) return;

    let p = people.find(x=>x.id===id);

    undo[id] = undo[id] || [];
    redo[id] = [];

    undo[id].push(p.balance);

    p.balance += type * amt;

    p.history.push({
        type,
        amt,
        reason,
        date:new Date().toLocaleString()
    });

    save();
}

/* UNDO */
function undoTx(id){
    let p = people.find(x=>x.id===id);
    if(!undo[id]?.length) return;

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

/* HISTORY + GRAPH */
function openHistory(id){

    let p = people.find(x=>x.id===id);

    document.getElementById("historyModal").style.display="flex";

    document.getElementById("historyTitle").innerText=p.name;

    document.getElementById("historyList").innerHTML =
    p.history.map(h=>`
        <div>
            ${h.reason} | $${h.amt}
        </div>
    `).join("");

    let labels=[],data=[],bal=0;

    p.history.forEach((h,i)=>{
        bal += h.type * h.amt;
        labels.push(i);
        data.push(bal);
    });

    if(chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"),{
        type:"line",
        data:{
            labels,
            datasets:[{data}]
        }
    });
}

/* LOGS */
function openLogs(){

    const logs = [
        "1.1.14 - UI overhaul + fixes",
        "1.1.13 - theme fixes",
        "1.1.12 - graphs",
        "1.1.11 - glass UI"
    ];

    document.getElementById("logList").innerHTML =
    logs.map(l=>`<div>${l}</div>`).join("");

    document.getElementById("logModal").style.display="flex";
}

/* CLOSE */
function closeAll(){
    document.querySelectorAll(".modal")
    .forEach(m=>m.style.display="none");
}

/* CONTROLS */
document.getElementById("themeSelect").onchange=(e)=>{
    settings.theme = e.target.value;
    applyTheme();
};

document.getElementById("sortSelect").onchange=render;
document.getElementById("searchInput").oninput=render;

render();
