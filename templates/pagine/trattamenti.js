let serviziDb
let serviziDom
let categorieDb
let categorieDom
let membriDb
document.addEventListener("DOMContentLoaded", function () {
    aggiungiInformazioni()
});

function aggiungiInformazioni() {
     fetch('/wp-json/gestionale/v1/admin/servizi/?_wpnonce=' + nonce)
         .then(response => response.json())
         .then(data => mostra(data))
         .catch((error) => console.error('Error:', error));
    function mostra(data) {
        serviziDb = data.servizi
        categorieDb = data.categorie
        utentiDb = data.utenti
        const serviziElement = document.getElementById('servizi');
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < serviziDb.length; i++) {
            const p = document.createElement('p');
            p.id = serviziDb[i].id;
            p.textContent = serviziDb[i].nome;
            fragment.appendChild(p);
        }
        serviziElement.appendChild(fragment);
        serviziDom = document.querySelectorAll("#servizi p");
        mostraCategorie()
        mostraUtenti()
        gestisciEventi()

    }
    function mostraCategorie() {
        const categorieElement = document.getElementById('categorie');
        const fragment = document.createDocumentFragment();
        const optionFragment = document.createDocumentFragment();
        for (let i = 0; i < categorieDb.length; i++) {
            const p = document.createElement('p');
            p.id = categorieDb[i].id;
            p.textContent = categorieDb[i].nome;
            fragment.appendChild(p);
            const option = document.createElement('option');
            option.value = categorieDb[i].id;
            option.textContent = categorieDb[i].nome;
            optionFragment.appendChild(option);
        }
        categorieElement.appendChild(fragment);
        document.querySelector("#categoria-select").appendChild(optionFragment);
        categorieDom = document.querySelectorAll("#categorie p");
    }
    function mostraUtenti(){
        const utentiElement = document.getElementById('membri');
        const template = document.querySelector("#membri > div:nth-child(2)")
        const ids = (id) =>{
            template.querySelector("input").id = id
            template.querySelector("label").htmlFor = id
        }
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < utentiDb.length; i++) {
            template.querySelector("input").value = utentiDb[i].id
            template.querySelector("label").for = utentiDb[i].id
            template.querySelector("label").innerText = utentiDb[i].display_name
            ids("membro" + utentiDb[i].id)
            fragment.appendChild(template.cloneNode(true));
        }
        template.remove()
        utentiElement.appendChild(fragment);
    }
    
}
function ricercaServizi() {
    document.querySelector("#ricerca").addEventListener("input", function () {
        const ricerca = this.value.toLowerCase();
        for (let i = 0; i < serviziDom.length; i++) {
            const nome = serviziDom[i].textContent.toLowerCase();
            if (nome.includes(ricerca)) {
                serviziDom[i].style.display = "block";
            } else {
                serviziDom[i].style.display = "none";
            }
        }
    })
}
function ricercaCategorie() {
    document.querySelector("#ricerca-categorie").addEventListener("input", function () {
        const ricerca = this.value.toLowerCase();
        for (let i = 0; i < categorieDom.length; i++) {
            
            const nome = categorieDom[i].textContent.toLowerCase();
            if (nome.includes(ricerca)) {
                categorieDom[i].style.display = "block";
            } else {
                categorieDom[i].style.display = "none";
            }
        }
    })
}
function gestisciEventi() {
    ricercaServizi()
    ricercaCategorie()
    const formCategorie = document.getElementById("categoria-form");
    const formServizi = document.querySelector("#trattamento");
    formServizi.nomeServizio = document.getElementById('nome-servizio');
    formServizi.categoriaSelect = document.getElementById('categoria-select');
    function displayFormCategorie(){
        formCategorie.style.display = "block";
        formServizi.style.display = "none";
        document.querySelector("#seleziona").style.display = "none";
    }
    function displayFormServizi(){
        formCategorie.style.display = "none";
        formServizi.style.display = "block";
        document.querySelector("#seleziona").style.display = "none";
    }
    document.querySelector("#create-categoria").addEventListener("click", () => {
        displayFormCategorie()
        formCategorie.nomeCategoria.value = "";
        formCategorie.type = "create";
        document.querySelector("#categoria-form button").innerText = "Crea categoria";
    })
    document.querySelectorAll("#categorie p").forEach(categoria => {
        categoria.addEventListener("click", function () {
            displayFormCategorie()
            formCategorie.type = "update";
            formCategorie.nomeCategoria.value = categoria.textContent;
            formCategorie.categoriaId = this.id;
            document.querySelector("#categoria-form button").innerText = "Aggiorna categoria";
        })
    })

    document.querySelector("#create").addEventListener("click", function () {
        displayFormServizi()
        formServizi.type = "create";
        formServizi.nomeServizio.value = "";
        formServizi.id_servizio = "";
        formServizi.categoriaSelect.querySelector(`option`).selected = true;
        formServizi.prezzo.value = "0";
        formServizi.querySelectorAll("#membri input").forEach(input => {
            input.checked = false;
        })
        formServizi.descrizione.value = "";
        document.querySelector("#trattamento button").innerText = "Crea servizio";
    })
    document.querySelectorAll("#servizi p").forEach(elemento => {
        elemento.addEventListener("click", function () {
            displayFormServizi()
            const servizio = serviziDb.find(servizio => servizio.id === this.id);
            formServizi.type = "update";
            formServizi.nomeServizio.value = servizio.nome;
            formServizi.id_servizio = this.id;
            formServizi.categoriaSelect.querySelector(`option[value="${servizio.id_categoria}"]`).selected = true;
            formServizi.prezzo.value = servizio.prezzo;

            const membri= servizio.id_membri.split(',');
            formServizi.querySelectorAll("#membri input").forEach(input => {
                input.checked = false;
            })
            membri.forEach(membro => {
                formServizi.querySelector(`input[value="${membro}"]`).checked = true;
            })
            formServizi.querySelector(`#durata option[value='${servizio.tempo}']`).selected = true;
            formServizi.descrizione.value = servizio.descrizione;
            document.querySelector("#trattamento button").innerText = "Aggiorna servizio";
        })
    })
    document.querySelector("#elimina-servizio").addEventListener("click", function (e) {
        if (formServizi.id_servizio == null) {
            alert("Seleziona un servizio da eliminare");
            return
        }
        if (!confirm("Sei sicuro di voler eliminare questo prodotto? Verranno eliminati i relativi appuntamenti")) {
            return;
        }
        const servizio = {
            id: formServizi.id_servizio,
        }
        fetch("/wp-json/gestionale/v1/admin/servizi/", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                type: "delete",
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(servizio),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + data);
                    return;
                }
                location.reload();
            })
            .catch((error) => {
                alert("Error:", error);
            });
    })
    submitFormCategorie(formCategorie)
    submitFormServizi(formServizi)
}
function submitFormServizi(form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (confirm("Sei sicuro di voler eseguire questa operazione?")) {
            create()
        }
    })
    function create(){
        const servizio = {
            nome: form.nomeServizio.value,
            id_categoria: form.categoriaSelect.value,
            prezzo: form.prezzo.value,
            tempo: form.durata.options[form.durata.selectedIndex].value,
            id_membri: Array.from(form.querySelectorAll("#membri input:checked")).map(input => input.value),
            descrizione: form.descrizione.value,
            id: form.id_servizio
        };
        console.log(form.type)
        fetch("/wp-json/gestionale/v1/admin/servizi/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: form.type,
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(servizio),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + data);
                    return;
                }
                location.reload();
            })
            .catch((error) => {
                alert("Error:", error);
            });
    }
}
function submitFormCategorie(form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (confirm("Sei sicuro di voler eseguire questa operazione?")) {
            create()
        }
    })
    
    function create() {
        const categoria = {
            nome: form.nomeCategoria.value,
            id: form.categoriaId
        };
        fetch("/wp-json/gestionale/v1/admin/categorie/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: form.type,
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(categoria),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + data);
                    return;
                }
                location.reload();
            })
            .catch((error) => {
                alert("Error:", error);
            });
    }
}
function mostraServizi() {
    document.querySelector(".servizi").style.display = "block";
    document.querySelector("#servizi-nav").classList.add("active");
    document.querySelector("#categorie-nav").classList.remove("active");
    document.querySelector(".categorie").style.display = "none";
}
function mostraCategorie() {
    document.querySelectorAll(".servizi").forEach(servizio => {
        servizio.style.display = "none";
    })
    document.querySelector("#servizi-nav").classList.remove("active");
    document.querySelector("#categorie-nav").classList.add("active");
    document.querySelector(".categorie").style.display = "block";
}