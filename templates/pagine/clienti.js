let clientiDb;
let clientiDom;
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("dati-clienti");
    form.type = "create";
    inputForm(form);
    aggiungiClienti(form);
    ricercaClienti();
    
});
function loadContent(form) {
    aggiungiClienti(form);
    ricercaClienti();
}
function clientElements() {
    return {
        nome: document.getElementById("nome"),
        cognome: document.getElementById("cognome"),
        email: document.getElementById("email"),
        telefono: document.getElementById("telefono"),
    }
}
function aggiungiClienti(form) {
    fetch("/wp-json/gestionale/v1/admin/clienti/")
        .then((response) => response.json())
        .then((data) => mostra(data))
        .catch((error) => console.error("Error:", error));
    function mostra(data) {
        clientiDb = data;
        const clientiElement = document.getElementById("clienti");
        clientiElement.innerHTML = "";
        const mobile = window.matchMedia("(max-width: 768px)").matches;
        const elementiCliente = clientElements();
        const button = form.querySelector("button");
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < clientiDb.length; i++) {
            const p = document.createElement("p");
            p.id = clientiDb[i].id;
            p.textContent = `${clientiDb[i].nome} ${clientiDb[i].cognome}`;
            fragment.appendChild(p);
        }
        
        clientiElement.appendChild(fragment);
        gestisciEventiCliente(clientiElement, form, button, elementiCliente, mobile);
        clientiDom = document.querySelectorAll("#clienti p");
        creaEdElimina(form, button, mobile);
    }
}
function ricercaClienti() {
    const wrapper = document.querySelector(".wrapper");
    document.querySelector("#ricerca").addEventListener("input", function () {
        wrapper.scrollTop = 0;
        const ricerca = this.value.toLowerCase();
        for (let i = 0; i < clientiDom.length; i++) {
            const nome = clientiDom[i].textContent.toLowerCase();
            if (nome.includes(ricerca)) {
                clientiDom[i].style.display = "block";
            } else {
                clientiDom[i].style.display = "none";
            }
        }
    });
}
function gestisciEventiCliente(
    element,
    form,
    button,
    elementiCliente,
    mobile
) {
    element.addEventListener("click", function (e) {
        if (mobile) {
            document.querySelector(".col-3").style.display = "none";
            document.querySelector(".col-9").style.display = "block";
        }
        form.type = "update";
        const id = e.target.id;
        const cliente = clientiDb.find((cliente) => cliente.id === id);
        form.clientId = cliente.id;
        elementiCliente.nome.value = cliente.nome;
        elementiCliente.cognome.value = cliente.cognome;
        button.disabled = true;
        document.getElementById("title").innerText =
            "Modifica i dati del cliente";
        button.innerText = "Aggiorna dati";

        if (cliente.email == null) {
            elementiCliente.email.nextElementSibling.style.display = "block";
            elementiCliente.email.value = "";
        } else {
            elementiCliente.email.nextElementSibling.style.display = "none";
            elementiCliente.email.value = cliente.email;
        }
        if (cliente.email == null) {
            elementiCliente.telefono.nextElementSibling.style.display = "block";
            elementiCliente.telefono.value = "";
        } else {
            elementiCliente.telefono.nextElementSibling.style.display = "none";
            elementiCliente.telefono.value = cliente.telefono;
        }
    });
}
function creaEdElimina(form, button, mobile) {
    const inputs = form.querySelectorAll("input");

    inputs.forEach((input) => {
        input.addEventListener("input", function () {
            button.disabled = false;
        });
    });
    
    const createClient = document.getElementById("create-client");
    createClient.addEventListener("click", function () {
        form.type = "create";
        form.clientId = null;
        inputs.forEach((input) => {
            input.value = "";
        });
        document.getElementById("title").innerText =
            "Aggiungi un nuovo cliente";
        button.disabled = false;
        button.innerText = "Crea cliente";
        if (!mobile) return;
        document.querySelector(".col-3").style.display = "none";
        document.querySelector(".col-9").style.display = "block";
    });
    document
        .getElementById("elimina-cliente")
        .addEventListener("click", function () {
            if (form.clientId == null) {
                alert("Seleziona un cliente da eliminare");
                return;
            }
            if (
                !confirm(
                    "Sei sicuro di voler eliminare questo cliente? Verranno eliminati i relativi appuntamenti"
                )
            ) {
                return;
            }
            const cliente = {
                id: form.clientId,
            };
            fetch("/wp-json/gestionale/v1/admin/clienti/", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    type: "delete",
                },
                body: JSON.stringify(cliente),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data != "OK") {
                        alert("Operazione non consentita dal server" + data);
                        console.error("Error:", data);
                        return;
                    }
                    loadContent(form);
                    showLibrary();
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert("Error:", error);
                });
        });
}

function inputForm(form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (confirm("Sei sicuro di voler eseguire questa operazione?")) {
            if (form.type === "update") update();
            else create();
        }
    });
    function update() {
        const cliente = clientiDb.find(
            (cliente) => cliente.id === form.clientId
        );
        cliente.nome = form.nome.value;
        cliente.cognome = form.cognome.value;
        cliente.email = form.email.value;
        cliente.telefono = form.telefono.value;
        fetch("/wp-json/gestionale/v1/admin/clienti/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: form.type,
            },
            body: JSON.stringify(cliente),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + JSON.stringify(data));
                    console.error("Error:", data);
                    return;
                }
                loadContent(form);
                showLibrary();
            })
            .catch((error) => {
                alert("Error:", error);
            });
    }
    function create() {
        const cliente = {
            nome: form.nome.value,
            cognome: form.cognome.value,
            email: form.email.value,
            telefono: form.telefono.value,
        };
        fetch("/wp-json/gestionale/v1/admin/clienti/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: form.type,
                token: "{64y!Z2Ct*TTd34.*+Wb#Jh0QeV;s5",
            },
            body: JSON.stringify(cliente),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data != "OK") {
                    alert("Operazione non consentita dal server" + JSON.stringify(data));
                    console.warn("Error:", data);
                    return;
                }
                loadContent(form);
                showLibrary();
            })
            .catch((error) => {
                alert("Error:", error);
            });
    }
}


function showLibrary() {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    document.querySelector(".col-3").style.display = "block";
    document.querySelector(".col-9").style.display = "none";
}
