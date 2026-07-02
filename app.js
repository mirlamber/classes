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
            setTimeout(() => {
            div.scrollIntoView({
                behavior:"smooth",
                block:"center"
                });
            },50);

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
                    ${student.tags.includes("sport") ? "🏃" : ""}
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
        const fillesPool =students.filter(s => s.classe === "pool" && s.sexe === "F").length;
        const garconsPool =students.filter(s => s.classe === "pool" && s.sexe === "G").length;

        /* =========================
           CAS 1 : POOL (LEGEND UI)
        ========================= */
        if (classe === "pool") {
            const total = students.length;

            const nbPool =
                students.filter(
                    s => s.classe === "pool"
                ).length;

            const el =
                document.getElementById(
                    "pool-count"
                );

            if (el) {
                el.textContent =
                    ` (${nbPool}/${total}) • 👧 ${fillesPool} • 👦 ${garconsPool}`;
            }


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
        const titre =
        document.getElementById(
            "title-" + classe
        );

        if(titre){

            titre.textContent =
            `Classe ${getTargetLevel()}${classe} - ${data.length} élèves`;

        }
        cible.innerHTML = `
            <div class="stats-line">

                

                <div class="stats-second">
                    <span>${filles}F / ${garcons}G</span>

                    <span class="tags">

                        <span class="tag">🟡 <span class="badge">${difficulte}</span></span>
                        <span class="tag">🔴 <span class="badge">${comportement}</span></span>
                        <span class="tag">🔵 <span class="badge">${accompagnement}</span></span>
                        <span class="tag">🟢 <span class="badge">${excellent}</span></span>
                        <span class="tag">🟣 <span class="badge">${allemand}</span></span>
                        <span class="tag">🟤 <span class="badge">${latin}</span></span>
                        <span class="tag">🏃 <span class="badge">${sport}</span></span>
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

function getExportFileName() {
    const niveau = getTargetLevel();
    
    // 🗓️ Création de la date au format JJ-MM-AAAA
    const d = new Date();
    const dateStr = [
        String(d.getDate()).padStart(2, '0'),
        String(d.getMonth() + 1).padStart(2, '0'),
        d.getFullYear()
    ].join('-');
    
    return `Constitution_des_classes_de_${niveau}e_${dateStr}`;
}

function saveData(){
    const blob = new Blob([JSON.stringify(students, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    // Le nom contiendra maintenant la date grâce à getExportFileName()
    a.download = `${getExportFileName()}.json`;
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

//export pdf + csv

document
.getElementById("pdfBtn")
.addEventListener(
    "click",
    exportPDF
);

function exportPDF(){

    const niveau = getTargetLevel();
    let contenu = "";

    classes.forEach(classe => {

        // 1. Filtrage et tri des élèves
        const elevesClasse = students
            .filter(s => s.classe === classe)
            .sort((a,b) => {
                const nom = a.nom.localeCompare(b.nom, "fr", {sensitivity:"base"});
                if(nom !== 0) return nom;
                return a.prenom.localeCompare(b.prenom, "fr", {sensitivity:"base"});
            });

        // 2. Calcul des statistiques de la classe (comme dans votre tableur)
        const filles = elevesClasse.filter(s => s.sexe === "F").length;
        const garcons = elevesClasse.filter(s => s.sexe === "G").length;

        // 3. Construction du HTML (Utilisation de tableaux plutôt que de listes)
        contenu += `
        <div class="classe-section">
            <h2>
                Classe ${niveau}${classe} 
                <span class="sous-titre">(${elevesClasse.length} élèves — ${filles}F / ${garcons}G)</span>
            </h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 30%">Nom</th>
                        <th style="width: 25%">Prénom</th>
                        <th style="width: 20%">Classe d'origine</th>
                        <th style="width: 25%">Options</th>
                    </tr>
                </thead>
                <tbody>
        `;

        elevesClasse.forEach(student => {
            
            // On récupère les mêmes options que pour l'export ODS
            const lv2 = student.tags.includes("allemand") ? "Allemand" : "Espagnol";
            const options = [
                student.tags.includes("latin") ? "Latin" : "",
                student.tags.includes("sport") ? "Sport" : "",
                student.tags.includes("lce") ? "LCE" : ""
            ].filter(Boolean).join(" - ");

            contenu += `
                    <tr>
                        <td><strong>${student.nom}</strong></td>
                        <td>${student.prenom}</td>
                        <td>${student.classeOrigine}</td>
                        <td>${lv2} ${options ? ' - ' + options : ''}</td>
                    </tr>
            `;
        });

        contenu += `
                </tbody>
            </table>
        </div>
        `;
    });

    const fenetre = window.open("", "_blank");
    const nomFichier = getExportFileName();

    fenetre.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${nomFichier}</title>
            <style>
                /* Style de base pour l'écran et l'impression */
                body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    color: #333;
                    padding: 20px; 
                }
                h1 { 
                    color: #1e3a8a; 
                    border-bottom: 2px solid #e2e8f0; 
                    padding-bottom: 10px;
                }
                h2 { 
                    color: #2563eb; 
                    font-size: 1.3em;
                    margin-top: 30px;
                    border-left: 4px solid #2563eb;
                    padding-left: 10px;
                }
                .sous-titre {
                    font-size: 0.8em;
                    color: #64748b;
                    font-weight: normal;
                }
                
                /* Style des tableaux */
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 10px;
                }
                th, td { 
                    border-bottom: 1px solid #cbd5e1; 
                    padding: 8px 12px; 
                    text-align: left; 
                }
                th { 
                    background-color: #f1f5f9; 
                    font-weight: bold; 
                }
                tr:nth-child(even) { 
                    background-color: #f8fafc; 
                }

                /* 🧠 Règles spécifiques pour une impression parfaite en PDF */
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 15mm; 
                    }
                    body {
                        padding: 0;
                    }
                    /* On force le tableau à répéter les en-têtes (th) s'il change de page */
                    thead { display: table-header-group; }
                    
                    /* On évite de couper une ligne d'élève en deux sur deux pages */
                    tr { page-break-inside: avoid; }
                    
                    /* On évite d'avoir le H2 tout en bas d'une page avec le tableau sur l'autre */
                    h2 { page-break-after: avoid; }
                    
                    /* Optionnel: forcer les couleurs d'arrière-plan à s'imprimer (dépends des navigateurs) */
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <h1>${nomFichier.replace(/_/g, " ")}</h1>
            ${contenu}
        </body>
        </html>
    `);

    fenetre.document.close();
    
    // On laisse le temps de charger le DOM avant de lancer l'impression
    setTimeout(() => {
        fenetre.focus();
        fenetre.print();
        // fenetre.close(); 
    }, 250);
}

