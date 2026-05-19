let people = JSON.parse(localStorage.getItem("p")) || [];

let settings = JSON.parse(localStorage.getItem("s")) || {
    theme:"blue"
};

let undo = {};
let redo = {};
let chart;

/* THEME */
function applyTheme(){
    document.body.className = settings.theme;
}
applyTheme();

/* SAVE */
function save(){
    localStorage.setItem("p",JSON.stringify(people));
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

                <button onclick="tx('${p.id}',1)">Add</button>
                <button onclick="tx('${p.id}',-1)">Deduct</button>
                <button onclick="openHistory('${p.id}')">History</button>
                <button onclick="undoTx('${p.id}')">Undo</button>
                <button onclick="redoTx('${p.id}')">Redo</button>
                <button class="danger" onclick="del('${p.id}')">Delete</button>

            </div>
        `;

        box.appendChild(div);
    });
}

/* ADD */
function addPerson(){
    let name = prompt("Name:");
    if(!name) return;

    people.push({
        id:Date.now()+"",
        name,
        balance:0,
        history:[]
    });

    save();
}

/* TX */
function tx(id,type){

    let amt = parseFloat(prompt("Amount"));
    let reason = prompt("Reason");
    let pass = prompt("Password");

    if(!amt || pass !== "1234") return;

    let p = people.find(x=>x.id===id);

    undo[id] = undo[id] || [];
    redo[id] = [];

    undo[id].push(p.balance);

    p.balance += type * amt;

    p.history.push({
        type,amt,reason,date:new Date()
    });

    save();
}

/* UNDO/REDO */
function undoTx(id){
    let p = people.find(x=>x.id===id);
    if(!undo[id]?.length) return;

    redo[id].push(p.balance);
    p.balance = undo[id].pop();
    save();
}

function redoTx(id){
    let p = people.find(x=>x.id===id);
    if(!redo[id]?.length) return;

    undo[id].push(p.balance);
    p.balance = redo[id].pop();
    save();
}

/* HISTORY */
function openHistory(id){

    let p = people.find(x=>x.id===id);

    document.getElementById("historyModal").classList.add("active");

    document.getElementById("historyTitle").innerText = p.name;

    document.getElementById("historyList").innerHTML =
    p.history.map(h=>`
        <div>${h.reason} $${h.amt}</div>
    `).join("");

    let labels=[],data=[],b=0;

    p.history.forEach((h,i)=>{
        b += h.type * h.amt;
        labels.push(i);
        data.push(b);
    });

    if(chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"),{
        type:"line",
        data:{labels,datasets:[{data}]}
    });
}

/* LOGS (FULL HISTORY FROM START) */
function openLogs(){

    const logs = [
        "v1.0 - Initial system",
        "v1.1 - Themes added",
        "v1.2 - Graph system",
        "v1.2.0 - UI rebuild + fix system"
    ];

    document.getElementById("logModal").classList.add("active");

    document.getElementById("logList").innerHTML =
    logs.map(l=>`<div>${l}</div>`).join("");
}

/* DELETE */
function del(id){
    people = people.filter(p=>p.id!==id);
    save();
}

/* CONTROLS */
document.getElementById("theme").onchange=(e)=>{
    settings.theme = e.target.value;
    applyTheme();
};

document.getElementById("sort").onchange=render;
document.getElementById("search").oninput=render;

render();
