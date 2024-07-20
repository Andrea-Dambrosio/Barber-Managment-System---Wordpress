<?php

function handleServiziPrenotazioni($request)
{
    global $wpdb;
    $prefix = $wpdb->prefix . "gestionale_";
    $servizi = $wpdb->get_results(
        "SELECT
    p.nome,
    p.id,
    p.prezzo,
    p.tempo, 
    p.descrizione,
    p.categoria as id_categoria
    FROM {$prefix}servizi as p
    ORDER BY p.nome asc 
    ",
        ARRAY_A
    );
    $categorie = $wpdb->get_results(
        "SELECT * FROM {$prefix}categorie ORDER BY nome asc
    ",
        ARRAY_A
    );

    if ($servizi == false || $wpdb->last_error) {
        return "Errore: " . $wpdb->last_error;
    }
    return array(
        "servizi" => $servizi,
        "categorie" => $categorie
    );

}

function handleDisponibilitaPrenotazioni($request)
{
    global $wpdb;
    $prefix = $wpdb->prefix . "gestionale_";
    $result = $wpdb->get_results(
        "SELECT
    DATE(a.start) as date,
    a.membro_team,
    a.start,
    ADDTIME(a.start, a.durata) as end
    FROM {$prefix}appuntamenti a
    WHERE 
    a.start > NOW()
    ORDER BY a.start
    ",
        ARRAY_A
    );
    if ($wpdb->last_error) {
        return "Errore: " . $wpdb->last_error;
    }
    $workingHours = $wpdb->get_results(
        "SELECT
        id,
    apertura as start,
    chiusura as end
    FROM {$prefix}gestione_apertura
    ORDER BY id asc
    ",
        ARRAY_A
    );
    $dateTime = new DateTime('now', new DateTimeZone('Europe/Rome'));
    $current_minutes = intval($dateTime->format('i'));
    $rounded_minutes = ceil($current_minutes / 10) * 10;
    if ($rounded_minutes >= 60) {
        $dateTime->modify('+1 hour');
        $rounded_minutes = 0; // Reset dei minuti se superano 59
    }
    $current_time = $dateTime->format('H') . ':' . str_pad($rounded_minutes, 2, '0', STR_PAD_LEFT) . ':00';
    $current_date = $dateTime->format('Y-m-d');
    $requestedDurationSeconds = $request['durata'] * 60;
    $availableSlots = [];
    $lastEndTimes = [];

    // Membri disponibili
    $id_servizi = $request["servizi"];
    $num_servizi = count(explode(',', $id_servizi));
    $availableTeam = $wpdb->get_results(
        "SELECT 
    u.display_name as nome,
    u.ID as id,
    u.inizio_pranzo,
    u.fine_pranzo
    FROM {$wpdb->prefix}users u
    WHERE (
        SELECT COUNT(DISTINCT p.id_prodotto)
        FROM {$prefix}team_prodotti as p
        WHERE p.id_team = u.ID AND p.id_prodotto IN ($id_servizi)
    ) = $num_servizi 
    ",
        ARRAY_A
    );
    $today = [];
    foreach ($availableTeam as $teamMember) {
        $today[$teamMember["id"]] = false;
        $availableSlots[$teamMember["id"]] = [];
    }

    foreach ($result as $row) {
        $teamMember = $row["membro_team"];
        $date = $row["date"];
        $dayOfWeek = date("N", strtotime($date));
        $workingHoursOfDay = $workingHours[$dayOfWeek - 1];
        if ($date == $current_date) {
            $today[$teamMember] = true;
            if ($workingHoursOfDay["start"] < $current_time) {
                $workingHoursOfDay = array(
                    "start" => $current_time,
                    "end" => $workingHoursOfDay["end"]
                );
            }
        }

        $start = substr($row["start"], 11); // Estrae solo l'orario
        $end = substr($row["end"], 11); // Estrae solo l'orario
        if (!isset($availableSlots[$teamMember][$date])) {
            $availableSlots[$teamMember][$date] = "non disponibile";
        }
        if (!isset($lastEndTimes[$teamMember][$date])) {
            $lastEndTimes[$teamMember][$date] = $workingHoursOfDay['start'];
        }

        $startTimestamp = strtotime($start);
        $lastEndTimestamp = strtotime($lastEndTimes[$teamMember][$date]);
        // Se c'è un gap tra l'ultimo 'end' e il prossimo 'start', allora è uno slot disponibile
        if ($start > $lastEndTimes[$teamMember][$date]) {

            // Calcola la durata dello slot
            $slotDuration = $startTimestamp - $lastEndTimestamp;
            // Se la durata dello slot è maggiore o uguale alla durata richiesta, allora aggiungi lo slot
            if ($slotDuration >= $requestedDurationSeconds) {
                if ($availableSlots[$teamMember][$date] == "non disponibile") {
                    $availableSlots[$teamMember][$date] = array();
                }
                $availableSlots[$teamMember][$date][] = array('start' => $lastEndTimes[$teamMember][$date], 'end' => $start);
            }
        }

        $lastEndTimes[$teamMember][$date] = $end;
    }
    foreach($today as $teamMember => $isTodayCounted){
        
        if($isTodayCounted){
            error_log("$teamMember is arleady counted");
            continue;
        }
            $workingHoursOfDay = $workingHours[date("N", strtotime($current_date)) - 1];
            error_log("$teamMember is not counted");
            if($workingHoursOfDay["end"] < $current_time)
                $availableSlots[$teamMember][$current_date] = "non disponibile"; 
            elseif($current_time > $workingHoursOfDay["start"]){
                $availableSlots[$teamMember][$current_date] = array();
                $availableSlots[$teamMember][$current_date][] = array('start' => $current_time, 'end' => $workingHoursOfDay["end"]);
            }
    }
    // Controlla se c'è uno slot disponibile alla fine della giornata
    foreach ($lastEndTimes as $teamMember => $dates) {
        foreach ($dates as $date => $lastEnd) {
            $dayOfWeek = date("N", strtotime($date));
            $workingHoursOfDay = $workingHours[$dayOfWeek - 1];
            $end = $workingHoursOfDay['end'];
            $endTimestamp = strtotime($end);
            $lastEndTimestamp = strtotime($lastEnd);
            if ($lastEnd < $end) {
                // Calcola la durata dello slot
                $slotDuration = $endTimestamp - $lastEndTimestamp;
                // Se la durata dello slot è maggiore o uguale alla durata richiesta, allora aggiungi lo slot
                if ($slotDuration >= $requestedDurationSeconds) {
                    if ($availableSlots[$teamMember][$date] == "non disponibile") {
                        $availableSlots[$teamMember][$date] = array();
                    }
                    $availableSlots[$teamMember][$date][] = array('start' => $lastEnd, 'end' => $end);
                }
            }
        }
    }
    
    $servizi = $wpdb->get_results(
        "SELECT 
        p.id,
        p.nome,
        p.tempo,
        p.prezzo
        FROM {$prefix}servizi p
        WHERE p.id IN ($id_servizi)
        "
    );
    $chiusureEccezionali = $wpdb->get_results(
        "SELECT 
        giorno,
        GROUP_CONCAT(utente) as id_team
        FROM {$prefix}giorni_eccezionali p
        WHERE 
        giorno >= CURDATE()
        GROUP BY giorno
        "
    );
    ;
    $giorniChiusura = [];
    $orarioApertura = [];
    foreach ($workingHours as $day) {
        $id = intval($day["id"]);
        $key = $id == 7 ? 0 : $id;
        unset($day["id"]);
        if ($day['start'] === '00:00:00' && $day['end'] === '00:00:00') {
            $giorniChiusura[] = $key;
            continue;
        }
        $orarioApertura[$key] = $day;

    }

    return array(
        "disponibilita" => $availableSlots,
        "team" => $availableTeam,
        "servizi" => $servizi,
        "giorniChiusura" => $giorniChiusura,
        "chiusureEccezionali" => $chiusureEccezionali,
        "orarioApertura" => $orarioApertura
    );
}
function createEvent($request)
{

    switch ($request->get_method()) {
        case 'POST':
            return createEventPost($request);
        case 'GET':
            return createEventGet($request);
        default:
            return 'Metodo non consentito';
    }

}
function gestioneCliente($data, $wpdb)
{
    $nome = strtolower(trim($data['nome']));
    $cognome = strtolower(trim($data['cognome']));

    // Cerca l'utente nel database
    $user = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id 
        FROM {$wpdb->prefix}gestionale_clienti 
        WHERE LOWER(nome) = %s AND LOWER(cognome) = %s",
            $nome,
            $cognome
        )
    );
    // Se l'utente non esiste, crealo
    if ($user) {
        return $user->id;
    }
    $wpdb->insert(
        $wpdb->prefix . 'gestionale_clienti',
        array(
            'nome' => trim($data['nome']),
            'cognome' => trim($data['cognome']),
            'telefono' => trim($data['telefono']),
            'email' => trim($data['email']),
        )
    );
    if ($wpdb->last_error) {
        status_header(500);
        error_log('Database Error: ' . $wpdb->last_error);
        throw new Exception('Database Error: ' . $wpdb->last_error);
    }
    return $wpdb->insert_id;
}

