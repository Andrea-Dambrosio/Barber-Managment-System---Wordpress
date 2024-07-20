<?php
function selezioneServiziShort()
{
    wp_enqueue_script(
        'selezione-servizi', 
        plugin_dir_url(__FILE__) . 'selezioneServizi.js', 
        array(), 
        false, 
        true 
    );
    wp_enqueue_style(
        'selezione-stile', 
        plugin_dir_url(__FILE__) . 'selezioneServizi.css' 
    );

return <<<HTML
<section id="scelta_servizi">
    <ul id="categories">
    </ul>
</section>
<section id="servizi_selezionati">
    <p>
    </p>
    <button>Continua</button>
</section>
<div id = "poupup">
        <span onclick="document.getElementById('poupup').classList.remove('active')">X</span>
        <h2>Titolo</h2>
        <p>Testo</p>
    </div>
HTML;

}
add_shortcode('selezione_servizi', 'selezioneServiziShort');
function selezioneDisponibilitaShort()
{
    wp_enqueue_script(
        'date-pickerJS', 
        plugin_dir_url(__FILE__) . '../templates/datePicker/air-datepicker.min.js', 
        [], 
        false, 
        true 
    );
    wp_enqueue_style(
        'selezione-disponibilita', 
        plugin_dir_url(__FILE__) . 'selezioneDisponibilita.css' 
    );
    wp_enqueue_style(
        'date-pickerCS', 
        plugin_dir_url(__FILE__) . '../templates/datePicker/air-datepicker.min.css' 
    );
    wp_enqueue_script(
        'selezione-disponibilita', 
        plugin_dir_url(__FILE__) . 'selezioneDisponibilita.js', 
        [], 
        false, 
        true 
    );

return <<<HTML
    <div id = "selezione_disponibilita">
        <div id = "orari">
            <select id = "team">
            </select>
            <span id = "selezionaTeam">Seleziona un membro del team</span>
            <div id = "datepicker"></div>

            <div id = "timepicker"></div>
        </div>
        <div id = "riepilogo">
            <div id = "wrapper_button">        
            <button disabled onclick = "confermaPrenotazione()">
                Conferma prenotazione
            </button>
    </div>

        </div>
</div>
    
HTML;

}
add_shortcode('selezione_disponibilita', 'selezioneDisponibilitaShort');

function formConferma(){
    wp_enqueue_script(
        'form-confermaJs', 
        plugin_dir_url(__FILE__) . 'formConferma.js', 
        array(), 
        false, 
        true 
    );
    wp_enqueue_style(
        'form-confermaCss', 
        plugin_dir_url(__FILE__) . 'formConferma.css' 
    );

    return <<<HTML
<div class="container">
    <div class="left-content">
        <form id = "form_cliente" autocomplete = "off">
        <label for="nome">Nome:</label><br>
        <input required type="text" id="nome" name="nome" maxlength="265"><br>
        <label for="cognome">Cognome:</label><br>
        <input required type="text" id="cognome" name="cognome" maxlength="265"><br>
        <label for="email">Email:</label><br>
        <input required type="email" id="email" name="email" maxlength="320"><br>
        <label for="telefono">Numero di telefono:</label><br>
        <input required type="tel" id="telefono" name="telefono" pattern="^\+?\d{10,15}$" maxlength="265"><br>
        <label for="note" maxlength="265">Note:</label><br>
        <textarea id="note" name="note"></textarea><br>
        <input required type="checkbox" id="consenso" name="consenso" value="consenso">
        <label for="consenso">Do il mio consenso per il trattamento dei dati e l'invio delle email</label><br>
        <input type="submit" value="Submit">
    </form>
    </div>
    <div class="right-content">
        <!-- Contenitore sticky a destra -->
        <h2>Riepilogo appuntamento:</h2>
        <p id = "data"> Data: <br></p>
        <p id = "durata"> Durata: <br></p>
        <p id = "servizi"> Servizi: <br></p>
        <p id = "collaboratore"> Collaboratore: <br></p>
        <p id = "costo"> Costo: <br></p>
        <!-- Aggiungi altro contenuto qui -->
    </div>
</div>
HTML;

}
add_shortcode('form_conferma', 'formConferma');
