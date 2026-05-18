const VERSION = "1.1.9";

const ADMIN_PASSWORD = "admin123";

let peopleData =
JSON.parse(localStorage.getItem("creditData")) || [];

let settings =
JSON.parse(localStorage.getItem("settings")) || {
    theme:"blue"
};

let undoStack = {};
let redoStack = {};

/* UPDATE LOG */
const LOG = [

    {
        version:"1.1.0",
        changes:[
            "Base system"
        ]
    },

    {
        version:"1.1.3",
        changes:[
            "Undo system",
            "Avatars"
        ]
    },

    {
        version:"1.1.6",
        changes:[
            "Avatar upload",
            "Theme fixes",
            "Changelog"
        ]
    },

    {
        version:"1.1.7",
        changes:[
            "Smooth animations",
            "Button redesign"
        ]
    },

    {
        version:"1.1.8",
        changes:[
            "UI stability fixes",
            "Render rewrite"
        ]
    },

    {
        version:"1.1.9",
        changes:[
            "Smooth balance rolling",
            "Custom themes",
            "Theme persistence"
        ]
    }

];

/* ELEMENTS */
const peopleContainer =
document.getElementById("peopleContainer");

const versionText =
document.getElementById("versionText");

versionText.innerText = VERSION;

/* THEME */
document.body.className = settings.theme;

const themeSelect =
document.getElementById("themeSelect");

themeSelect.value = settings.theme;

themeSelect.onchange = () => {

    settings.theme = themeSelect.value;

    document.body.className =
    settings.theme;

    localStorage.setItem(
        "settings",
        JSON.stringify(settings)
    );
};

/* SAVE */
function save(){

    localStorage.setItem(
        "creditData",
        JSON.stringify(peopleData)
    );

    render();
}

/* CLOSE MODALS */
window.closeAll = function(){

    document.querySelectorAll(".modal")
    .forEach(m => {
        m.classList.remove("active");
    });
};

/* CHANGELOG */
window.openChangelog = function(){

    const modal =
    document.getElementById("changelogModal");

    const text =
    document.getElementById("changelogText");

    text.innerHTML = LOG
    .slice()
    .reverse()
    .map(log => `
        <div style="margin-bottom:15px">
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

    modal.classList.add("active");
};

/* ANIMATE BALANCE */
function animateBalance(el,start,end){

    let startTime = null;
    const duration = 500;

    function update(time){

        if(!startTime)
            startTime = time;

        const progress =
        Math.min(
            (time-startTime)/duration,
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
    document.getElementById("searchInput")
    .value
    .toLowerCase();

    const sort =
    document.getElementById("sortSelect")
    .value;

    if(search){

        filtered = filtered.filter(p =>
            p.name
            .toLowerCase()
            .includes(search)
        );
    }

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

            <div class="balance"
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
                onclick="undo('${person.id}')">
                    Undo
                </button>

                <button
                onclick="redo('${person.id}')">
                    Redo
                </button>

            </div>
        `;

        peopleContainer.appendChild(card);

        const balanceEl =
        document.getElementById(
            `balance-${person.id}`
        );

        animateBalance(
            balanceEl,
            0,
            person.balance
        );
    });
}

/* ADD PERSON */
document.getElementById("addPersonBtn")
.onclick = () => {

    document.getElementById(
        "personModal"
    ).classList.add("active");
};

document.getElementById("savePersonBtn")
.onclick = () => {

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

    document.getElementById("txId")
    .value = id;

    document.getElementById("txType")
    .value = type;

    document.getElementById("txTitle")
    .innerText =
        type==="plus"
        ? `Add to ${person.name}`
        : `Deduct from ${person.name}`;

    document.getElementById("txModal")
    .classList.add("active");
};

/* SUBMIT TX */
document.getElementById("txSubmit")
.onclick = () => {

    const id =
    document.getElementById("txId")
    .value;

    const type =
    document.getElementById("txType")
    .value;

    const amount =
    parseFloat(
        document.getElementById("txAmount")
        .value
    );

    const reason =
    document.getElementById("txReason")
    .value;

    const pass =
    document.getElementById("txPass")
    .value;

    if(pass !== ADMIN_PASSWORD)
        return;

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
        reason
    });

    save();
    closeAll();
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

/* SEARCH + SORT */
document.getElementById("searchInput")
.oninput = render;

document.getElementById("sortSelect")
.onchange = render;

/* START */
render();
