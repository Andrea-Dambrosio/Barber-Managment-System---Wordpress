const url = new URL(window.location.href);
const form = {
    team: "0",
    orario: "",
    data: ""
}  
// Ottieni i parametri dall'URL
const params = new URLSearchParams(url.search);
const durata = params.get("durata");

let prezzo
if (!params.get("servizi") || !durata) {
    window.location.href ="https://www.barberiagrazioso.com/servizi/";
}
// Costruisci l'URL per il fetch
const fetchUrl =
    "/wp-json/gestionale/clienti/disponibilitaPrenotazioni/" +
    "?" +
    params.toString();
fetch(fetchUrl)
    .then((response) => response.json())
    .then((data) => main(data))
    .catch((error) => console.error(error));

    let today = new Date();
function datePicker(dati, timepicker, confirmButton, dateNonDisponibili) {
    let lunch = {};
    dati.team.forEach((membro) => {
        lunch[membro.id] = {
            start: stringToMinutes(membro.inizio_pranzo),
            end: stringToMinutes(membro.fine_pranzo),
        };
    });
    unisciPranzi(lunch)
    const datepicker = new AirDatepicker(
        document.querySelector("#datepicker"),
        {
            inline: true,
            startDate: today,
            view: "days",
            minView: "days",
            minDate: today,
            toggleSelected: false,
            maxDate: (() => {
                const maxDate = new Date().setDate(today.getDate() + 90);
                return maxDate;
            })(),
            locale: localeIt,
            timeFormat: "HH:mm",
            disableNavWhenOutOfRange: true,

            onSelect: ({ date }) => {
                confirmButton.disabled = true;
                selezioneData(
                    dati.disponibilita,
                    dati.orarioApertura,
                    lunch,
                    date,
                    timepicker
                );
            },
            // disabilita giorni di chiusura
            onRenderCell: function ({ date, cellType }) {
                if (cellType === "day") {
                    if (dati.giorniChiusura.includes(date.getDay())) {
                        return {
                            disabled: true,
                        };
                    }
                }
            },
        }
    );

    return datepicker;
}
function riepilogo(servizi) {
    const container = document.querySelector("#riepilogo");
    let totale = 0;
    let totaleTempo = 0;
    servizi.forEach((servizio) => {
        const p = document.createElement("p");
        p.innerHTML = `
        <b>${servizio.nome}</b>
        <span style="float: right;"><b>${servizio.prezzo}€</b></span>
        <br>${servizio.tempo.slice(0, -3)}
        `;
        totale += parseInt(servizio.prezzo);
        totaleTempo += stringToMinutes(servizio.tempo);
        container.prepend(p);
    });
    const p = document.createElement("p");
	p.classList.add("ultimo-paragrafo");
    prezzo = totale
   p.innerHTML = `
    <b style="">Totale</b>
    <span style="float: right; "><b style="">${totale}€</b></span>
    <br>${minutesToString(totaleTempo)}
`;
    container.insertBefore(p, container.lastElementChild);
}
function teamDisponibile(data) {
    const select = document.querySelector("#team");
    let bool = true;
    form.team = data.team[0].id;
    data.team.forEach((membro) => {
        const option = document.createElement("option");
        option.innerText = membro.nome;
        option.value = membro.id;
        option.selected = bool;
        bool = false;
        select.append(option);
    if(!data.disponibilita[membro.id]){
    data.disponibilita[membro.id] = []
    }
    });
    
}

