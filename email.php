<?php

if (!wp_next_scheduled('email_prenotazioni')) {
    wp_schedule_event(strtotime('00:10:00'), 'daily', 'email_prenotazioni');
}

add_action('email_prenotazioni', 'handle_email');
function handle_email()
{
    global $wpdb;
    $prefix = $wpdb->prefix . "gestionale_";
    $query =
        "SELECT 
DATE_FORMAT(MIN(a.start), '%d/%m/%Y %H:%i') as start, 
GROUP_CONCAT(s.nome, '') as servizi, 
SEC_TO_TIME(SUM(TIME_TO_SEC(IF(a.durata = '00:00:00', s.tempo, a.durata)))) as durata, 
MAX(u.display_name) as nome_team, 
CONCAT(c.nome,' ', c.cognome) as nome_cliente, 
MIN(c.email) as email
FROM {$prefix}appuntamenti a
INNER JOIN {$prefix}clienti c ON a.cliente = c.id
INNER JOIN {$wpdb->prefix}users u ON u.ID = a.membro_team
INNER JOIN {$prefix}servizi s ON s.id = a.prodotto
WHERE  DATE_ADD(CURDATE(), INTERVAL 1 DAY) = DATE(start) 
AND (a.importo IS NULL OR a.importo = '')
GROUP BY a.cliente
";
    $appuntamenti = $wpdb->get_results($query, ARRAY_A);
    foreach ($appuntamenti as $appuntamento) {
        $to = $appuntamento['email'];
        // $to = "andrea.dambrosio.mail@gmail.com,mauroda2004@gmail.com";
        $subject = 'Reminder appuntamento';
        $durata = substr($appuntamento["durata"], 0, -3);
        $image_url = "https://www.barberiagrazioso.com/wp-content/uploads/2024/06/favicon.png"; // Sostituisci con l'URL dell'immagine

        $message = <<<HTML
    <html>
    <body>
        <h1>{$appuntamento["nome_cliente"]} ti aspettiamo domani per il tuo appuntamento.</h1>
        <p>Grazie per aver scelto la nostra barberia. Ti aspettiamo domani!</p>
        <p>Dettagli appuntamento:</p>
        <ul>
            <li>Nome team: {$appuntamento["nome_team"]}</li>
            <li>Nome cliente: {$appuntamento["nome_cliente"]}</li>
            <li>Data e ora: {$appuntamento["start"]}</li>
            <li>Durata: {$durata} (HH:MM)</li>
            <li>Servizi: {$appuntamento["servizi"]}</li>
        </ul>
        <img src="{$image_url}" alt="Immagine di profilo" style="width:100px;height:100px;">
        <b>QUESTA E' UNA FASE DI TEST</b>
    </body>
    </html>
HTML;
        $headers = array('Content-Type: text/html; charset=UTF-8');
        wp_mail($to, $subject, $message, $headers);
    }
}