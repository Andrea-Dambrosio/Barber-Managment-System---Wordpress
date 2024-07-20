<?php
function handleInformazioniNegozio($request)
{
    global $wpdb;
    $prefix = $wpdb->prefix;
    $data = array(
        'servizi' => getServiziDb($wpdb),
        'team' => getTeamDb($prefix, ["ID", "display_name"], ["inizio_pranzo", "fine_pranzo"]),
        'clienti' => getClientiDb($wpdb),
        "giorniApertura" => $wpdb->get_results(
            "SELECT id, TIME_FORMAT(apertura, '%H:%i') as apertura, TIME_FORMAT(chiusura, '%H:%i') as chiusura 
        FROM " . $prefix . "gestionale_gestione_apertura
        WHERE apertura != '00:00:00' and chiusura != '00:00:00'
        "
        ),
        "chiusureEccezionali" => $wpdb->get_results(
            "SELECT DATE_FORMAT(e.giorno, '%Y-%m-%d') as data, GROUP_CONCAT(U.id SEPARATOR ',') AS id_membri
        FROM " . $wpdb->prefix . "gestionale_giorni_eccezionali as e
        INNER JOIN " . $wpdb->prefix . "users as U 
        on e.utente = U.ID
        GROUP BY
        e.giorno
        "
        ),
        "prodotti" => $wpdb->get_results(
            "SELECT id, CONCAT(nome, ' - ', prezzo, ' €') as text FROM " . $wpdb->prefix . "gestionale_prodotti"

        ),
    );
    return $data;
}
function handleEventi($request)
{
    global $wpdb;
    $method = $request->get_method();
    switch ($method) {
        case 'POST':
            return postEvento($request);
        case 'GET':
            return getEventi($request, $wpdb);
        case "DELETE":
            return deleteEvento($request, $wpdb);
        default:
            return new WP_Error('method_not_allowed', 'Bad Request, method not allowed', array('status' => 400));
    }
}
function deleteEvento($request, $wpdb)
{
    $result = $wpdb->delete($wpdb->prefix . 'gestionale_appuntamenti', ['id' => $request->get_param('id')]);
    return check_error($result, $wpdb->last_error);
}
function postEvento($request)
{
    global $wpdb;
   
    if ($request->get_header('type') == 'update') {
        $data = json_decode($request->get_body(), true);
        if (isset($data["start"])) {
            $date = DateTime::createFromFormat('m/d/Y, H:i:s', $data["start"]);
            $data["start"] = $date->format('Y-m-d H:i:s');
        }

        $result = $wpdb->update($wpdb->prefix . 'gestionale_appuntamenti', $data, ['id' => $data['id']]);
        return check_error($result, $wpdb->last_error);
    } else {
        $data = json_decode($request->get_body(), true);
        $date = DateTime::createFromFormat('m/d/Y, H:i:s', $data["start"]);
        $data["start"] = $date->format('Y-m-d H:i:s');
        $result = $wpdb->insert($wpdb->prefix . 'gestionale_appuntamenti', $data);
        return check_error($result, $wpdb->last_error);


    }
}
function getEventi($request, $wpdb)
{
    $start = $request->get_param('start');
    $end = $request->get_param('end');
    $eventi = $wpdb->get_results(
        "SELECT 
        eventi.*, clienti.nome as nome, clienti.cognome as cognome, servizi.tempo as tempo_prodotto, servizi.prezzo as prezzo
        FROM " . $wpdb->prefix . "gestionale_appuntamenti as eventi
        inner join " . $wpdb->prefix . "gestionale_clienti as clienti
        on eventi.cliente = clienti.id
        inner join " . $wpdb->prefix . "gestionale_servizi as servizi
        on eventi.prodotto = servizi.id
        where start >= '$start' and start <= '$end'
        ",
        ARRAY_A
    );
    $eventi = array_map(function ($evento) {
        $timezone = new DateTimeZone('Europe/Rome');
        $timezone = new DateTimeZone('Europe/Rome');

        $date_start = new DateTime($evento['start'], $timezone);
        $date_start->setTimezone($timezone);
        $evento['start'] = $date_start->format(DateTime::ATOM);
        if ($evento["durata"] == "00:00:00") {
            $evento["durata"] = $evento['tempo_prodotto'];
        }

        $date_end = new DateTime($evento['start'], $timezone);
        $date_end->setTimezone($timezone);
        list ($hours, $minutes, $seconds) = explode(':', $evento["durata"]);
        $interval = new DateInterval(sprintf('PT%dH%dM%dS', $hours, $minutes, $seconds));
        $date_end->add($interval);
        $evento['end'] = $date_end->format(DateTime::ATOM);

        $color = "";
        if ($evento["in_negozio"] == 1) {
            $color = "#7393B3";
        }
        if ($evento["metodo_pagamento"] == "carta") {
            $color = "#999959AD";
        } elseif ($evento["metodo_pagamento"] == "contanti") {
            $color = "#016b0075";
        }

        // Restituisci un array associativo con solo le chiavi che ti interessano
        return [
            'id' => $evento['id'],
            'title' => $evento['nome'] . ' ' . $evento['cognome'],
            'nome' => $evento['nome'],
            'cognome' => $evento['cognome'],
            'start' => $evento['start'],
            'end' => $evento['end'],
            'durata' => $evento['durata'],
            'note' => $evento['note'],
            'prezzo' => $evento['prezzo'],
            'cliente' => $evento['cliente'],
            'prodotto' => $evento['prodotto'],
            'resourceId' => $evento['membro_team'],
            "in_negozio" => $evento["in_negozio"],
            "importo" => $evento["importo"],
            "metodo_pagamento" => $evento["metodo_pagamento"],
            "color" => $color,
            "prodotti" => $evento["prodotti"],
        ];
    }, $eventi);

    if ($wpdb->last_error) {
        return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));

    } else if ($eventi === false) {
        return new WP_Error('no_rows_updated', 'Bad Request, no rows updated', array('status' => 400));

    } else {
        return $eventi;
    }
}
