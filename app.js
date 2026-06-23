let currentStudentId = null;

const NB_LIGNES = 30;

let students = [];

let searchText = "";

let classes = [
    "A",
    "B",
    "C",
    "D"
];
const classeOrigine =
    document.getElementById("newClasseOrigine").value;

document
.getElementById("mergeBtn")
.addEventListener(
    "click",
    () => {
        document
        .getElementById("mergeFiles")
        .click();
    }
);

document
.getElementById("mergeFiles")
.addEventListener(
    "change",
     handleMergeFiles
);

async function handleMergeFiles(event) {

    const files = [...event.target.files];
    if (files.length === 0) return;

    const merged = new Map();

    for (const file of files) {

        const text = await file.text();
        const data = JSON.parse(text);

        data.forEach(student => {

            const key = buildKey(student);

            if (!merged.has(key)) {

                merged.set(key, {
                    ...student,
                    tags: [...(student.tags || [])]
                });

            } else {

                const existing = merged.get(key);

                existing.tags = mergeTags(existing.tags, student.tags);
            }
        });
    }

    students = [...merged.values()];

    buildPoolColumns();
    updateClasseOrigineSelect();
    attachPoolEvents();
    render();

    alert(`${files.length} fichiers fusionnés`);
}

function buildKey(student) {
    return `${student.nom}|${student.prenom}|${student.sexe}`;
}

function mergeTags(tagsA = [], tagsB = []) {
    return [...new Set([...tagsA, ...tagsB])];
}

document.getElementById("fileBtn").addEventListener("click", () => {
    document.getElementById("loadFile").click();
});


function importCSV(){

    const text =
    document
    .getElementById("csvInput")
    .value
    .trim();

    if(!text) return;

    const lines =
    text.split("\n");

    students = [];

    lines.slice(1).forEach(
        (line,index)=>{

            const parts =
            line.split(",")
            .map(x=>x.trim());

            if(parts.length < 4) return;

            students.push({
                id: Date.now()+index,
                nom: parts[0],
                prenom: parts[1],
                sexe: parts[2].toUpperCase(),
                classeOrigine: parts[3],
                classe:"pool",
                colonne:null,
                ligne:null,
                tags:[]
            });

        }
    );

    buildPoolColumns();
    attachPoolEvents();
    render();
    console.log("poolBoard HTML =", document.getElementById("poolBoard").innerHTML);
    }

function buildPoolColumns(){

    const board =
    document.getElementById("poolBoard");

    if(!board) return;

    board.innerHTML = "";

    const classesOrigine = [
        ...new Set(
            students.map(s => s.classeOrigine)
        )
    ];

    

    classesOrigine.sort((a, b) => {
        if (a === "NVX") return 1;
        if (b === "NVX") return -1;
        return a.localeCompare(b);
    });

    classesOrigine.forEach(classe=>{

        const div =
        document.createElement("div");

        div.className =
        "pool-column";

        div.innerHTML = `
            <h3>${classe}</h3>

            <div
                class="pool-zone"
                id="pool-${classe}">
            </div>
        `;

        board.appendChild(div);

    });
    console.log("colonnes créées");
    console.log("zone A =", document.getElementById("pool-A"));
}