function trovaServizio($servizi, $wpdb)
{
    $servizi = explode(',', $servizi);
    $servizi = array_map('intval', $servizi);
    $servizi = implode(',', $servizi);
    $servizi = $wpdb->get_results(
        "SELECT 
        id, TIME_TO_SEC(tempo) / 60 as tempo, nome
    FROM {$wpdb->prefix}gestionale_servizi
    WHERE id IN ({$servizi})
    ",
        ARRAY_A
    );
    return $servizi;
}
function createEventPost($request)
{
    global $wpdb;
    $prefix = $wpdb->prefix . "gestionale_";
    $data = json_decode($request->get_body(), true);
    $idCliente = gestioneCliente($data, $wpdb);
    $servizi = trovaServizio($data["servizi"], $wpdb);
    $last_date = $data["data"];

    
    if ($data['team'] == 0) {
        $end_time = date('Y-m-d H:i:s', strtotime($last_date) + $data['durata'] * 60);
        $query = $wpdb->prepare(
            "SELECT ID FROM {$wpdb->prefix}users
        WHERE ID NOT IN 
        (SELECT membro_team FROM {$prefix}appuntamenti WHERE 
        ((start < %s AND ADDTIME(start, durata) > %s) OR 
        (start < %s AND ADDTIME(start, durata) >= %s) OR 
        (start <= %s AND ADDTIME(start, durata) > %s))) 
        LIMIT 1",
            $last_date,
            $last_date,
            $end_time,
            $end_time,
            $last_date,
            $end_time
        );
        $data['team'] = $wpdb->get_var($query);
        if ($data['team'] === null) {
            error_log("Nessun membro del team disponibile");
            return "Nessun membro del team disponibile";
        }
    }   
    $services = '';

    foreach ($servizi as $servizio) {
        $wpdb->insert(
            $wpdb->prefix . 'gestionale_appuntamenti',
            array(
                'cliente' => $idCliente,
                'membro_team' => $data['team'],
                'start' => $last_date,
                'note' => $data['note'],
                'prodotto' => $servizio["id"]
            )
        );
        $timestamp = strtotime($last_date);

        // Verifica se la conversione ha avuto successo
        if ($timestamp === false) {
            error_log("Errore nella conversione della data: " . $last_date);
            return "Errore nella conversione della data: " . $last_date;
        } else {
            // Aggiungi i minuti
            $timestamp += $servizio['tempo'] * 60;

            // Converti il timestamp in una data
            $last_date = date('Y-m-d H:i:s', $timestamp);

            // Verifica se la conversione ha avuto successo
            if ($last_date === false) {
                error_log("Errore nella conversione del timestamp: " . $timestamp);
                return "Errore nella conversione del timestamp: " . $timestamp;
            }
        }
        if ($wpdb->last_error) {
            status_header(500);
            return 'Database Error: ' . $wpdb->last_error;
        }
        if(!$services == '')
        $services .= ', ';
    
        $services .= $servizio["nome"];
    }
    
    // $to = $data['email'];
    $membro_team = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT display_name as nome
        FROM {$wpdb->prefix}users
        WHERE id = %d",
            $data["team"]
        ),
        ARRAY_A
    );
    $dateTime = DateTime::createFromFormat('Y-m-d H:i:s', $data["data"]);

    // Formattazione dell'oggetto DateTime nel nuovo formato senza secondi
    $formattedDate = $dateTime->format('d/m/Y H:i');

    $to = $data["email"];
    // $to = "andreanew04@gmail.com,mauroda2004@gmail.com";
    $subject = 'Barberia Grazioso - Conferma Prenotazione';
    $giorno = explode(" ", $data["data"])[0];
    $message = <<<HTML
    <html>
    <body>
        <h1>{$data["nome"]} {$data["cognome"]} hai prenotato un appuntamento.</h1>
        <p>Grazie per averci scelto. Ti aspettiamo il $giorno</p>
        <p>Dettagli appuntamento:</p>
        <ul>
            <li>Collaboratore: {$membro_team["nome"]}</li>
            <li>Data e ora: {$formattedDate}</li>
            <li>Durata: {$data["durata"]} minuti</li>
            <li>Servizi: {$services}</li>
        </ul>
        <b>QUESTA E' UNA FASE DI TEST</b>
    </body>
    </html>
HTML;
    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($to, $subject, $message, $headers);
    return "OK";

}
function createEventGet($request)
{
    global $wpdb;
    $ids = explode(',', $request["team"]);
    $ids = array_map('intval', $ids); // Ensure each ID is an integer to prevent SQL injection
    $ids = implode(',', $ids); // Convert the array back to a string

    $team = $wpdb->get_results(
        "SELECT display_name as name
    FROM {$wpdb->prefix}users
    WHERE ID IN ({$ids})"
        ,
        ARRAY_A
    );
    $ids = explode(',', $request["servizi"]);
    $ids = array_map('intval', $ids); // Ensure each ID is an integer to prevent SQL injection
    $ids = implode(',', $ids);
    if ($wpdb->last_error) {
        status_header(500);
        return 'Database Error: ' . $wpdb->last_error;
    }
    $servizi = $wpdb->get_results(
        "SELECT nome
    FROM {$wpdb->prefix}gestionale_servizi
    WHERE ID IN ({$ids})
        ",
        ARRAY_A
    );
    if ($wpdb->last_error) {
        status_header(500);
        return 'Database Error: ' . $wpdb->last_error;
    }
    return array(
        "team" => $team,
        "servizi" => $servizi
    );

}



