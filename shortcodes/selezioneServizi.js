fetch("/wp-json/gestionale/clienti/serviziPrenotazioni/")
    .then((response) => response.json())
    .then((data) => displayData(data))
    .catch((error) => console.error(error));
function listaCategorie(categorie) {
    const categories = document.querySelector("#categories");
    const scelta_servizi = document.querySelector("#scelta_servizi");
	  var svgPath = "<?php echo $svg_path; ?>";
    	categorie.forEach((categoria, i) => {
        const li = document.createElement("li");
        li.innerText = categoria.nome;
        li.dataset.id_categoria = categoria.id;
        
        // Creazione dell'immagine SVG
        const img = document.createElement('img');
        img.src = "https://www.barberiagrazioso.com/wp-content/uploads/2024/07/Risorsa-1freccia.png";
        img.alt = 'Icona'; // Attributo alt per l'accessibilità
		img.style.width = '15px'; // Imposta la larghezza iniziale dell'immagine
        img.style.height = '8px'; 
		img.style.marginLeft = '86%';
		img.style.position = 'absolute';
        li.appendChild(img); // Aggiungi l'immagine come figlio dell'elemento <li>
        
			
			
        li.addEventListener("click", () => {
            document
                .querySelector(".listaServizi.active")
                .classList.remove("active");
            document
                .querySelector("#categories .active")
                .classList.remove("active");
            li.classList.add("active");
            document
                .querySelector(
                    `.listaServizi[data-id_categoria="${categoria.id}"]`
                )
                .classList.add("active");
        });
        categories.append(li);

        const ul = document.createElement("ul");
        ul.dataset.id_categoria = categoria.id;
        ul.classList.add("listaServizi");
        scelta_servizi.append(ul);

        if (i == 0) {
            li.classList.add("active");
            ul.classList.add("active");
        }
			 img.addEventListener("click", (event) => {
            event.stopPropagation(); // Impedisce al click di attivare anche l'event listener del <li>
            const activeSection = document.querySelector(".listaServizi.active");
            const sectionHeight = activeSection ? activeSection.offsetHeight : 0; // Ottieni l'altezza della sezione attiva
            window.scrollTo({
                top: sectionHeight,
                behavior: 'smooth'
            });
        });
    });
}
function listaServizi(servizi) {
    const template = document.createElement("li");
    template.innerHTML = `
    <div>
    <p class = "nome"></p>
    <span class = "tempo">
    </span>
    <span class = "dettagli">
    Dettagli
    </span>
    </div>
    <div>
    <p class = "costo">
    </p>
    <button type = "button" >
    Seleziona
    </button>
    </div>
    `;
    const serviziSelezionatiElement = document.querySelector(
        "#servizi_selezionati"
    );
    const poupup = document.querySelector("#poupup");
    console.log(poupup)
    servizi.forEach((servizio) => {
        const li = template.cloneNode(true);
        li.querySelector(".nome").innerText = servizio.nome;
        li.querySelector(".tempo").innerText = servizio.tempo.slice(0, -3);
        li.querySelector(".costo").innerText = servizio.prezzo + " €";
        const button = li.querySelector("button");
        button.dataset.id_servizio = servizio.id;
        button.addEventListener("click", (e) => {
            selezionaServizio(e, serviziSelezionatiElement, servizi,li);
        });
        li.querySelector(".dettagli").addEventListener("click", () => {
            poupup.classList.add("active");
            poupup.querySelector("h2").innerText = servizio.nome;
            poupup.querySelector("p").innerText = servizio.descrizione;
        });
        li.dataset.id_servizio = servizio.id;
        document
            .querySelector(
                `.listaServizi[data-id_categoria="${servizio.id_categoria}"]`
            )
            .append(li);
    });
}
let serviziAttuali = 0;
let costoAttuale = 0;
let tempoAttuale = 0;
let serviziSelezionati = [];
function selezionaServizio(e, serviziSelezionatiElement, servizi, li) {
    const id = e.target.dataset.id_servizio;
    const servizio = servizi.find((servizioDb) => {
        return servizioDb.id == id;
    });
    if (!e.target.classList.contains("active")) {
        serviziSelezionati.push(id);
        e.target.classList.add("active");
        li.classList.add("active");
        e.target.innerText = "Selezionato";
        serviziSelezionatiElement.classList.add("active");
        costoAttuale += parseInt(servizio.prezzo);
        tempoAttuale += stringToMinutes(servizio.tempo)
        serviziAttuali++;
    } else {
        e.target.classList.remove("active");
        li.classList.remove("active");
        e.target.innerText = "Seleziona";
        tempoAttuale -= stringToMinutes(servizio.tempo);
        costoAttuale -= parseInt(servizio.prezzo);
        serviziAttuali--;
        if(serviziAttuali == 0)
            serviziSelezionatiElement.classList.remove("active");
        if(!serviziSelezionati.includes(id)) return
        serviziSelezionati = serviziSelezionati.filter(
            (servizio) => servizio !== id
        );
    }
    const tempo = minutesToString(tempoAttuale)
    const numeroServizi = serviziSelezionatiElement.querySelector("p");
    numeroServizi.innerHTML =
        serviziAttuali == 1
            ? `${serviziAttuali} Servizio <b>${costoAttuale}€</b><br>${tempo}`
            : `${serviziAttuali} Servizi <b>${costoAttuale}€</b><br>${tempo}`;
    
}
function stringToMinutes(time){
    const [ore, minuti] = time.split(":")
    return parseInt(ore) * 60 + parseInt(minuti)
}
function minutesToString(minutes){
    const ore = Math.floor(minutes / 60)
    const minuti = minutes % 60
    return ore + ":" + (minuti < 10 ? "0" + minuti : minuti);
}
function invioSelezione(){
    document.querySelector("#servizi_selezionati").addEventListener("click", () => {
        const serviziSelezionatiString = serviziSelezionati.join(",");
        const sessionId =
            "sess-" +
            Math.random().toString(36).slice(2) +
            Date.now().toString(36);
        window.location.href = `https://barberiagrazioso.com/disponibilita?servizi=${serviziSelezionatiString}&durata=${tempoAttuale}&session=${sessionId}`;
    })
}

async function displayData(data) {
    await new Promise((resolve) => {
        if (document.readyState !== "loading") {
            resolve();
        } else {
            document.addEventListener("DOMContentLoaded", resolve);
        }
    });
    console.log(data);
    listaCategorie(data.categorie);
    listaServizi(data.servizi);
    invioSelezione()
}