function render() {

    console.log("===== RENDER START =====");
    console.log("students count:", students.length);

    const poolBoard = document.getElementById("poolBoard");

    // 🔴 DEBUG: état DOM avant nettoyage
    console.log("DOM .student before cleanup:", document.querySelectorAll(".student").length);

    // ✅ 1. CLEAN SAFE GLOBAL (évite doublons fantômes)
    document.querySelectorAll(".student").forEach(el => el.remove());

    // ✅ 2. Reset des zones pool + cellules
    document.querySelectorAll(".pool-zone").forEach(zone => {
        zone.innerHTML = "";
    });

    document.querySelectorAll(".cell").forEach(cell => {
        cell.innerHTML = "";
    });

    // 🔵 DEBUG après nettoyage
    console.log("DOM .student after cleanup:", document.querySelectorAll(".student").length);

    // ✅ 3. Création des éléments élèves

    students.sort((a, b) => {

        const nomA =
        `${a.nom} ${a.prenom}`.toLowerCase();

        const nomB =
        `${b.nom} ${b.prenom}`.toLowerCase();

        return nomA.localeCompare(
            nomB,
            "fr",
            { sensitivity: "base" }
        );

    });

    students.forEach(student => {

        const div = document.createElement("div");
        div.className = "student";

        const nomComplet = (student.prenom + " " + student.nom).toLowerCase();

        // 🔍 SEARCH highlight
        if (searchText && nomComplet.includes(searchText)) {
            div.classList.add("highlight");
        }

        // 🎨 TAGS couleurs
        if (student.tags.includes("difficulte")) div.classList.add("yellow");
        if (student.tags.includes("comportement")) div.classList.add("red");
        if (student.tags.includes("accompagnement")) div.classList.add("blue");
        if (student.tags.includes("excellent")) div.classList.add("green");
        if (student.tags.includes("allemand")) div.classList.add("purple");
        if (student.tags.includes("latin")) div.classList.add("brown");
        if (student.tags.includes("sport")) div.classList.add("black");
        if(student.tags.includes("lce"))div.classList.add("orange");
        if(student.tags.includes("absent"))div.classList.add("grey");

        // 🧲 DRAG
        div.draggable = true;
        div.dataset.id = student.id;

        div.addEventListener("dragstart", e => {
            e.dataTransfer.setData("id", student.id);
        });

        // 🖱️ CONTEXT MENU
        div.addEventListener("contextmenu", e => {
            e.preventDefault();

            currentStudentId = student.id;

            const menu = document.getElementById("contextMenu");
            menu.style.left = e.pageX + "px";
            menu.style.top = e.pageY + "px";
            menu.style.display = "block";

            refreshContextMenu(student);
        });

        // 🧾 HTML
        div.innerHTML = `
            <div class="student-header">
                <span>
                    [${student.sexe}]
                    ${student.prenom}
                    ${student.nom}
                </span>

                <span class="badges">
                    ${student.tags.includes("difficulte") ? "🟡" : ""}
                    ${student.tags.includes("comportement") ? "🔴" : ""}
                    ${student.tags.includes("accompagnement") ? "🔵" : ""}
                    ${student.tags.includes("excellent") ? "🟢" : ""}
                    ${student.tags.includes("allemand") ? "🟣" : ""}
                    ${student.tags.includes("latin") ? "🟤" : ""}
                    ${student.tags.includes("sport") ? "⚫" : ""}
                    ${student.tags.includes("lce") ? "🟠" : ""}
                    ${student.tags.includes("absent") ? "🚫" : ""}
                </span>
            </div>
        `;

        // 📍 PLACEMENT
        if (student.classe === "pool") {

            const zone = document.getElementById("pool-" + student.classeOrigine);

            if (zone) {
                zone.appendChild(div);
            } else {
                console.warn("Zone pool introuvable:", student.classeOrigine);
            }

        } else {

            const cell = document.querySelector(
                `.cell[data-classe="${student.classe}"][data-colonne="${student.colonne}"][data-ligne="${student.ligne}"]`
            );

            if (cell) {
                cell.appendChild(div);
            } else {
                console.warn("Cellule introuvable:", student);
            }
        }
    });

    // 📊 STATS
    updateStats();

    // 🔵 DEBUG FINAL
    console.log("DOM .student after render:", document.querySelectorAll(".student").length);
    console.log("poolBoard children:", poolBoard?.children?.length);

    console.log("===== RENDER END =====");
}

document
.querySelectorAll(".cell")
.forEach(cell=>{

    cell.addEventListener(
        "dragover",
        e=>{
            e.preventDefault();
        }
    );

    cell.addEventListener(
        "drop",
        e=>{

            e.preventDefault();

            const id =
            Number(
                e.dataTransfer.getData("id")
            );

            const student =
            students.find(
                s=>s.id===id
            );

            if(!student) return;

            student.classe =
            cell.dataset.classe;

            student.colonne =
            Number(
                cell.dataset.colonne
            );

            student.ligne =
            Number(
                cell.dataset.ligne
            );
            

            render();

        }
    );

});

