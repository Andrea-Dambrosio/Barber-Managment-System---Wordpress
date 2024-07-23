async function fetchData() {
    return fetch("/wp-json/gestionale/v1/admin/prodotti/", {
        headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": nonce,
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data == "KO") {
                alert(data);
                return data;
            }
            console.log(data);
            return data;
        })
        .catch((error) => {
            console.error("Error:", error);
        });
        
}
const template = document.createElement("tr");
template
template.innerHTML = `
    <td>Nessun Prodotto</td>
                    <td>Nessun Prodotto</td>
                    <td>Nessun Prodotto</td>
                    <td>Nessun Prodotto</td>
`;
template.dataset.bsToggle = "offcanvas";
template.dataset.id = "1";
template.dataset.bsTarget = "#offcanvasRight";
template.setAttribute("aria-controls", "offcanvasRight");

function displayData(prodotti) {
    const tbody = document.querySelector("tbody");
    tbody.querySelectorAll("tr").forEach((e) => e.remove());
    if (prodotti.length == 0) {

        tbody.appendChild(template.cloneNode(true));
        return;
    }
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < prodotti.length; i++) {
        const clone = template.cloneNode(true);
        const td = clone.querySelectorAll("td");
        clone.dataset.id = prodotti[i].id;
        td[0].textContent = prodotti[i].brand;
        td[1].textContent = prodotti[i].nome;
        td[2].textContent = prodotti[i].prezzo;
        td[3].textContent = prodotti[i].quantita;
        fragment.appendChild(clone);
    }
    tbody.appendChild(fragment);
}
document.addEventListener("DOMContentLoaded", async () => {
    let data = await fetchData();
    displayData(data.prodotti);
    ricercaTabella();
    const updateForm = document.getElementById("updateProduct");
    datiProdottoPassaggioOffcanvas(data.prodotti, updateForm);
    submitUpdateProduct(updateForm);
    newProductCreation();
});
function ricercaTabella() {
    document
        .getElementById("searchInput")
        .addEventListener("keyup", function () {
            const searchQuery = this.value.toLowerCase();
            const tableRows = document.querySelectorAll("tbody tr");
            tableRows.forEach((row) => {
                const rowText = row.textContent.toLowerCase();
                if (rowText.includes(searchQuery)) {
                    row.style.display = ""; // Show row
                } else {
                    row.style.display = "none"; // Hide row
                }
            });
        });
}
function datiProdottoPassaggioOffcanvas(prodotti, form) {
    const offcanvasElement = document.getElementById("offcanvasRight");
    offcanvasElement.addEventListener("show.bs.offcanvas", function (event) {
        const id = event.relatedTarget.dataset.id;
        form.dataset.id = id;
        const prodotto = prodotti.find((e) => e.id == id);
        form.nome.value = prodotto.nome;
        form.brand.value = prodotto.brand;
        form.prezzo.value = prodotto.prezzo;
        form.quantita.value = prodotto.quantita;
    });
}
function submitUpdateProduct(form) {
    const updateOffcanvas = new bootstrap.Offcanvas(
        document.getElementById("offcanvasRight")
    );
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        update("update");
    });
    form.querySelector("#deleteProduct").addEventListener("click", (event) => {
        event.preventDefault();
        update("delete");
    });
    function update(type) {
        let data = {};
        const formData = new FormData(form);
        formData.forEach((value, key) => {
            data[key] = value;
        });
        data.id = form.dataset.id;
        console.log(data);
        fetch("/wp-json/gestionale/v1/admin/prodotti/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: type,
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then(async (data) => {
                if (data != "OK") {
                    alert(data);
                    return;
                }
                const fetchedData = await fetchData();
                displayData(fetchedData.prodotti);
                updateOffcanvas.hide();
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }
}
function newProductCreation() {
    const form = document.getElementById("createProduct");
    const modal = new bootstrap.Modal(
        document.getElementById("newProductModal")
    );
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        let data = {};
        const formData = new FormData(form);
        formData.forEach((value, key) => {
            data[key] = value;
        });
        console.log(data);
        fetch("/wp-json/gestionale/v1/admin/prodotti/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                type: "create",
                "X-WP-Nonce": nonce,
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then(async (data) => {
                if (data != "OK") {
                    alert(data);
                    return;
                }
                const fetchedData = await fetchData();
                displayData(fetchedData.prodotti);
                modal.hide();
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    });
}