function prossimaDisponibile(nonDisponibili, giorniChiusura) {
    
    while (
        nonDisponibili.includes(today.toISOString().split("T")[0]) ||
        giorniChiusura.includes(today.getDay())
    ) {
        today.setDate(today.getDate() + 1); // incrementa di un giorno
    }

    return today.toISOString().split("T")[0];
}
let lastDate = [];
function setDisabledDates(dates, datepicker, chiusura){
        datepicker.enableDate(lastDate);
        datepicker.clear((opts = { silent: true }));
        if (dates) {
            datepicker.disableDate(dates);
            lastDate = dates;
            datepicker.selectDate(
                prossimaDisponibile(dates, chiusura)
            );
        }
}
function selezioneTeam(datepicker, dateNonDisponibili, chiusura) {
    const selectElement = document.querySelector("select");

    selectElement.addEventListener("change", function () {
        form.team = this.value;
        setDisabledDates(
            dateNonDisponibili[this.value],
            datepicker,
            chiusura
        );
       
    });
}
function unisciPranzi(lunch){
    let maxStart = 0
    let minEnd = Infinity
    Object.values(lunch).forEach(slot => {
        if(slot.start > maxStart){
            maxStart = slot.start
        }
        if(slot.end < minEnd){
            minEnd = slot.end
        }
    })
    lunch[0] = {
        start: maxStart,
        end: minEnd
    }
}
function unisciSlot(disponibilita) {
    const membriId = Object.keys(disponibilita).filter((id) => id !== "0");

    // Crea un oggetto per contenere gli slot unificati
    const slotUnificati = {};

    // Per ogni membro, unisci gli slot per ogni data
    membriId.forEach((id) => {
        if (!disponibilita[id]) {
            return;
        }
        const date = Object.keys(disponibilita[id]);
        date.forEach((data) => {
            if (disponibilita[id][data] === "non disponibile") {
                // Se non esiste già un valore per questa data in slotUnificati, o se il valore esistente non è "non disponibile", allora imposta il valore a "non disponibile"
                if (
                    !slotUnificati[data] ||
                    slotUnificati[data] !== "non disponibile"
                ) {
                    slotUnificati[data] = "non disponibile";
                }
                return;
            }
            if (slotUnificati[data] === "non disponibile") {
                return;
            }

            // Aggiungi gli slot del membro corrente agli slot unificati
            slotUnificati[data] = (slotUnificati[data] || []).concat(
                disponibilita[id][data]
            );

            // Ordina gli slot per l'ora di inizio
            slotUnificati[data].sort((a, b) => a.start.localeCompare(b.start));

            // Unisci gli slot sovrapposti
            const mergedSlots =
                slotUnificati[data].length > 0 ? [slotUnificati[data][0]] : [];
            for (let i = 1; i < slotUnificati[data].length; i++) {
                const lastSlot = mergedSlots[mergedSlots.length - 1];
                if (lastSlot.end < slotUnificati[data][i].start) {
                    // Se l'ultimo slot finisce prima dell'inizio del slot corrente, aggiungi il slot corrente
                    mergedSlots.push(slotUnificati[data][i]);
                } else if (lastSlot.end < slotUnificati[data][i].end) {
                    // Se l'ultimo slot finisce durante il slot corrente, estendi l'ultimo slot
                    lastSlot.end = slotUnificati[data][i].end;
                }
            }

            slotUnificati[data] = mergedSlots;
        });
    });

    return slotUnificati;
}

