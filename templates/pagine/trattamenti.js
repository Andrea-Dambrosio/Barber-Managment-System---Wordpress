let services;
let checkTeamMembers;

const promise = fetchTheData()

document.addEventListener("DOMContentLoaded", async function () {
    const main = new Main();
    const data = await promise
    console.log(data)
    main.load(data);
    checkTeamMembers.domElements = document.querySelectorAll("#membri input");
    reload = main.reload;
});

async function fetchTheData(team = "true") {
        try {
            const response = await fetch(
                "/wp-json/gestionale/v1/admin/servizi/?_wpnonce=" + nonce,
                {
                    headers: {
                        "Content-Type": "application/json",
                        team: team,
                    },
                }
            );
            return await response.json();
        } catch (e) {
            alert("Error: " + e);
            console.error(e);
        }
    }

class Main {
    loadContent;
    sidebarResearch;
    manageClientEvents;
    categories;

    constructor() {
        this.loadContent = new LoadContent();
        this.sidebarResearch = new SidebarResearch();
        this.manageClientEvents = new ManageClientEvents();
    }
    
    load(data) {
        this.updateData(data); // set the global variables
        this.loadContent.update(); // set services and categories
        this.loadContent.loadTeam(data.team); // set team members
        this.sidebarResearch.update(); // set the sidebar research
        this.manageClientEvents.addAllTheEventListener(); // add the event listners
    }
    reload = async () => {
        const data = await fetchTheData("false");
        console.log(data);
        this.updateData(data); // update global varibales
        this.loadContent.update(); // update services and categories
        this.sidebarResearch.update(); // update the references for the sidebar
    };
    updateData(data) {
        services = data.services;
        this.loadContent.categories = data.categories;
    }
}
class LoadContent {
    // services and categories needs dynamic update
    servicesContainer;
    categoriesContainer;
    categories;
    constructor() {
        this.servicesContainer = document.getElementById("servizi");
        this.categoriesContainer = document.getElementById("categorie");
        this.categoriesOptionForm = document.querySelector("#categoria-select");
    }
    update() {
        this.loadServices();
        this.loadCategories();
    }
    loadServices() {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < services.length; i++) {
            const p = document.createElement("p");
            p.id = services[i].id;
            p.textContent = services[i].nome;
            fragment.appendChild(p);
        }
        this.servicesContainer.innerHTML = "";
        this.servicesContainer.appendChild(fragment);
    }
    loadCategories() {
        const fragment = document.createDocumentFragment();
        const optionFragment = document.createDocumentFragment();
        const categories = this.categories;
        for (let i = 0; i < categories.length; i++) {
            // Side bar to select categories
            const p = document.createElement("p");
            p.id = categories[i].id;
            p.textContent = categories[i].nome;
            fragment.appendChild(p);
            // option to select categories for a service into the form
            const option = document.createElement("option");
            option.value = categories[i].id;
            option.textContent = categories[i].nome;
            optionFragment.appendChild(option);
        }
        this.categoriesContainer.innerHTML = "";
        this.categoriesOptionForm.innerHTML = "";
        this.categoriesContainer.appendChild(fragment);
        this.categoriesOptionForm.appendChild(optionFragment);
    }
    loadTeam(teamMember) {
        const template = document.querySelector("#membri > div:nth-child(2)");
        // to connect the label
        const ids = (id) => {
            template.querySelector("input").id = id;
            template.querySelector("label").htmlFor = id;
        };
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < teamMember.length; i++) {
            template.querySelector("input").value = teamMember[i].id;
            template.querySelector("label").innerText =
                teamMember[i].display_name;
            ids("membro" + teamMember[i].id);
            fragment.appendChild(template.cloneNode(true));
        }
        template.remove();
        document.getElementById("membri").appendChild(fragment);
    }
}
class SidebarResearch {
    serviziDom;
    categoriesDom;
    constructor() {
        this.setEventListners();
    }
    update() {
        this.serviziDom = document.querySelectorAll("#servizi p");
        this.categoriesDom = document.querySelectorAll("#categorie p");
    }
    setEventListners() {
        // services
        document
            .querySelector("#ricerca")
            .addEventListener("input", this.searchServices);

        // categories
        document
            .querySelector("#ricerca-categorie")
            .addEventListener("input", this.searchServices);
    }
    searchServices = (e) => {
        const serviziDom = this.serviziDom;
        const ricerca = e.target.value.toLowerCase();
        for (let i = 0; i < serviziDom.length; i++) {
            const nome = serviziDom[i].textContent.toLowerCase();
            if (nome.includes(ricerca)) {
                serviziDom[i].style.display = "block";
            } else {
                serviziDom[i].style.display = "none";
            }
        }
    };
    searchCategories = (e) => {
        const categoriesDom = this.categoriesDom;
        const ricerca = e.target.value.toLowerCase();
        for (let i = 0; i < categoriesDom.length; i++) {
            const nome = categoriesDom[i].textContent.toLowerCase();
            if (nome.includes(ricerca)) {
                categoriesDom[i].style.display = "block";
            } else {
                categoriesDom[i].style.display = "none";
            }
        }
    };
}

