async function fetchData() {
    const response = await fetch("/wp-json/gestionale/v1/admin/tabella/");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        const data = await response.json();
        console.log(data);
        return data;
    }
}
let columnsIndex = {};
let tabelle = {};

document.addEventListener("DOMContentLoaded", async () => {
    const data = await fetchData();
    createTables(data.team, data.servizi);
    addDataToTables(data.righe);
    // loadRowsService(data.dati_tabella, data.importo_team, tbody, data.importi_prodotti);
    // testFetch()
});
function addDataToTables(rows) {
    rows.forEach((row) => {
        const table = tabelle[row.id_team];
        const tbody = table.querySelector("tbody");
        createRow(row, tbody);
    });
}
function createTables(team, services) {
    const table = document.querySelector(".container");
    const template = table.cloneNode(true);
    table.remove();
    const body = document.querySelector("body");
    const head = template.querySelector("tr");
    services.forEach((service, index) => {
        head.insertAdjacentHTML(
            "beforeend",
            `<th scope="col">${service.nome} (${service.prezzo}€)</th>`
        );
        columnsIndex[service.nome] = index + 1;
    });
    head.insertAdjacentHTML("beforeend", `
    <th scope="col">Rivendita</th>
    <th scope="col">Totale</th>
    `
);
    team.forEach((team) => {
        const table = template.cloneNode(true);
        table.querySelector("h1").textContent = team.nome;
        const button = document.createElement("button");
        button.innerText = "Stampa";
        button.addEventListener("click", () => printElement(table.querySelector("table")));
        table.append(button)
        body.prepend(table);
        tabelle[team.id] = table;
    });
}
let totale = 0;
function rowTitles(nome, products) {
    return `
    <th scope="row">${nome}</th>
    <td>
    ${products}
    </td>
   `;
}
function addZeros(number) {
    let string = "";
    for (let i = 0; i < number; i++) {
        if(i === number - 1)
        string += "<td></td>";
    else
        string += "<td>0€</td>";
    }
    return string;
}

function createRow(row, tbody) {
    const tr = document.createElement("tr");
    totale += row.prezzo_prodotti
        .split(",")
        .reduce((sum, price) => sum + parseFloat(price), 0);
    tr.innerHTML =
        rowTitles(row.nome_cliente, row.prodotti) +
        addZeros(Object.keys(columnsIndex).length + 1);

    const importi = row.importi.split(",");
    row.servizi.split(",").forEach((service, index) => {
        const columnIndex = columnsIndex[service];
        tr.children[columnIndex + 1].innerHTML = `${importi[index]}€`;
        totale += parseFloat(importi[index]);
    });
    tr.insertAdjacentHTML("beforeend", `<td>${totale}€</td>`);
    totale = 0;
    tbody.append(tr);
}
function printElement(element) {
    const printContent = element.outerHTML;
    const stylesheets = Array.from(document.styleSheets)
        .map(
            (styleSheet) => `<link rel="stylesheet" href="${styleSheet.href}">`
        )
        .join("");

    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);

    iframe.contentDocument.write(`
        <html>
            <head>
                <title>Stampa</title>
                ${stylesheets}
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);

    iframe.contentDocument.close();

    iframe.onload = function () {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);

    };

    // Remove iframe after print
    iframe.onafterprint = function () {
        document.body.removeChild(iframe);
    };
}