function nonDisponibili(data) {
    const dateNonDisponibili = {};
    const mappa = (id) => {
         const dates = data.disponibilita[id];
         if (dates) {
             dateNonDisponibili[id] = Object.entries(dates)
                 .filter(([date, values]) => values == "non disponibile")
                 .map(([date]) => date);
         }
    }
    data.team.forEach((membro) => {
        mappa(membro.id)
    });
    mappa(0)
    
    data.chiusureEccezionali.forEach((giorno) => {
        const membri = giorno.id_team.split(",");
        membri.forEach((membro) => {
            if (!dateNonDisponibili[membro]) {
                dateNonDisponibili[membro] = [];
            }
            dateNonDisponibili[membro].push(giorno.giorno);
        });
    });

    dateNonDisponibili[0] = []
    const allDates = [].concat(...Object.values(dateNonDisponibili));
    const uniqueDates = [...new Set(allDates)];

    uniqueDates.forEach((date) => {
        if (
            Object.values(dateNonDisponibili).filter((_, index) => index !== 0).every(arr => arr.includes(date))
        ) {
            dateNonDisponibili[0].push(date);
        }
    });

    return dateNonDisponibili;
}
function stringToMinutes(time) {
    const [ore, minuti] = time.split(":");
    return parseInt(ore) * 60 + parseInt(minuti);
}
function minutesToString(minutes) {
    const ore = Math.floor(minutes / 60);
    const minuti = minutes % 60;
    return (
        (ore < 10 ? "0" + ore : ore) +
        ":" +
        (minuti < 10 ? "0" + minuti : minuti)
    );
}
function addSlots(slot, lunch, timepicker) {

    const fragment = document.createDocumentFragment();
    let currentTime = stringToMinutes(slot.start);
    const endMinutes = stringToMinutes(slot.end) - durata;
    
    while (currentTime <= endMinutes) {
        if (lunch.start - durata < currentTime && currentTime < lunch.end) {
            currentTime = lunch.end;
                    
            continue;
        }
        const p = document.createElement("p");
        const orario = minutesToString(currentTime);
        p.addEventListener;
        p.innerText = orario;
        p.dataset.orario = orario;
        fragment.append(p);
        currentTime += 10;
    }
    if(fragment.childElementCount == 0){
        timepicker.innerHTML = "<span class='text-danger'>Nessun orario disponibile</span>"
        return;
    }
    timepicker.append(fragment);
}

function selezioneData(disponibilita, apertura, lunch, data, timepicker) {
    const membroId = document.querySelector("select").value;
    const formattedDate = data.toLocaleDateString("fr-CA");
    form.data = formattedDate;

    let slots = disponibilita[membroId][formattedDate];
    if (!slots) {
        const day = data.getDay()
        slots = [
            {
                start: apertura[day].start,
                end: apertura[day].end,
            },
        ];
    }
    timepicker.innerHTML = "";
    slots.forEach((slot) => {
        addSlots(slot, lunch[membroId], timepicker);
    });

}

function selectedTime(confirmButton, timepicker) {
    timepicker.addEventListener("click", function (event) {
        if (event.target.tagName === "P") {
            confirmButton.disabled = false;
            const [hours, minutes] = event.target.dataset.orario.split(":");
            const time = `${hours.padStart(2, "0")}:${minutes.padStart(2,"0")}:00`;
            form.orario = time;
            const lastActive = timepicker.querySelector(".active");
            if(lastActive){
            lastActive.classList.remove("active");
            }
            event.target.classList.add("active")
        }
    });
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
    let closing;
    try {
        closing = data.orarioChiusura[today.getDay()].end.split(":")[0];
        if (today.getHours() >= closing) {
            today.setDate(today.getDate() + 1);
        }
    } catch (e) {
        console.log("Barberia chiusa oggi");
        today.setDate(today.getDate() + 1);
    }
    riepilogo(data.servizi);
    teamDisponibile(data);
    data.disponibilita[0] = unisciSlot(JSON.parse(JSON.stringify(data)).disponibilita);
    const dateNonDisponibili = nonDisponibili(data);
    const timepicker = document.querySelector("#timepicker");
    const confirmButton = document.querySelector("#wrapper_button button");
    const datepicker = datePicker(data, timepicker, confirmButton, dateNonDisponibili);
    setDisabledDates(dateNonDisponibili[0], datepicker, data.giorniChiusura);
    
    selezioneTeam(datepicker, dateNonDisponibili, data.giorniChiusura);
    selectedTime(confirmButton, timepicker);
}

function confermaPrenotazione() {

    const data = `
    servizi=${encodeURIComponent(params.get("servizi"))}
    &datetime=${encodeURIComponent(form.data + " " + form.orario)}
    &team=${encodeURIComponent(form.team)}
    &durata=${encodeURIComponent(durata)}
    &prezzo=${encodeURIComponent(prezzo)}
    `.replace(/\s+/g, '');
    window.location.href = "/conferma?" + data
}