class ManageClientEvents {
    formCategorie;
    formServizi;
    scissors;
    categoriesButton;
    constructor() {
        this.formCategorie = document.getElementById("categoria-form");
        this.formServizi = document.querySelector("#trattamento");

        this.formServizi.nomeServizio =
            document.getElementById("nome-servizio");
        this.formServizi.categoriaSelect =
            document.getElementById("categoria-select");

        this.scissors = document.querySelector("#scissors");
        this.categoriesButton = document.querySelector(
            "#categoria-form button"
        );
    }
    addEvent(query, type, witchFunction) {
        document.querySelector(query).addEventListener(type, witchFunction);
    }
    addAllTheEventListener() {
        const addEvent = this.addEvent;
        addEvent("#create-categoria", "click", this.createCategoryClickEvent);
        addEvent("#categorie", "click", this.modifyCategoryClickEvent);
        addEvent("#create", "click", this.createServiceClickEvent);
        addEvent("#servizi", "click", this.modifyServiceClickEvent);
        addEvent("#elimina-servizio", "click", this.deleteServiceClickEvent);
        this.formCategorie.addEventListener(
            "submit",
            this.submitFormCategories
        );
        this.formServizi.addEventListener("submit", this.submitFormServizi);
    }
    // witch is bool, true for display the service form
    displayTheForm(witch) {
        this.formCategorie.style.display = witch ? "none" : "block";
        this.formServizi.style.display = witch ? "block" : "none";
        this.scissors.style.display = "none";
    }
    // ARROW FUNCTION TO MAINTAIN THE SCOPE OF THIS
    // CATEGORIES
    createCategoryClickEvent = () => {
        this.displayTheForm(false);
        this.formCategorie.nomeCategoria.value = "";
        this.formCategorie.type = "create";
        this.categoriesButton.innerText = "Crea categoria";
    };
    modifyCategoryClickEvent = (e) => {
        this.displayTheForm(false);
        this.formCategorie.type = "update";
        this.formCategorie.nomeCategoria.value = e.target.textContent;
        this.formCategorie.categoriaId = e.target.id;
        this.categoriesButton.innerText = "Aggiorna categoria";
    };
    // SERVICES
    createServiceClickEvent = () => {
        const formServizi = this.formServizi;
        this.displayTheForm(true);
        formServizi.type = "create";
        formServizi.nomeServizio.value = "";
        formServizi.id_servizio = "";
        formServizi.categoriaSelect.querySelector(`option`).selected = true;
        formServizi.prezzo.value = "0";
        formServizi.querySelectorAll("#membri input").forEach((input) => {
            input.checked = false;
        });
        formServizi.descrizione.value = "";
        document.querySelector("#trattamento button").innerText =
            "Crea servizio";
    };
    modifyServiceClickEvent = (e) => {
        const formServizi = this.formServizi;
        this.displayTheForm(true);
        // find the service
        const servizio = services.find(
            (servizio) => servizio.id === e.target.id
        );
        //UPDATE THE DATA IN THE FORM
        formServizi.type = "update";
        formServizi.nomeServizio.value = servizio.nome;
        formServizi.id_servizio = servizio.id;
        formServizi.categoriaSelect.querySelector(
            `option[value="${servizio.id_categoria}"]`
        ).selected = true;
        formServizi.prezzo.value = servizio.prezzo;

        // select the team members
        const membri = servizio.id_membri.split(",");
        formServizi.querySelectorAll("#membri input").forEach((input) => {
            input.checked = false;
        });
        membri.forEach((membro) => {
            formServizi.querySelector(
                `input[value="${membro}"]`
            ).checked = true;
        });
        // select the duration
        formServizi.querySelector(
            `#durata option[value='${servizio.tempo}']`
        ).selected = true;

        formServizi.descrizione.value = servizio.descrizione;
        document.querySelector("#trattamento button").innerText =
            "Aggiorna servizio";
    };
    // DELETING
    deleteServiceClickEvent = () => {
        const formServizi = this.formServizi;
        // check the input
        if (formServizi.id_servizio == null) {
            alert("Seleziona un servizio da eliminare");
            return;
        }
        const confirmation = confirm(
            "Sei sicuro di voler eliminare questo prodotto? Verranno eliminati i relativi appuntamenti"
        );
        if (!confirmation) {
            return;
        }

        // update to the server
        const servizio = {
            id: formServizi.id_servizio,
        };
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
                this.createServiceClickEvent();
                reload();
            })
            .catch((error) => {
                alert("Error:", error);
            });
    };

    submitFormServizi = (e) => {
        e.preventDefault();
        if (!checkTeamMembers.check()) {
            alert("Seleziona un membro del team");
            return;
        }
        if (!confirm("Sei sicuro di voler eseguire questa operazione?")) return;

        const servicesForm = this.formServizi;
        // group all the data
        const servizio = {
            nome: servicesForm.nomeServizio.value,
            id_categoria: servicesForm.categoriaSelect.value,
            prezzo: servicesForm.prezzo.value,
            tempo: servicesForm.durata.options[
                servicesForm.durata.selectedIndex
            ].value,
            id_membri: Array.from(
                servicesForm.querySelectorAll("#membri input:checked")
            ).map((input) => input.value),
            descrizione: servicesForm.descrizione.value,
            id: servicesForm.id_servizio,
        };
        fetch("/wp-json/gestionale/v1/admin/servizi/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // update or create
                type: servicesForm.type,
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(servizio),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + data);
                    console.error(data);
                    return;
                }
                if (servicesForm.type == "create")
                    this.createServiceClickEvent();

                reload();
            })
            .catch((error) => {
                console.error(error);
                alert("Error:", error);
            });
    };
    submitFormCategories = (e) => {
        const categoriesForm = this.formCategorie;
        e.preventDefault();
        if (!confirm("Sei sicuro di voler eseguire questa operazione?")) return;

        // group the data

        const categoria = {
            nome: categoriesForm.nomeCategoria.value,
            id: categoriesForm.categoriaId,
        };
        fetch("/wp-json/gestionale/v1/admin/categorie/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // update or create
                type: categoriesForm.type,
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(categoria),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + data);
                    console.error(data);
                    return;
                }
                if (categoriesForm.type == "create")
                    this.createCategoryClickEvent();
                reload();
            })
            .catch((error) => {
                console.error(error);
                alert("Error:", error);
            });
    };
}

function mostraServizi() {
    document.querySelector(".servizi").style.display = "block";
    document.querySelector("#servizi-nav").classList.add("active");
    document.querySelector("#categorie-nav").classList.remove("active");
    document.querySelector(".categorie").style.display = "none";
}
function mostraCategorie() {
    document.querySelectorAll(".servizi").forEach((servizio) => {
        servizio.style.display = "none";
    });
    document.querySelector("#servizi-nav").classList.remove("active");
    document.querySelector("#categorie-nav").classList.add("active");
    document.querySelector(".categorie").style.display = "block";
}


checkTeamMembers = {
    domElements: [],
    check: () => {
        const domElements = checkTeamMembers.domElements;
        const checked = [];
        domElements.forEach((element) => {
            checked.push(element.checked);
        });
        return checked.includes(true);
    },
};

