const VERSION = "1.1.6";
const ADMIN_PASSWORD = "admin123";

let peopleData = JSON.parse(localStorage.getItem("creditData")) || [];
let settings = JSON.parse(localStorage.getItem("settings")) || {
    dark: true
};

let deleteTarget = null;

const peopleContainer = document.getElementById("peopleContainer");
const versionText = document.getElementById("versionText");

versionText.innerText = VERSION;

/* ---------------- SAVE ---------------- */

function save(){
    localStorage.setItem("creditData", JSON.stringify(peopleData));
    localStorage.setItem("settings", JSON.stringify(settings));
    render();
}

/* ---------------- MODALS FIX ---------------- */

function closeAllModals(){
    document.querySelectorAll(".modal")
        .forEach(m => m.classList.remove("active"));
}

/* ---------------- THEME FIX ---------------- */

document.getElementById("themeBtn").onclick = () => {
    settings.dark = !settings.dark;
    document.body.className = settings.dark ? "dark" : "light";
    save();
};

/* apply theme on load */
document.body.className = settings.dark ? "dark" : "light";

/* ---------------- AVATAR UPLOAD ---------------- */

window.uploadAvatar = function(id){

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            const person = peopleData.find(p => p.id === id);
            person.avatar = reader.result;
            save();
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* ---------------- RENDER ---------------- */

function render(){

    peopleContainer.innerHTML = "";

    peopleData.forEach(p => {

        const avatarHTML = p.avatar
            ? `<img src="${p.avatar}">`
            : p.name[0].toUpperCase();

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <div style="display:flex;gap:10px;align-items:center">

                <div class="avatar"
                    onclick="uploadAvatar('${p.id}')">
                    ${avatarHTML}
                </div>

                <h3>${p.name}</h3>

            </div>

            <p>Balance: ${p.balance < 0 ? "-$" + Math.abs(p.balance) : "$" + p.balance}</p>

            <button onclick="openTx('${p.id}','plus')">Add</button>
            <button onclick="openTx('${p.id}','minus')">Deduct</button>

            <button onclick="undo('${p.id}')">Undo</button>
            <button onclick="redo('${p.id}')">Redo</button>
        `;

        peopleContainer.appendChild(card);
    });
}

/* ---------------- CHANGELOG ---------------- */

window.openChangelog = function(){

    document.getElementById("changelogModal")
        .classList.add("active");

    document.getElementById("changelogText").innerHTML = `
        <h3>v1.1.6</h3>
        <ul>
            <li>Fixed cancel buttons</li>
            <li>Fixed theme toggle</li>
            <li>Added avatar upload</li>
            <li>Added changelog system</li>
        </ul>
    `;
};

/* ---------------- INIT ---------------- */

render();
