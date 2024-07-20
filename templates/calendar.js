let data = {
    servizi: {},
    clienti: {},
    team: {},
    giorniApertura: {},
    chiusureEccezionali: {},
    prodotti: {},
};
let domLoaded = false;
let calendar;
document.addEventListener("DOMContentLoaded", () => {
    domLoaded = true;
});
caricaDati();
function caricaDati() {
    const colori = ["#FF0000", "#008000", "#FF69B4"];
    fetch("/wp-json/gestionale/v1/admin/informazioniNegozio/")
        .then((response) => response.json())
        .then((data) => setVariabili(data))
        .catch((error) => console.error("Error:", error));
    function setVariabili(response) {
        data.servizi.db = response.servizi;
        data.clienti.db = response.clienti;
        data.team.db = response.team;
        data.giorniApertura = response.giorniApertura;
        data.chiusureEccezionali = response.chiusureEccezionali;
        data.prodotti = response.prodotti;
        const risorse = data.team.db
            .map((team, index) => {
                if (!adminRole && userId != team.id) return;
                return {
                    id: team.id,
                    title: team.display_name.split(" ")[0],
                    eventColor: colori[index % colori.length],
                };
            })
            .filter((item) => item !== undefined);
        if (domLoaded) {
            domPronto(risorse);
            console.log(data);
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                domPronto(risorse);
            });
        }
    }
}
function domPronto(risorse) {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    creaCalendario(risorse, mobile);
    loadOptions(data.servizi.db, "#servizio");
    loadOptions(data.team.db, "#membro_team");
    loadClienti(data.clienti.db);
    adminRoleForm();
    if(adminRole == 1) 
        document.querySelectorAll("tbody")[2].classList.add("adminTable");
    
}
function adminRoleForm() {
    if (adminRole != 0) return;
    document.querySelectorAll("#membro_team option").forEach((option) => {
        if (option.value == userId) option.disabled = false;
        else option.disabled = true;
    });
    console.log(data.servizi.db);
    document.querySelectorAll("#servizio option").forEach((option) => {
        if(option.value == "") return
        const team = data.servizi.db.find(
            (servizio) => servizio.id == option.value
        ).id_membri.split(",");
        if (team.includes(userId.toString())) 
            option.disabled = false;
        else option.disabled = true;
    });
}
function loadOptions(array, selector) {
    const optionFragment = document.createDocumentFragment();
    for (let i = 0; i < array.length; i++) {
        const option = document.createElement("option");
        option.value = array[i].id;
        option.textContent =
            array[i].nome != null
                ? `${array[i].nome}  (${array[i].prezzo}€)`
                : array[i].display_name;
        optionFragment.appendChild(option);
    }
    document.querySelector(selector).appendChild(optionFragment);
}
function loadClienti(array) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < array.length; i++) {
        const p = document.createElement("p");
        p.id = "cliente_" + array[i].id;
        p.textContent = array[i].nome + " " + array[i].cognome;
        fragment.appendChild(p);
    }
    document.querySelector("#lista_clienti").appendChild(fragment);
}
document.addEventListener("DOMContentLoaded", () => {
    domLoaded = true;
});
function mobile() {
    const headerToolbar = {
        start: "title",
        center: "datePicker",
        end: "today,prev,next",
    };
    return [headerToolbar];
}
function desktop() {
    const headerToolbar = {
        start: "title,datePicker",
        center: "resourceTimeGridDay,resourceTimeGridWeek",
        end: "today,prev,next",
    };
    return [headerToolbar];
}
function calculateMinMaxTime(giorniApertura) {
    const apertura = giorniApertura.map((giorno) => {
        return stringToMinutes(giorno.apertura);
    });
    const chiusura = giorniApertura.map((giorno) => {
        return stringToMinutes(giorno.chiusura);
    });
    let minTime = Math.min(...apertura);
    let maxTime = Math.max(...chiusura);
    minTime -= 30 + (minTime % 30);
    maxTime += 30 - (maxTime % 30);
    return [minutesToString(minTime), minutesToString(maxTime)];
}
function creaCalendario(risorse, mobile = false) {
    const calendarEl = document.getElementById("calendar");
    const datePicker = document.getElementById("datePicker");
    const [slotMinTime, slotMaxTime] = calculateMinMaxTime(data.giorniApertura);
    const datePickerClass = new AirDatepicker("#datePicker", {
        inline: false,
        visible: false,
        locale: localeIt,
        onSelect: updateDate,
    });
    let headerToolbar = {
        start: "title,datePicker",
        center: "resourceTimeGridDay,resourceTimeGridWeek",
        end: "today,prev,next",
    };

    if (mobile) {
        headerToolbar = {
            start: "title",
            center: "datePicker",
            end: "today,prev,next",
        };
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        // Localizzazione e licenza
        locale: "it",
        schedulerLicenseKey: "GPL-My-Project-Is-Open-Source",
        themeSystem: "bootstrap5",
        // Opzioni dell'interfaccia utente
        headerToolbar: headerToolbar,
        buttonText: {
            today: "Oggi",
            resourceTimeGridDay: "Giorno",
            resourceTimeGridWeek: "Settimana",
        },
        customButtons: {
            datePicker: {
                text: " ",
                click: function (e) {
                    e.stopPropagation();
                    datePickerClass.show();
                    $(document).one("click", function (e) {
                        if (!$(e.target).closest(".air-datepicker").length) {
                            datePickerClass.hide();
                        }
                    });
                },
            },
        },
        initialView: "resourceTimeGridDay",
        allDaySlot: false,
        nowIndicator: true,
        businessHours: data.giorniApertura.map((giorno) => {
            return {
                daysOfWeek: [giorno.id] != 7 ? [giorno.id] : [0],
                startTime: giorno.apertura,
                endTime: giorno.chiusura,
            };
        }),

        firstDay: 1,
        navLinks: true,

        // Formattazione delle date
        datesAboveResources: true,
        views: {
            resourceTimeGridDay: {
                // name of view
                titleFormat: { month: "short", day: "2-digit" },
                slotDuration: "00:10:00",
            },
            resourceTimeGridWeek: {
                slotDuration: "00:10:00",
            },
        },
        slotLabelFormat: {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        },
        slotMinTime: slotMinTime,
        slotMaxTime: slotMaxTime,

        // Opzioni di modifica
        editable: true,
        eventDurationEditable: false,
        selectMirror: true,
        selectable: true,
        selectOverlap: false,
        slotDuration: "00:10:00",
        selectAllow: selectAllow,
        selectConstraint: "businessHours",
        eventInteractive: true,
        eventOverlap: false,

        // Gestione degli eventi
        dateClick: (dateClickInfo) => {
                poupup(dateClickInfo, "create", calendar);
        },
        eventClick: (info) => {
            if (info.event.title == "Lunch") return;
            poupup(info, "update", calendar);
        },
        eventDrop: (info) => {
            aggiornaDurataEvento(info, calendar);
        },
        eventAllow: (dropInfo, draggedEvent) => {
            const allow = data.servizi.db
                .find(
                    (servizio) =>
                        servizio.id == draggedEvent.extendedProps.prodotto
                )
                .id_membri.split(",")
                .includes(dropInfo.resource.id);
            if (allow && isWithinBusinessHours(dropInfo)) return true;
            else return false;
        },
        // Responsive
        selectLongPressDelay: 80,
        // Risorse ed eventi
        resources: risorse,
        eventSources: [
            {
                events: eventiOggi,
            },
            {
                events: data.team.db.map((membro) => {
                    return {
                        title: "Lunch",
                        resourceId: membro.id,
                        className: "lunch-event",
                        display: "background",
                        startTime: membro.inizio_pranzo,
                        endTime: membro.fine_pranzo,
                        color: "rgb(203 203 203)",
                        editable: false,
                    };
                }),
            },
            {
                events: data.chiusureEccezionali.map((giorno) => {
                    const event = {
                        title: "Ferie",
                        allDay: true,
                        start: giorno.data,
                        end: giorno.data,
                        editable: false,
                        color: "rgb(203 203 203)",
                        display: "background",
                        className: "chiusura-eccezionale",
                        resourceIds: giorno.id_membri.split(",").map(Number),
                    };
                    return event;
                }),
            },
        ],
    });

    calendar.render();

    function updateDate(date) {
        datePickerClass.hide();
        calendar.gotoDate(date.date);
    }
    const rect = document
        .querySelector(".fc-datePicker-button")
        .getBoundingClientRect();
    datePicker.style.display = "block";
    datePicker.style.top = `${rect.bottom + 5}px`;
    datePicker.style.left = `${rect.left + 5}px`;
}

