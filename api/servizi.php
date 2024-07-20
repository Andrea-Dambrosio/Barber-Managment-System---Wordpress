<?php
// Gestione Servizi per la pagina dei servizi
function handleServizi($request)
{
    $method = $request->get_method();
    switch ($method) {
        case 'POST':
            return postServizi($request);
        case 'GET':
            return getForServiziPage($request);
        case 'DELETE':
            return eliminaServizio($request);
        default:
            return new WP_Error('no_rows_updated', 'Bad Request, no rows updated', array('status' => 400));

    }
}
function getForServiziPage($request)
{

    global $wpdb;
    $prefix = $wpdb->prefix;
    $servizi = getServiziDb($wpdb);
    $categories = $wpdb->get_results(
        "SELECT DISTINCT * FROM " . $prefix . "gestionale_categorie"
    );
    $utenti = getTeamDb($prefix, ["ID", 'display_name']);
    $data = array(
        'servizi' => $servizi,
        'categorie' => $categories,
        'utenti' => $utenti
    );
    return $data;
}
function postServizi($request)
{

    switch ($request->get_header('type')) {
        case 'update':
            return updateServizi($request);
        case 'create':
            return createServizi($request);
        default:
            return new WP_Error('incorrect_type', 'Bad Request, incorrect type', array('status' => 400));

    }
}
function updateServizi($request)
{
    global $wpdb;
    $data = $request->get_json_params();
    $result = $wpdb->update(
        $wpdb->prefix . 'gestionale_servizi',
        array(
            'nome' => $data['nome'],
            'prezzo' => $data['prezzo'],
            'descrizione' => $data['descrizione'],
            'categoria' => $data['id_categoria'],
            'tempo' => $data['tempo'],
        ),
        array('id' => $data['id'])
    );

    if ($result === false) {
        return new WP_Error('no_rows_updated', "Bad Request, no rows updated. Error: \n {$wpdb->last_error} ID:  {$data["id"]}", array('status' => 400));
    }

    $membri_nuovi = $data['id_membri'];
    $membri_attuali = $wpdb->get_results(
        "SELECT id_team FROM " . $wpdb->prefix . "gestionale_team_prodotti
        WHERE id_prodotto = " . $data['id']
    );


    foreach ($membri_attuali as $membro) {
        if (!in_array($membro->id_team, $membri_nuovi)) {
            $wpdb->delete(
                $wpdb->prefix . 'gestionale_team_prodotti',
                array(
                    'id_prodotto' => $data['id'],
                    'id_team' => $membro->id_team
                )
            );
            $membri_nuovi = array_diff($membri_nuovi, array($membro->id_team));
        } else {
            $membri_nuovi = array_diff($membri_nuovi, array($membro->id_team));
        }

    }
    foreach ($membri_nuovi as $membro) {
        $wpdb->insert(
            $wpdb->prefix . 'gestionale_team_prodotti',
            array(
                'id_team' => $membro,
                'id_prodotto' => $data['id']

            ),
        );


    }
    return check_error($result, $wpdb->last_error);

}
function createServizi($data)
{
    global $wpdb;
    $result = $wpdb->insert(
        $wpdb->prefix . 'gestionale_servizi',
        array(
            'nome' => $data['nome'],
            'prezzo' => $data['prezzo'],
            'descrizione' => $data['descrizione'],
            'categoria' => $data['id_categoria'],
            'tempo' => $data['tempo'],
        )
    );
    $servizio_id = $wpdb->insert_id;
    $membri = $data['id_membri'];
    foreach ($membri as $membro) {
        $wpdb->insert(
            $wpdb->prefix . 'gestionale_team_prodotti',
            array(
                'id_prodotto' => $servizio_id,
                'id_team' => $membro
            )
        );
    }
    return check_error($result, $wpdb->last_error);
}

function eliminaServizio($request)
{

    global $wpdb;
    $data = $request->get_json_params();
    $result_team = $wpdb->delete(
        $wpdb->prefix . 'gestionale_team_prodotti',
        array('id_prodotto' => $data['id'])
    );
    $result_appuntamenti = $wpdb->delete(
        $wpdb->prefix . 'gestionale_appuntamenti',
        array('prodotto' => $data['id'])
    );
    $result = $wpdb->delete(
        $wpdb->prefix . 'gestionale_servizi',
        array('id' => $data['id'])
    );
    if ($result === false || $result_team === false || $result_appuntamenti === false) {
        return new WP_Error('no_rows_updated', "Bad Request, no rows updated. Error: \n {$wpdb->last_error}", array('status' => 400));
    }
    if ($wpdb->last_error) {
        return new WP_Error('internal_error', $wpdb->last_error, array('status' => 500));
    }
    return 'OK';


}
// --- FINE ---

// Gestione Categorie per la pagina dei servizi
function handleCategorie($request)
{
    $method = $request->get_method();
    if ($method == 'GET') {
        return getCategorie($request);
    } else if ($method == 'POST') {
        return postCategorie($request);
    }
}
function getCategorie($request)
{
    global $token_value;
    $token = $request->get_param('token');
    if ($token != $token_value) {
        status_header(403);
        return 'Forbidden';
    }
    global $wpdb;
    $categories = $wpdb->get_results(
        "SELECT DISTINCT * FROM " . $wpdb->prefix . "gestionale_categorie"
    );
    return $categories;
}
function postCategorie($request)
{
    global $token_value;
    $token = $request->get_header('token');
    if ($token != $token_value) {
        status_header(403);
        return 'Forbidden';
    }
    switch ($request->get_header('type')) {
        case 'update':
            return updateCategories($request);
        case 'create':
            return createCategories($request);
        default:
            status_header(400);
            return 'Bad Request';
    }
}
function updateCategories($request)
{
    global $wpdb;
    $data = $request->get_json_params();
    $result = $wpdb->update(
        $wpdb->prefix . 'gestionale_categorie',
        array(
            'nome' => $data['nome']
        ),
        array('id' => $data['id'])
    );
    return check_error($result, $wpdb->last_error);

}
function createCategories($request)
{
    global $wpdb;
    $data = $request->get_json_params();
    $result = $wpdb->insert(
        $wpdb->prefix . 'gestionale_categorie',
        array(
            'nome' => $data['nome']
        )
    );
    return check_error($result, $wpdb->last_error);

}
// --- FINE --


// ACCESSO AI DATI DAL DATABASE
function getServiziDb($wpdb)
{
    $prefix = $wpdb->prefix . "gestionale_";
    return $wpdb->get_results(
        "SELECT
    GROUP_CONCAT(team.id SEPARATOR ',') AS id_membri,
    servizi.*,
    categorie.id AS id_categoria
FROM
    {$prefix}team_prodotti AS relazione
INNER JOIN {$prefix}servizi AS servizi
ON
    servizi.id = relazione.id_prodotto
INNER JOIN {$wpdb->prefix}users AS team
ON
    team.id = relazione.id_team
INNER JOIN {$prefix}categorie AS categorie
ON
    categorie.id = servizi.categoria
GROUP BY
    servizi.id
ORDER BY
    servizi.nome asc"
    );
}
function getTeamDb($prefix, $fields, $meta = [])
{
    $users = get_users(
        [
            'capability' => 'membro_team',
            "fields" => $fields,
        ]
    );
    if(empty($meta)){
        return $users;
    }
    // trasforma in array
    foreach ($users as &$user) {
        $user = (array) $user; 
        foreach ($meta as $value) {
            $user[$value] = get_user_meta($user['ID'], $value, true); 
        }
    }
    unset($user);
    return $users;
}