<?php
function handleTabella($request){
    
    if($request->get_method() != 'GET')
       return new WP_Error('method_not_allowed', 'Bad Request, method not allowed', array('status' => 400));


    global $wpdb;
    $prefix = $wpdb->prefix . "gestionale_";

$users = $wpdb->get_results(
    "SELECT 
ID as id,
display_name as nome
FROM {$wpdb->prefix}users
WHERE ID != 1;
",
    ARRAY_A
);
$servizi = $wpdb->get_results(
    "SELECT 
    id,
    nome,
    prezzo
    FROM {$prefix}servizi
    ",
    ARRAY_A
);

$data = $wpdb->get_results(
        "SELECT
CONCAT(c.nome, ' ', c.cognome) as nome_cliente,
GROUP_CONCAT(a.importo ORDER BY s.nome) as importi,
GROUP_CONCAT(DISTINCT s.nome) as servizi,
u.ID as id_team,
CASE WHEN a.prodotti = '' THEN 'Nessuno' ELSE GROUP_CONCAT(DISTINCT p.nome) END as prodotti,
CASE WHEN a.prodotti = '' THEN '0' ELSE GROUP_CONCAT(p.prezzo ORDER BY p.nome) END as prezzo_prodotti
FROM {$prefix}appuntamenti as a
INNER JOIN {$prefix}clienti as c
ON c.id = a.cliente
INNER JOIN {$prefix}servizi as s
ON s.id = a.prodotto
LEFT JOIN {$prefix}prodotti as p
ON FIND_IN_SET(p.id, a.prodotti)
INNER JOIN {$wpdb->prefix}users as u
on u.ID = a.membro_team
WHERE DATE(a.start) = CURDATE()
AND a.importo IS NOT NULL
GROUP BY  id_team, c.id
order by c.nome asc "
    );
    if($wpdb->last_error == "")
        return array(
            
            "team" => $users,
            "servizi" => $servizi,
            "righe" => $data
        );

    return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));

}
