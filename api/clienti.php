<?php
function handleClienti($request)
{
    $method = $request->get_method();
    switch ($method) {
        case 'POST':
            return post($request);
        case 'GET':
            return get($request);
        case 'DELETE':
            return elimina($request);
        default:
            return new WP_Error('method_not_allowed', 'Bad Request, method not allowed', array('status' => 400));

    }
}
function elimina($request){
    global $wpdb;
    $data = $request->get_json_params();
    $result_appuntamenti = $wpdb->delete(
        $wpdb->prefix . 'gestionale_appuntamenti',
        array('cliente' => $data['id'])
    );
    if ($wpdb->last_error) {
        return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));

    } else if ($result_appuntamenti === false) {
        return new WP_Error('no_rows_updated', 'Bad Request, no rows updated', array('status' => 400));

    } 
    $result = $wpdb->delete(
        $wpdb->prefix . 'gestionale_clienti',
        array('id' => $data['id'])
    );
    if ($wpdb->last_error) {
        return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));

    } else if ($result === false) {
        return new WP_Error('no_rows_updated', 'Bad Request, no rows updated', array('status' => 400));

    } else {
        return 'OK';
    }
}
function getClientiDb($wpdb)
{
    $clienti = $wpdb->get_results(
        "SELECT * FROM " . $wpdb->prefix . "gestionale_clienti"
    );
    return $clienti;
}
function get($request){
    global $wpdb;
    $clients = $wpdb->get_results(
        "SELECT * FROM " . $wpdb->prefix . "gestionale_clienti 
        ORDER BY nome, cognome asc"
    );
    return $clients;
} 
function post($request){
    switch ($request->get_header('type')) {
        case 'update':
            return update($request);
        case 'create':
            return create($request);
        default:
            return new WP_Error('type_not_allowed', 'Bad Request, type not allowed', array('status' => 400));

    }
}
function update($request){
    global $wpdb;
    $data = $request->get_json_params();
    $result = $wpdb->update(
        $wpdb->prefix . 'gestionale_clienti',
        array(
            'nome' => $data['nome'],
            'cognome' => $data['cognome'],
            'telefono' => $data['telefono'],
            'email' => $data['email']
        ),
        array('id' => $data['id']) 
    );
    if ($wpdb->last_error) {
        return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));

    } else if ($result === false) {
        return new WP_Error('no_rows_updated', 'Bad Request, no rows updated', array('status' => 400));

    } else {
        return 'OK';
    }
}
function create($data){
    global $wpdb;
    $result = $wpdb->insert(
        $wpdb->prefix . 'gestionale_clienti',
        array(
            'nome' => $data['nome'],
            'cognome' => $data['cognome'],
            'telefono' => $data['telefono'],
            'email' => $data['email']
        )
    );

    if ($wpdb->last_error) {
        return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));

    } else if ($result === false) {
        return new WP_Error('no_rows_updated', 'Bad Request, no rows updated '. "$wpdb->last_error", array('status' => 400));

    } else {
        return 'OK';
    }
}