function attachPoolEvents(){

    document
    .querySelectorAll(".pool-zone")
    .forEach(zone=>{

        zone.addEventListener(
            "dragover",
            e=>e.preventDefault()
        );

        zone.addEventListener(
            "drop",
            e=>{

                e.preventDefault();

                const id =
                Number(
                    e.dataTransfer.getData("id")
                );

                const student =
                students.find(
                    s=>s.id===id
                );

                if(!student) return;

                student.classe =
                "pool";

                student.colonne =
                null;

                student.ligne =
                null;

                render();

            }
        );

    });

}

function refreshContextMenu(student){

    document
    .getElementById("ctx-difficulte")
    .checked =
    student.tags.includes(
        "difficulte"
    );

    document
    .getElementById("ctx-comportement")
    .checked =
    student.tags.includes(
        "comportement"
    );

    document
    .getElementById("ctx-accompagnement")
    .checked =
    student.tags.includes(
        "accompagnement"
    );

    document
    .getElementById("ctx-excellent")
    .checked =
    student.tags.includes(
        "excellent"
    );

    document
    .getElementById("ctx-allemand")
    .checked =
    student.tags.includes("allemand");

    document
    .getElementById("ctx-latin")
    .checked =
    student.tags.includes("latin");

    document
    .getElementById("ctx-sport")
    .checked =
    student.tags.includes("sport");

    document.getElementById("ctx-lce").checked =
    student.tags.includes("lce");

    document.getElementById("ctx-absent").checked =
    student.tags.includes("absent");
}

[
["ctx-difficulte","difficulte"],
["ctx-comportement","comportement"],
["ctx-accompagnement","accompagnement"],
["ctx-excellent","excellent"],
["ctx-allemand","allemand"],
["ctx-latin","latin"],
["ctx-sport","sport"],
["ctx-lfe","lce"],
["ctx-absent","absent"]

].forEach(([id,tag])=>{

    document
    .getElementById(id)
    .addEventListener(
        "change",
        ()=>{

            const student =
            students.find(
                s=>s.id===currentStudentId
            );

            if(!student) return;

            if(
                student.tags.includes(tag)
            ){

                student.tags =
                student.tags.filter(
                    t=>t!==tag
                );

            }else{

                student.tags.push(tag);

            }

            render();
        }
    );

});

document
.addEventListener(
    "click",
    ()=>{

        document
        .getElementById(
            "contextMenu"
        )
        .style.display="none";

    }
);

function updateStats(){

    ["pool", ...classes].forEach(classe => {

        const data = students.filter(s => s.classe === classe);

        const filles = data.filter(s => s.sexe === "F").length;
        const garcons = data.filter(s => s.sexe === "G").length;

        const difficulte = data.filter(s => s.tags.includes("difficulte")).length;
        const comportement = data.filter(s => s.tags.includes("comportement")).length;
        const accompagnement = data.filter(s => s.tags.includes("accompagnement")).length;
        const excellent = data.filter(s => s.tags.includes("excellent")).length;
        const allemand = data.filter(s => s.tags.includes("allemand")).length;
        const latin = data.filter(s => s.tags.includes("latin")).length;
        const sport = data.filter(s => s.tags.includes("sport")).length;
        const lce = data.filter(s => s.tags.includes("lce")).length;
        const absent = data.filter(s => s.tags.includes("absent")).length;


        /* =========================
           CAS 1 : POOL (LEGEND UI)
        ========================= */
        if (classe === "pool") {

            const setCount = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setCount("count-difficulte", difficulte);
            setCount("count-comportement", comportement);
            setCount("count-accompagnement", accompagnement);
            setCount("count-excellent", excellent);
            setCount("count-allemand", allemand);
            setCount("count-latin", latin);
            setCount("count-sport", sport);
            setCount("count-lce", lce);
            setCount("count-absent", absent);

            return;
        }


        /* =========================
           CAS 2 : CLASSES
        ========================= */
        const cible = document.getElementById("stats-" + classe);
        if (!cible) return;

        cible.innerHTML = `
            <div class="stats-line">

                <div>${data.length} élèves</div>

                <div class="stats-second">
                    <span>${filles}F / ${garcons}G</span>

                    <span class="tags">

                        <span class="tag">🟡 <span class="badge">${difficulte}</span></span>
                        <span class="tag">🔴 <span class="badge">${comportement}</span></span>
                        <span class="tag">🔵 <span class="badge">${accompagnement}</span></span>
                        <span class="tag">🟢 <span class="badge">${excellent}</span></span>
                        <span class="tag">🟣 <span class="badge">${allemand}</span></span>
                        <span class="tag">🟤 <span class="badge">${latin}</span></span>
                        <span class="tag">⚫ <span class="badge">${sport}</span></span>
                        <span class="tag">🟠 <span class="badge">${lce}</span></span>
                        <span class="tag">🚫 <span class="badge">${absent}</span></span>

                    </span>
                </div>

            </div>
        `;
    });
}

