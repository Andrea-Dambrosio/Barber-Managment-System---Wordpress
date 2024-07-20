const urlQuery = window.location.search;
let params = new URLSearchParams(urlQuery);
let durata = params.get("durata");
let servizi = params.get("servizi");
let team = params.get("team");
let datetime = params.get("datetime");
console.log(datetime)
let prezzo = params.get("prezzo");
if (durata && servizi && team && datetime && prezzo) {
    // Salva i parametri nel localStorage
    localStorage.setItem("durata", durata);
    localStorage.setItem("servizi", servizi);
    localStorage.setItem("team", team);
    localStorage.setItem("datetime", datetime);
    localStorage.setItem("prezzo", prezzo);

    const url = window.location.href.split("?")[0];
    window.history.replaceState({ path: url }, "", url);
} else {
    // Prendi i parametri dal localStorage se non sono nell'URL
    durata = localStorage.getItem("durata");
    servizi = localStorage.getItem("servizi");
    team = localStorage.getItem("team");
    datetime = localStorage.getItem("datetime");
    prezzo = localStorage.getItem("prezzo");
    console.log(datetime)
    if (!durata || !servizi || !team || !datetime || !prezzo) {
        window.location.href = "/servizi";
    }
}


if(new Date(datetime).getTime() <= new Date().getTime()) {
    window.location.href = "/servizi";
}
// Costruisci l'URL per il fetch
const fetchUrl =
    "/wp-json/gestionale/clienti/aggiungiAppuntamento/" +
    "?servizi=" +
    encodeURIComponent(servizi) +
    "&team=" +
    encodeURIComponent(team);

fetch(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
        main(data);
    })
    .catch((e) => console.error(e));
function minutesToString(minutes) {
    const ore = Math.floor(minutes / 60);
    const minuti = minutes % 60;
    return (
        (ore < 10 ? "0" + ore : ore) +
        ":" +
        (minuti < 10 ? "0" + minuti : minuti)
    );
}
function loadAppointmentInformation(team, servizi) {
    document.getElementById("durata").innerHTML += minutesToString(durata);
    console.log(datetime);
    document.getElementById("data").innerHTML += datetime;
    const serviziDom = document.querySelector("#servizi");
    servizi.forEach((servizio) => {
        serviziDom.innerHTML += `<li>${servizio.nome}</li>`;
    });
    document.getElementById("collaboratore").innerHTML += team[0]
        ? team[0].name
        : "Primo collaboratore disponibile";
    document.getElementById("costo").innerHTML += prezzo + "€";
}
function gestioneInvioForm() {
    const form = document.getElementById("form_cliente");
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const data = {
            nome: form.nome.value,
            cognome: form.cognome.value,
            email: form.email.value,
            telefono: form.telefono.value,
            note: form.note.value,
            data: datetime,
            servizi: servizi,
            team: team,
            durata: durata,
        };
        localStorage.setItem("formData", JSON.stringify(data));
        let response = await fetch(
            "/wp-json/gestionale/clienti/aggiungiAppuntamento",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );
        response = await response.json();
        if (response == "OK") {
            localStorage.removeItem("durata");
            localStorage.removeItem("servizi");
            localStorage.removeItem("team");
            localStorage.removeItem("datetime");
            localStorage.removeItem("prezzo");
            window.location.href = "/appuntamento-confermato";
            
        }
        else alert("Errore nell'invio del form, riprova");
        console.log(response);
    });
}
function form(){
    const formData = JSON.parse(localStorage.getItem("formData"));
    if (formData) {
        const form = document.getElementById("form_cliente");
        form.nome.value = formData.nome;
        form.cognome.value = formData.cognome;
        form.email.value = formData.email;
        form.telefono.value = formData.telefono;
        form.note.value = formData.note;
    }
}
async function main(data) {
    await new Promise((resolve) => {
        if (document.readyState !== "loading") {
            resolve();
        } else {
            document.addEventListener("DOMContentLoaded", resolve);
        }
    });
    console.log(data);
    form()
    loadAppointmentInformation(data.team, data.servizi);
    gestioneInvioForm(data);
}
