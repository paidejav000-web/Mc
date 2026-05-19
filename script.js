const VERSION = "1.1.12";

/* STORAGE */
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
let currentChart = null;

/* UPDATE LOG */
const LOG = [

{
version:"1.1.12",
changes:[
"Transaction logs",
"Balance graph",
"Fixed sorting",
"Fixed themes"
]
},

{
version:"1.1.11",
changes:[
"Glass UI",
"Editable password"
]
}

];

/* ELEMENTS */
const peopleContainer =
document.getElementById("peopleContainer");

document.getElementById(
"versionText"
).innerText = VERSION;

/* THEME */
document.body.className =
settings.theme;

const themeSelect =
document.getElementById("themeSelect");

themeSelect.value =
settings.theme;

themeSelect.onchange = () => {

    settings.theme =
    themeSelect.value;

    document.body.className =
    settings.theme;

    saveSettings();
};

/* SAVE */
function save(){

    localStorage.setItem(
        "creditData",
        JSON.stringify(peopleData)
    );

    render();
}

/* SETTINGS SAVE */
function saveSettings(){

    localStorage.setItem(
        "settings",
        JSON.stringify(settings)
    );
}

/* CLOSE */
window.closeAll = function(){

    document.querySelectorAll(".modal")
    .forEach(m=>{
        m.classList.remove("active");
    });
};

/* SETTINGS */
window.openSettings = function(){

    document.getElementById(
        "adminPasswordInput"
    ).value =
    settings.adminPassword;

    document.getElementById(
        "settingsModal"
    ).classList.add("active");
};

document.getElementById(
"saveSettingsBtn"
).onclick = () => {

    settings.adminPassword =
    document.getElementById(
        "adminPasswordInput"
    ).value;

    saveSettings();

    closeAll();
};

/* CHANGELOG */
window.openChangelog = function(){

    const text =
    document.getElementById(
        "changelogText"
    );

    text.innerHTML =
    LOG.map(log=>`

        <div style="margin-bottom:20px">

            <h3 style="color:var(--accent)">
                v${log.version}
            </h3>

            <ul>
                ${log.changes
                    .map(c=>`<li>${c}</li>`)
                    .join("")}
            </ul>

        </div>

    `).join("");

    document.getElementById(
        "changelogModal"
    ).classList.add("active");
};