document
.getElementById("saveBtn")
.addEventListener(
    "click",
    saveData
);

function saveData(){

    const blob =
    new Blob(
        [
            JSON.stringify(
                students,
                null,
                2
            )
        ],
        {
            type:
            "application/json"
        }
    );

    const a =
    document.createElement("a");

    a.href =
    URL.createObjectURL(blob);

    a.download =
    "repartition.json";

    a.click();
}

document
.getElementById("loadFile")
.addEventListener(
    "change",
    loadData
);

function loadData(event){

    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = e => {

        students = JSON.parse(e.target.result);

        // 🔥 RECONSTRUIRE L’UI AVANT RENDER
        buildClasses();
        attachDropEvents();
        updateClasseOrigineSelect();
        buildPoolColumns();
        attachPoolEvents();

        // 🔥 IMPORTANT : recalcul placement visuel
        render();
    };

    reader.readAsText(file);
}

document
.getElementById("searchInput")
.addEventListener(
    "input",
    e=>{

        searchText =
        e.target.value
        .toLowerCase()
        .trim();


        render();

    }
);

document
.getElementById("pdfBtn")
.addEventListener(
    "click",
    exportPDF
);

function exportPDF(){

    let contenu = "";

    classes.forEach(classe=>{

        contenu += `
        <h2>Classe ${classe}</h2>
        <ul>
        `;

        students
        .filter(
            s=>s.classe===classe
        )
        .forEach(student=>{

            contenu += `
            <li>
                ${student.prenom}
                ${student.nom}
                (${student.sexe})
            </li>
            `;
        });

        contenu += `
        </ul>
        `;
    });

    const fenetre =
    window.open(
        "",
        "_blank"
    );

    fenetre.document.write(`
        <html>
        <head>
            <title>Répartition</title>
            <style>
                body{
                    font-family:Arial;
                    padding:20px;
                }

                h2{
                    margin-top:30px;
                }
            </style>
        </head>

        <body>

        <h1>
        Répartition des classes
        </h1>

        ${contenu}

        </body>
        </html>
    `);

    fenetre.document.close();

    fenetre.print();
}

function buildClasses(){

    const board =
    document.getElementById(
        "classesBoard"
    );

    board.innerHTML = "";

    classes.forEach(classe=>{

        const div =
        document.createElement("div");

        div.className =
        "column";

        div.innerHTML = `
            <h2>Classe ${classe}</h2>

            <div
                class="stats"
                id="stats-${classe}">
            </div>

            <div
                id="grid-${classe}"
                class="class-grid">
            </div>
        `;

        board.appendChild(div);

        const grid =
        div.querySelector(
            ".class-grid"
        );

        for(
            let ligne=1;
            ligne<=NB_LIGNES;
            ligne++
        ){

            for(
                let colonne=1;
                colonne<=2;
                colonne++
            ){

                const cell =
                document.createElement("div");

                cell.className =
                "cell";

                cell.dataset.classe =
                classe;

                cell.dataset.colonne =
                colonne;

                cell.dataset.ligne =
                ligne;

                grid.appendChild(
                    cell
                );

            }
        }

    });

}

document
.getElementById("buildBtn")
.addEventListener(
    "click",
    ()=>{
        generateClasses();
    }
);

function attachDropEvents(){

    document
    .querySelectorAll(".cell")
    .forEach(cell=>{

        cell.addEventListener(
            "dragover",
            e=>{
                e.preventDefault();
            }
        );

        cell.addEventListener(
            "drop",
            e=>{

                e.preventDefault();

                const id =
                Number(
                    e.dataTransfer.getData("id")
                );

                const student =
                students.find(
                    s=>s.id===id
                );

                if(!student) return;

                student.classe =
                cell.dataset.classe;

                student.colonne =
                Number(
                    cell.dataset.colonne
                );

                student.ligne =
                Number(
                    cell.dataset.ligne
                );

                render();

            }
        );

    });

}