document.getElementById("csvBtn").addEventListener("click", exportODS);

function exportODS(){

    const wb = XLSX.utils.book_new();
    const niveau = getTargetLevel();

    // =========================
    // TRI GLOBAL
    // =========================
    const sortedAll = students.slice().sort((a,b)=>{
        const n = a.nom.localeCompare(b.nom,"fr",{sensitivity:"base"});
        return n !== 0 ? n : a.prenom.localeCompare(b.prenom,"fr",{sensitivity:"base"});
    });

    // =========================
    // FEUILLE 1 : TOUTES LES CLASSES
    // =========================
    const total = students.length;
    const filles = students.filter(s => s.sexe === "F").length;
    const garcons = students.filter(s => s.sexe === "G").length;

    // 1. Création des lignes d'en-tête (stats + ligne vide)
    const statsAllRows = [
        [`Effectif total`, total, `${filles}F / ${garcons}G`],
        [] // Ligne vide
    ];
    
    // Initialisation de la feuille avec ces deux lignes
    const wsAll = XLSX.utils.aoa_to_sheet(statsAllRows);

    // 2. Préparation des données JSON des élèves
    const allSheetData = [];
    sortedAll.forEach(s => {
        const lv2 = s.tags.includes("allemand") ? "Allemand" : "Espagnol";
        const options = [
            s.tags.includes("latin") ? "Latin" : "",
            s.tags.includes("sport") ? "Sport" : "",
            s.tags.includes("lce") ? "LCE" : ""
        ].filter(Boolean).join(" - ");

        allSheetData.push({
            Nom: s.nom,
            Prénom: s.prenom,
            Classe: niveau + s.classe,
            LV2: lv2,
            Options: options,
            "Classe d'origine": s.classeOrigine
        });
    });

    // 3. Ajout des données JSON à partir de la ligne 3 (cellule A3)
    // Cela générera automatiquement "Nom", "Prénom", etc., sur la ligne 3.
    XLSX.utils.sheet_add_json(wsAll, allSheetData, { origin: "A3" });

    autoColumns(wsAll);
    XLSX.utils.book_append_sheet(wb, wsAll, "Toutes les classes");

    // =========================
    // FEUILLES PAR CLASSE
    // =========================
    classes.forEach(classe => {

        const data = students
            .filter(s => s.classe === classe)
            .sort((a,b)=>{
                const n = a.nom.localeCompare(b.nom,"fr",{sensitivity:"base"});
                return n !== 0 ? n : a.prenom.localeCompare(b.prenom,"fr",{sensitivity:"base"});
            });

        const fillesClass = data.filter(s => s.sexe === "F").length;
        const garconsClass = data.filter(s => s.sexe === "G").length;

        // 1. Stats de la classe en haut
        const statsClassRows = [
            [`Classe ${niveau}${classe}`, `${data.length} élèves`, `${fillesClass}F / ${garconsClass}G`],
            [] // Ligne vide
        ];

        const ws = XLSX.utils.aoa_to_sheet(statsClassRows);

        // 2. Données des élèves de la classe
        const sheetData = [];
        data.forEach(s => {
            const lv2 = s.tags.includes("allemand") ? "Allemand" : "Espagnol";
            const options = [
                s.tags.includes("latin") ? "Latin" : "",
                s.tags.includes("sport") ? "Sport" : "",
                s.tags.includes("lce") ? "LCE" : ""
            ].filter(Boolean).join(" - ");

            sheetData.push({
                Nom: s.nom,
                Prénom: s.prenom,
                Classe: niveau + classe,
                LV2: lv2,
                Options: options,
                "Classe d'origine": s.classeOrigine
            });
        });

        // 3. Ajout à partir de la cellule A3
        XLSX.utils.sheet_add_json(ws, sheetData, { origin: "A3" });

        autoColumns(ws);
        XLSX.utils.book_append_sheet(wb, ws, niveau + classe);
    });

    const filename = `${getExportFileName()}.ods`;
    XLSX.writeFile(wb, filename, { bookType: "ods" });
}

function autoColumns(ws){
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const cols = [];
    for(let C = range.s.c; C <= range.e.c; C++){
        let max = 10;
        for(let R = range.s.r; R <= range.e.r; R++){
            const cell = ws[XLSX.utils.encode_cell({r:R, c:C})];
            if(cell && cell.v){
                max = Math.max(max, String(cell.v).length + 2);
            }
        }
        cols.push({ wch: max });
    }
    ws["!cols"] = cols;
}

////// construction des classes cibles

function getTargetLevel(){

    // Aucun élève importé : pas de préfixe
    if(students.length === 0)
        return "";

    const premiereClasse =
    students.find(
        s => s.classeOrigine !== "NVX"
    )?.classeOrigine;

    if(!premiereClasse)
        return "";

    const match =
    premiereClasse.match(/^(\d+)/);

    // Pas de chiffre : classes de primaire → on constitue des 6e
    if(!match)
        return "6";

    return String(Number(match[1]) - 1);
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
            <h2 id="title-${classe}">
                Classe ${getTargetLevel()}${classe}
            </h2>

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