function eventiOggi(fetchInfo, successCallback, failureCallback) {
    fetch(
        `/wp-json/gestionale/v1/admin/eventi?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`
    )
        .then((response) => response.json())
        .then((data) => {
            successCallback(data);
        })
        .catch((error) => failureCallback(error));
}
function isWithinBusinessHours(dropInfo) {
    // Get the day of the week and time of the dropInfo
    const dropDayOfWeek = dropInfo.start.getDay();
    const dropTime =
        dropInfo.start.getHours() * 60 + dropInfo.start.getMinutes();

    // Find the business hours for the day of the week
    const businessHours = data.giorniApertura.find((giorno) => {
        return giorno.id == (dropDayOfWeek != 7 ? dropDayOfWeek : 0);
    });
    console.log(businessHours);
    // If there are no business hours for this day, return false
    if (!businessHours) return false;

    // Convert business hours to minutes
    const openingTime =
        parseInt(businessHours.apertura.split(":")[0]) * 60 +
        parseInt(businessHours.apertura.split(":")[1]);
    const closingTime =
        parseInt(businessHours.chiusura.split(":")[0]) * 60 +
        parseInt(businessHours.chiusura.split(":")[1]);

    // Check if the dropTime is within the business hours
    return dropTime >= openingTime && dropTime <= closingTime;
}
function modificaEvento(form, info) {
    const props = info.event.extendedProps;
    form.nome_cliente.value = info.event.title;
    form.servizio.querySelector(
        `option[value="${props.prodotto}"]`
    ).selected = true;
    form.membro_team.querySelector(
        `option[value="${info.event._def.resourceIds[0]}"]`
    ).selected = true;
    const durata = props.durata.split(":");
    form.querySelector(
        `#durata option[value='${props.durata}']`
    ).selected = true;
    form.inNegozio.checked = props.in_negozio == "1" ? true : false;
    form.note.value = props.note;
    form.id_cliente = props.cliente;
}