document
.getElementById("addStudentBtn")
.addEventListener(
    "click",
    addStudent
);

function addStudent(){

    const nom =
    document
    .getElementById("newNom")
    .value
    .trim();

    const prenom =
    document
    .getElementById("newPrenom")
    .value
    .trim();

    const sexe =
    document
    .getElementById("newSexe")
    .value;

    if(!nom || !prenom){

        alert(
            "Nom et prénom obligatoires"
        );

        return;
    }

    students.push({

        id: Date.now(),

        nom,
        prenom,
        sexe,
        classeOrigine: document.getElementById("newClasseOrigine").value, // ou une valeur par défaut
        classe:"pool",

        colonne:null,
        ligne:null,

        tags:[]
    });

    document
    .getElementById("newNom")
    .value="";

    document
    .getElementById("newPrenom")
    .value="";


    buildPoolColumns();
    updateClasseOrigineSelect();
    attachPoolEvents();
    render();
}

function updateClasseOrigineSelect() {

    const select =
    document.getElementById("newClasseOrigine");

    if(!select) return;

    select.innerHTML = "";

    const classesOrigine = [
        ...new Set(
            students.map(s => s.classeOrigine)
        )
    ];

    classesOrigine.sort();

    classesOrigine.forEach(classe => {

        const option =
        document.createElement("option");

        option.value = classe;
        option.textContent = classe;

        select.appendChild(option);

    });

    const nvx =
    document.createElement("option");

    nvx.value = "NVX";
    nvx.textContent = "NVX";

    select.appendChild(nvx);
}

const trash = document.getElementById("trash");

trash.addEventListener("dragover", e => {
    e.preventDefault();
});

trash.addEventListener("drop", e => {

    e.preventDefault();

    const id = Number(e.dataTransfer.getData("id"));

    const index = students.findIndex(s => s.id === id);

    if(index === -1) return;

    if(confirm("Supprimer cet élève ?")) {
        students.splice(index, 1);

        render();
    }

});

trash.addEventListener("dragover", e => {
    e.preventDefault();
    trash.classList.add("dragover");
});

trash.addEventListener("dragleave", () => {
    trash.classList.remove("dragover");
});

trash.addEventListener("drop", e => {
    trash.classList.remove("dragover");
});




function generateClasses(){

    const nb =
    Number(
        document
        .getElementById(
            "nbClasses"
        )
        .value
    );

    // Met à jour la variable CSS
    document.documentElement
    .style
    .setProperty(
        "--nb-classes",
        nb
    );

    // Génère les noms de classes
    classes = [];

    for(
        let i=0;
        i<nb;
        i++
    ){

        classes.push(
            String.fromCharCode(
                65 + i
            )
        );

    }

    buildClasses();

    attachDropEvents();

    render();

}

window.addEventListener("DOMContentLoaded", () => {

    const adminBtn = document.getElementById("adminBtn");
    const adminModal = document.getElementById("adminModal");
    const closeBtn = document.getElementById("adminCloseBtn");
    const importBtn = document.getElementById("adminImportBtn");

    if(!adminBtn || !adminModal || !closeBtn || !importBtn) return;

    // ouvrir
    adminBtn.addEventListener("click", () => {
        adminModal.style.display = "flex";
    });

    // fermer
    closeBtn.addEventListener("click", () => {
        adminModal.style.display = "none";
    });

    // import identique à ton CSV actuel
    importBtn.addEventListener("click", () => {

        const text = document.getElementById("adminInput").value.trim();
        if(!text) return;

        const lines = text.split("\n");

        students = [];

        lines.forEach((line, index) => {

            const parts = line.split(/\t|,/).map(x => x.trim());
            if(parts.length < 4) return;
            console.log(parts);
            students.push({
                id: Date.now() + index,
                nom: parts[0],
                prenom: parts[1],
                sexe: parts[2].toUpperCase(),
                classeOrigine: parts[3],
                classe: "pool",
                colonne: null,
                ligne: null,
                tags: []
            });

        });


        buildPoolColumns();
        updateClasseOrigineSelect();
        attachPoolEvents();
        render();
        adminModal.style.display = "none";
    });

});
generateClasses();
