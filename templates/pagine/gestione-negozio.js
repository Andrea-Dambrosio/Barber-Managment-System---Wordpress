function loadContent() {
    orariNegozio();
    giorniEccezionali();
    navigazione();
    pausaPranzo();
    timepicker();
}
let dati;
fetch("/wp-json/gestionale/v1/admin/negozio/", {
    headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce,
    },
}) 
    .then((response) => response.json())
    .then((data) => {
        if (data == "KO") {
            alert("Errore nel recupero dei dati " + data);
        } else {
            dati = data;
            console.log(dati);
            if (domLoaded == true) {
                loadContent();
            }
        }
    })
    .catch((error) => {
        console.error(error);
        alert("Error: " + error);
    });

document.addEventListener("DOMContentLoaded", () => {
    domLoaded = true;
    if (dati != undefined) {
        loadContent();
    }
});
function pausaPranzo() {
    const form = document.querySelector("#pausaPranzo form");
    const preset = form.querySelector(".row");
    dati.utenti.forEach(function (user) {
        const clone = preset.cloneNode(true);
        clone.dataset.id = user.id;
        clone.querySelector("p").innerText = user.display_name;
        clone.querySelector(".inizio").value = user.inizio_pranzo;
        clone.querySelector(".fine").value = user.fine_pranzo;
        form.insertBefore(clone, form.lastElementChild);
    });
    preset.remove();
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const users = [];
        form.querySelectorAll(".row").forEach(function (item) {
            users.push({
                id: item.dataset.id,
                inizio_pranzo: item.querySelector(".inizio").value,
                fine_pranzo: item.querySelector(".fine").value,
            });
        });
        const data = {
            users: users,
        };
        console.log(data);
        fetch("/wp-json/gestionale/v1/admin/negozio/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: "pausaPranzo",
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data == "OK") {
                    alert("Orari aggiornati correttamente");
                } else {
                    alert("Errore nell'aggiornamento degli orari:" + data);
                }
            })
            .catch((error) => {
                alert("Error:", error);
            });
    });
}
function navigazione() {
    const sezioni = document.querySelectorAll(".col-9 section");
    document.querySelectorAll(".col-3 p").forEach(function (paragrafo) {
        paragrafo.addEventListener("click", () => {
            sezioni.forEach(function (item) {
                item.style.display = "none";
            });
            document.getElementById(paragrafo.dataset.target).style.display =
                "block";
        });
    });
}

function giorniEccezionali() {
    new AirDatepicker("#data", {
        dateFormat: "dd/MM/yyyy",
        locale: localeIt,
    });
    const form = document.querySelector("#eccezionali form");
    const formTemplate = form.querySelector(".form-check");
    const list = document.querySelector("#eccezionali #giorniPresenti > div");
    const template = list.querySelector(".template");
    dati.utenti.forEach(function (user) {
        const clone = formTemplate.cloneNode(true);
        clone.querySelector("input").dataset.userId = user.id;
        clone.querySelector("input").dataset.id = user.display_name;
        clone.querySelector("label").innerText = user.display_name;
        clone.querySelector("label").for = user.display_name;
        form.insertBefore(clone, form.lastElementChild);
    });
    formTemplate.remove();
    dati.giorniEccezionali.forEach(function (item) {
        const clone = template.cloneNode(true);
        const nomi = clone.querySelector(".nomi")
        clone.querySelector("span").innerText = item.giorno;
        item.id_membri.split(",").forEach(function (id, index) {
            const p = document.createElement("p");
            p.style.margin = "0";
            p.innerText = item.nomi_team.split(",")[index];
            nomi.appendChild(p);
        });
        clone.querySelector("i").dataset.giornoDate = item.giorno;
        list.appendChild(clone);
    });
    template.remove();

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const users = Array.from(form.querySelectorAll("input:checked")).map((checkbox) => {
            return checkbox.dataset.userId;
        });
        console.log(users)
        if (users.length == 0) {
            alert("Seleziona almeno un utente");
            return;
        }
        const data = {
            data: form.querySelector("#data").value,
            users: users,
        };
        console.log(data);
        fetch("/wp-json/gestionale/v1/admin/negozio/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: "eccezionali",
                "X-WP-Nonce": nonce,
            },

            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data == "OK") {
                    alert("Giorno aggiunto correttamente");
                    location.reload();
                } else {
                    alert("Errore nell'aggiornamento degli orari:" + data);
                }
            })
            .catch((error) => {
                alert("Error:", error);
            });
    });
}
function removeDay(target) {
    const giorno = {
        giorno: target.dataset.giornoDate,
    };
    fetch("/wp-json/gestionale/v1/admin/negozio/", {
        method: "POST",
        headers: {
            type: "delete",
            "Content-Type": "application/json",
            "X-WP-Nonce": nonce,
        },
        body: JSON.stringify(giorno),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data == "OK") {
                alert("Giorno rimosso correttamente");
                location.reload();
            } else {
                alert("Errore nella rimozione del giorno:" + data);
            }
        })
        .catch((error) => {
            alert("Error:", error);
        });
}
function orariNegozio() {
    const form = document.querySelector("#formOrariNegozio");
    form.querySelectorAll(".row").forEach(function (item, index) {
        item.querySelector(".apertura").value =
            dati.gestioneApertura[index].apertura;
        item.querySelector(".chiusura").value =
            dati.gestioneApertura[index].chiusura;
    });
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const data = {
            days: [
                {
                    apertura: form.querySelector("#lunedi .apertura").value,
                    chiusura: form.querySelector("#lunedi .chiusura").value,
                },
                {
                    apertura: form.querySelector("#martedi .apertura").value,
                    chiusura: form.querySelector("#martedi .chiusura").value,
                },
                {
                    apertura: form.querySelector("#mercoledi .apertura").value,
                    chiusura: form.querySelector("#mercoledi .chiusura").value,
                },
                {
                    apertura: form.querySelector("#giovedi .apertura").value,
                    chiusura: form.querySelector("#giovedi .chiusura").value,
                },
                {
                    apertura: form.querySelector("#venerdi .apertura").value,
                    chiusura: form.querySelector("#venerdi .chiusura").value,
                },
                {
                    apertura: form.querySelector("#sabato .apertura").value,
                    chiusura: form.querySelector("#sabato .chiusura").value,
                },
                {
                    apertura: form.querySelector("#domenica .apertura").value,
                    chiusura: form.querySelector("#domenica .chiusura").value,
                },
            ],
        };
        fetch("/wp-json/gestionale/v1/admin/negozio/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: "gestioneApertura",
                "X-WP-Nonce": nonce,
            },

            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data == "OK") {
                    alert("Orari aggiornati correttamente");
                } else {
                    alert("Errore nell'aggiornamento degli orari:" + data);
                }
            })
            .catch((error) => {
                alert("Error:", error);
            });
    });
}
function timepicker() {
    document.querySelectorAll(".orario").forEach(function (item) {
        new AirDatepicker(item, {
            onlyTimepicker: true,
            timepicker: true,
            timeFormat: "HH:mm",
            amPM: false,
        });
    });
}