function poupup(info, type, calendar) {
    const placement =
        info.jsEvent.clientX > window.innerWidth / 2 ? "left" : "right";
    let title;
    let element;
    let start;
    if (type == "update") {
        const start = {
            hours: info.event.start.getHours(),
            minutes: info.event.start.getMinutes(),
        };
        const end = {
            hours: info.event.end.getHours(),
            minutes: info.event.end.getMinutes(),
        };
        element = info.el;
        title = `${info.event.title} ${start.hours}:${start.minutes} - ${end.hours}:${end.minutes} (${info.event.extendedProps.prezzo}€)`;
    } else {
        const elements = document.querySelectorAll(
            ".fc-event-mirror .fc-event-title.fc-sticky"
        );

        for (let i = 0; i < elements.length; i++) {
            if (elements[i].innerHTML === "&nbsp;") {
                element = elements[i];
                break;
            }
        }
        if (!element) 
            return
        
        
        start = new Date(info.dateStr);
        const hours = start.getHours();
        const minutes = start.getMinutes();
        title = `Nuovo evento ${hours}:${minutes}`;
    }
    const popover = new bootstrap.Popover(element, {
        container: "body",
        html: true,
        title: title,
        placement: placement,
        content: "Caricamento...",
        trigger: "manual",
        customClass: "modifica-evento",
    });
    document.getElementById("overlay").style.display = "block";
    // Show the popover
    popover.show();
    document.querySelector(".popover-body").innerHTML = document.getElementById(
        "eventPopoverContent"
    ).innerHTML;
    const form = document.querySelector(".popover-body #evento");
    form.type = type;
    form.dataset.type = type;
    if (type == "update") {
        eliminaAppuntamento();
        modificaEvento(form, info);
        form.dataset.eventoId = info.event.id;
        form.dataset.prezzo = info.event.extendedProps.prezzo;
        form.dataset.prodotti = info.event.extendedProps.prodotti;
        const formPagamento = document.querySelector(
            ".popover-body #pagamentoForm"
        );
        formPagamento.importo.value = info.event.extendedProps.importo;
        formPagamento.metodo_pagamento.value =
            info.event.extendedProps.metodo_pagamento == null
                ? ""
                : info.event.extendedProps.metodo_pagamento;
        if (info.event.extendedProps.importo != null) {
            form.inNegozio.checked = false;
            form.inNegozio.disabled = true;
            form.querySelector("#pagamentoEffettuato").style.display =
                "inline-block";
        }
    } else {
        form.querySelector("#elimina-appuntamento").style.display = "none";
        form.membro_team.querySelector(
            `option[value="${info.resource.id}"]`
        ).selected = true;
    }

    ricercaCliente(form);
    form.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            return false;
        }
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const team_select = form.membro_team;
        const selectedOption_team =
            team_select.options[team_select.selectedIndex];
        if (selectedOption_team.disabled) {
            alert("Seleziona un membro del team valido");
            return;
        }
        let id;
        if (type == "update") {
            id = info.event.id;
            start = info.event.start.toLocaleString("en-US", {
                timeZone: "Europe/Rome",
                hour12: false,
            });
        } else {
            id = null;
            start = start.toLocaleString("en-US", {
                timeZone: "Europe/Rome",
                hour12: false,
            });
        }
        const data = {
            id: id,
            start: start,
            cliente: form.id_cliente,
            prodotto: form.servizio.options[form.servizio.selectedIndex].value,
            membro_team: selectedOption_team.value,
            durata: form.durata.options[form.durata.selectedIndex].value,
            in_negozio: form.inNegozio.checked,
            note: form.note.value,
        };
        fetch("/wp-json/gestionale/v1/admin/eventi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: type,
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data != "OK") {
                    alert("errore" + data);
                    hideTooltip();
                    return;
                }
                calendar.refetchEvents();
                hideTooltip();
            })
            .catch((error) => alert("Error:", error));
    });
    function eliminaAppuntamento() {
        form.querySelector("#elimina-appuntamento").addEventListener(
            "click",
            () => {
                if (!confirm("Sei sicuro di voler eliminare l'appuntamento?"))
                    return;
                fetch("/wp-json/gestionale/v1/admin/eventi", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id: info.event.id }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data != "OK") {
                            alert("errore" + data);
                            hideTooltip();
                            return;
                        }
                        calendar.refetchEvents();
                        hideTooltip();
                    })
                    .catch((error) => alert("Error:", error));
            }
        );
    }
}
function ricercaCliente(form) {
    const lista_clienti = form.querySelector("#lista_clienti");
    const clienti = lista_clienti.querySelectorAll("p");
    const scorrimento = form.querySelector(".scorrimento");
    for (let i = 0; i < clienti.length; i++) {
        clienti[i].addEventListener("click", (e) => {
            form.nome_cliente.value = e.target.textContent;
            form.id_cliente = e.target.id.split("_")[1];
            lista_clienti.style.display = "none";
            scorrimento.style.overflowY = "scroll";
        });
    }
    form.nome_cliente.addEventListener("input", (e) => {
        const value = e.target.value;
        scorrimento.style.overflowY = "hidden";
        lista_clienti.style.display = "block";
        for (let i = 0; i < clienti.length; i++) {
            if (
                clienti[i].textContent
                    .toLowerCase()
                    .includes(value.toLowerCase())
            ) {
                clienti[i].style.display = "block";
            } else {
                clienti[i].style.display = "none";
            }
        }
    });
}
function hideTooltip() {
    $(".popover").remove();
    document.getElementById("overlay").style.display = "none";
}
function aggiornaDurataEvento(info, calendar) {
    const date = new Date(info.event.start);
    const formattedDate =
        date.getDate() +
        " " +
        date.toLocaleString("it-IT", { month: "long" }) +
        " " +
        date.getFullYear() +
        " " +
        date.getHours().toString().padStart(2, "0") +
        ":" +
        date.getMinutes().toString().padStart(2, "0");
    if (
        !confirm(
            info.event.title +
                " è stato spostato al " +
                formattedDate +
                ". Confermi la modifica?"
        )
    ) {
        info.revert();
        return;
    }
    const props = info.event.extendedProps;
    const data = {
        id: info.event.id,
        start: info.event.start.toLocaleString("en-US", {
            timeZone: "Europe/Rome",
            hour12: false,
        }),
        cliente: props.cliente,
        prodotto: props.prodotto,
        membro_team: info.event._def.resourceIds[0],
        durata: props.durata,
        note: props.note,
    };
    fetch("/wp-json/gestionale/v1/admin/eventi", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            
            type: "update",
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data != "OK") {
                alert("errore" + data);
            }
            calendar.refetchEvents();
        })
        .catch((error) => alert("Error:", error));
}
function selectAllow(selectInfo) {
    const start = selectInfo.start;
    const end = selectInfo.end;
    const diff = (end - start) / 1000 / 30;
    return diff <= 30;
}
function checkTeam() {
    if (!adminRole) return;
    const form = document.querySelector(".popover-body #evento");
    const select = document.querySelector(".popover-body #servizio");
    const selectedOption = select.options[select.selectedIndex].value;
    const servizio = data.servizi.db.find(
        (servizio) => servizio.id == selectedOption
    );
    const team = servizio.id_membri.split(",");
    const selectTeam = document.querySelector(".popover-body #membro_team");
    selectTeam.querySelectorAll("option").forEach((option) => {
        if (team.includes(option.value)) {
            option.disabled = false;
        } else {
            option.disabled = true;
        }
    });
    console.log(servizio.tempo);
    if (form.type == "create") {
        form.querySelector(
            `#durata option[value='${servizio.tempo}']`
        ).selected = true;
    }
}
function creaCliente() {
    const formCliente = document.querySelector(".popover-body #creaCliente");
    const formEvento = document.querySelector(".popover-body #evento");
    const listaClientiForm = formEvento.querySelector("#lista_clienti");
    listaClientiForm.style.display = "none";
    formEvento.classList.remove("active");
    formCliente.classList.add("active");
    formCliente.addEventListener("submit", (e) => {
        e.preventDefault();
        const dataHttp = {
            nome: formCliente.nome.value,
            cognome: formCliente.cognome.value,
            email: formCliente.email.value,
            telefono: formCliente.telefono.value,
        };
        fetch("/wp-json/gestionale/v1/admin/clienti", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: "create",
                
            },
            body: JSON.stringify(dataHttp),
        })
            .then((response) => response.json())
            .then((jsonResponse) => {
                if (jsonResponse != "Update successful") {
                    alert("errore" + jsonResponse);
                    return;
                }
                dataHttp.id =
                    parseInt(data.clienti.db[data.clienti.db.length - 1].id) +
                    1;
                const p = document.createElement("p");
                p.id = "cliente_" + dataHttp.id;
                p.textContent = dataHttp.nome + " " + dataHttp.cognome;
                data.clienti.db.push(dataHttp);
                p.addEventListener("click", (e) => {
                    formEvento.nome_cliente.value = e.target.textContent;
                    formEvento.id_cliente = e.target.id.split("_")[1];
                    listaClientiForm.style.display = "none";
                    formEvento.querySelector(".scorrimento").style.overflowY =
                        "scroll";
                });
                listaClientiForm.append(p);
                document
                    .querySelector("#lista_clienti")
                    .appendChild(p.cloneNode(true));
                formEvento.nome_cliente.value =
                    dataHttp.nome + " " + dataHttp.cognome;
                formEvento.id_cliente = dataHttp.id;
                formCliente.classList.remove("active");
                formEvento.classList.add("active");
            })
            .catch((error) => alert("Error:", error));
    });
}