/* BALANCE ANIMATION */
function animateBalance(el,start,end){

    let startTime = null;

    function update(time){

        if(!startTime)
            startTime = time;

        const progress =
        Math.min(
            (time-startTime)/500,
            1
        );

        const value =
        start + (end-start)*progress;

        el.innerText =
            value < 0
            ? "-$"+Math.abs(value).toFixed(2)
            : "$"+value.toFixed(2);

        if(progress < 1){
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* AVATAR */
window.uploadAvatar = function(id){

    const input =
    document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = e => {

        const file =
        e.target.files[0];

        if(!file) return;

        const reader =
        new FileReader();

        reader.onload = () => {

            const person =
            peopleData.find(
                p=>p.id===id
            );

            person.avatar =
            reader.result;

            save();
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* RENDER */
function render(){

    peopleContainer.innerHTML = "";

    let filtered = [...peopleData];

    const search =
    document.getElementById(
        "searchInput"
    ).value.toLowerCase();

    const sort =
    document.getElementById(
        "sortSelect"
    ).value;

    /* SEARCH */
    if(search){

        filtered = filtered.filter(person =>
            person.name
            .toLowerCase()
            .includes(search)
        );
    }

    /* SORT */
    if(sort === "highest"){
        filtered.sort((a,b)=>
            b.balance-a.balance
        );
    }

    if(sort === "lowest"){
        filtered.sort((a,b)=>
            a.balance-b.balance
        );
    }

    if(sort === "alphabetical"){
        filtered.sort((a,b)=>
            a.name.localeCompare(b.name)
        );
    }

    filtered.forEach(person => {

        const card =
        document.createElement("div");

        card.className = "card";

        const avatar =
        person.avatar
        ? `<img src="${person.avatar}">`
        : person.name[0].toUpperCase();

        card.innerHTML = `

            <div class="card-top">

                <div class="avatar"
                onclick="uploadAvatar('${person.id}')">
                    ${avatar}
                </div>

                <h3>${person.name}</h3>

            </div>

            <div
            class="balance"
            id="balance-${person.id}">
                $0.00
            </div>

            <div class="actions">

                <button
                onclick="openTx('${person.id}','plus')">
                    Add
                </button>

                <button
                onclick="openTx('${person.id}','minus')">
                    Deduct
                </button>

                <button
                onclick="openHistory('${person.id}')">
                    Logs
                </button>

                <button
                onclick="undo('${person.id}')">
                    Undo
                </button>

                <button
                onclick="redo('${person.id}')">
                    Redo
                </button>

                <button
                onclick="promptDelete('${person.id}')">
                    Delete
                </button>

            </div>

        `;

        peopleContainer.appendChild(card);

        animateBalance(
            document.getElementById(
                `balance-${person.id}`
            ),
            0,
            person.balance
        );
    });
}

/* ADD PERSON */
document.getElementById(
"addPersonBtn"
).onclick = () => {

    document.getElementById(
        "personModal"
    ).classList.add("active");
};

document.getElementById(
"savePersonBtn"
).onclick = () => {

    const name =
    document.getElementById(
        "newPersonName"
    ).value.trim();

    if(!name) return;

    peopleData.push({
        id:"p_"+Date.now(),
        name,
        balance:0,
        history:[]
    });

    save();

    closeAll();
};

/* OPEN TX */
window.openTx = function(id,type){

    const person =
    peopleData.find(
        p=>p.id===id
    );

    document.getElementById(
        "txId"
    ).value = id;

    document.getElementById(
        "txType"
    ).value = type;

    document.getElementById(
        "txTitle"
    ).innerText =
    type==="plus"
    ? `Add to ${person.name}`
    : `Deduct from ${person.name}`;

    document.getElementById(
        "txModal"
    ).classList.add("active");
};

/* SUBMIT TX */
document.getElementById(
"txSubmit"
).onclick = () => {

    const id =
    document.getElementById("txId")
    .value;

    const type =
    document.getElementById("txType")
    .value;

    const amount =
    parseFloat(
        document.getElementById(
            "txAmount"
        ).value
    );

    const reason =
    document.getElementById(
        "txReason"
    ).value;

    const password =
    document.getElementById(
        "txPass"
    ).value;

    if(
        password !==
        settings.adminPassword
    ) return;

    if(isNaN(amount) || amount <= 0)
        return;

    const person =
    peopleData.find(
        p=>p.id===id
    );

    undoStack[id] =
    undoStack[id] || [];

    redoStack[id] = [];

    undoStack[id].push({
        balance:person.balance
    });

    if(type==="plus"){
        person.balance += amount;
    } else {
        person.balance -= amount;
    }

    person.history.push({
        type,
        amount,
        reason,
        date:new Date()
        .toLocaleString()
    });

    save();

    closeAll();
};

/* HISTORY */
window.openHistory = function(id){

    const person =
    peopleData.find(
        p=>p.id===id
    );

    if(!person) return;

    document.getElementById(
        "historyTitle"
    ).innerText =
    `${person.name} History`;

    const historyList =
    document.getElementById(
        "historyList"
    );

    if(person.history.length === 0){

        historyList.innerHTML =
        `<p>No transactions yet.</p>`;

    } else {

        historyList.innerHTML =
        person.history
        .slice()
        .reverse()
        .map(item => `

            <div class="history-item ${
                item.type === 'plus'
                ? 'history-positive'
                : 'history-negative'
            }">

                <div>
                    <strong>${item.reason}</strong>
                    <br>
                    ${item.date}
                </div>

                <div>
                    ${item.type === 'plus' ? '+' : '-'}
                    $${Math.abs(item.amount).toFixed(2)}
                </div>

            </div>

        `).join("");
    }

    /* GRAPH */
    let running = 0;

    const labels = [];
    const values = [];

    person.history.forEach((tx,index)=>{

        if(tx.type === "plus"){
            running += tx.amount;
        } else {
            running -= tx.amount;
        }

        labels.push(`#${index+1}`);
        values.push(running);
    });

    const ctx =
    document.getElementById(
        "historyChart"
    );

    if(currentChart){
        currentChart.destroy();
    }

    currentChart =
    new Chart(ctx, {

        type:"line",

        data:{
            labels,
            datasets:[{
                label:"Balance History",
                data:values,
                tension:0.3
            }]
        },

        options:{
            responsive:true,
            plugins:{
                legend:{
                    labels:{
                        color:"white"
                    }
                }
            },
            scales:{
                x:{
                    ticks:{
                        color:"white"
                    }
                },
                y:{
                    ticks:{
                        color:"white"
                    }
                }
            }
        }

    });

    document.getElementById(
        "historyModal"
    ).classList.add("active");
};

/* UNDO */
window.undo = function(id){

    const person =
    peopleData.find(
        p=>p.id===id
    );

    const stack =
    undoStack[id];

    if(!stack || !stack.length)
        return;

    redoStack[id] =
    redoStack[id] || [];

    redoStack[id].push({
        balance:person.balance
    });

    const last =
    stack.pop();

    person.balance =
    last.balance;

    save();
};

/* REDO */
window.redo = function(id){

    const person =
    peopleData.find(
        p=>p.id===id
    );

    const stack =
    redoStack[id];

    if(!stack || !stack.length)
        return;

    undoStack[id].push({
        balance:person.balance
    });

    const last =
    stack.pop();

    person.balance =
    last.balance;

    save();
};

/* DELETE */
window.promptDelete = function(id){

    const person =
    peopleData.find(
        p=>p.id===id
    );

    deleteTarget = id;

    document.getElementById(
        "deleteText"
    ).innerText =
    `Delete ${person.name}?`;

    document.getElementById(
        "deleteModal"
    ).classList.add("active");
};

document.getElementById(
"confirmDeleteBtn"
).onclick = () => {

    peopleData =
    peopleData.filter(
        p=>p.id!==deleteTarget
    );

    delete undoStack[deleteTarget];
    delete redoStack[deleteTarget];

    save();

    closeAll();
};

/* LIVE SEARCH */
document.getElementById(
"searchInput"
).addEventListener(
"input",
render
);

/* LIVE SORT */
document.getElementById(
"sortSelect"
).addEventListener(
"change",
render
);

/* START */
render();
