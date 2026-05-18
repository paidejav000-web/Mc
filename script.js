function animateValue(el, start, end){

    let current = start;
    const steps = 20;
    const diff = (end - start) / steps;

    let i = 0;

    const interval = setInterval(() => {

        current += diff;
        i++;

        if(i >= steps){
            current = end;
            clearInterval(interval);
        }

        el.innerText =
            current < 0
                ? "-$" + Math.abs(current).toFixed(2)
                : "$" + current.toFixed(2);

    }, 15);
}

/* RENDER */
function render(){

    peopleContainer.innerHTML = "";

    peopleData.forEach(p => {

        const card = document.createElement("div");
        card.className = "card";

        const avatar = p.avatar
            ? `<img src="${p.avatar}">`
            : p.name[0].toUpperCase();

        const balance =
            p.balance < 0
                ? "-$" + Math.abs(p.balance).toFixed(2)
                : "$" + p.balance.toFixed(2);

        card.innerHTML = `
            <div style="display:flex;gap:10px;align-items:center">
                <div class="avatar" onclick="uploadAvatar('${p.id}')">
                    ${avatar}
                </div>
                <h3>${p.name}</h3>
            </div>

            <div class="balance-pop" id="bal-${p.id}">
                ${balance}
            </div>

            <div class="card-actions">

                <button class="primary"
                onclick="openTx('${p.id}','plus')">
                    + Add
                </button>

                <button class="secondary"
                onclick="openTx('${p.id}','minus')">
                    - Deduct
                </button>

                <button class="secondary"
                onclick="undo('${p.id}')">
                    Undo
                </button>

                <button class="secondary"
                onclick="redo('${p.id}')">
                    Redo
                </button>

            </div>
        `;

        peopleContainer.appendChild(card);
    });
}