function pagamentoForm() {
    const formPagamento = document.querySelector(
        ".popover-body #pagamentoForm"
    );
    const formEvento = document.querySelector(".popover-body #evento");
    formPagamento.querySelector("p").textContent =
        "Il cliente deve pagare " + formEvento.dataset.prezzo + "€";
    formEvento.classList.remove("active");
    formPagamento.classList.add("active");
    const select = $(".popover-body #prodottiSelect");
    select.select2({
        data: data.prodotti,
        multiple: true,
        tokenSeparators: [",", " "],
    });
    select.val(formEvento.dataset.prodotti.split(",")).trigger("change");
    formPagamento.addEventListener("submit", (e) => {
        e.preventDefault();
        let data;
        if (e.submitter.value == "confirm") {
            data = {
                id: formEvento.dataset.eventoId,
                importo: formPagamento.importo.value,
                metodo_pagamento: formPagamento.metodo_pagamento.value,
                prodotti: select.val().join(","),
            };
        } else {
            data = {
                id: formEvento.dataset.eventoId,
                importo: null,
                metodo_pagamento: null,
                prodotti: null,
            };
        }
        console.log(data);
        fetch("/wp-json/gestionale/v1/admin/eventi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                
                type: "update",
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data != "OK") {
                    console.log(data);
                    alert("errore" + data);
                    return;
                }
                calendar.refetchEvents();
                hideTooltip();
            })
            .catch((error) => alert("Error:", error));
    });
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