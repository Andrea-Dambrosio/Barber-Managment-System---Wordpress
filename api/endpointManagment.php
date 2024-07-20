<?php

function createEndpoints(){
    $admin_endpoints = [
        "clienti", // clienti.php
        "servizi", // servizi.php
        "categorie", // servizi.php
        "informazioniNegozio", // calendario.php
        "eventi", // calendario.php
        "negozio", // negozio.php
        "prodotti", // prodotti.php
        "tabella" // tabella.php
    ];
    $client_endpoints = [
        "/serviziPrenotazioni",
        "/disponibilitaPrenotazioni",
        "/aggiungiAppuntamento"
    ]; 
    foreach($admin_endpoints as $endpoint){
        
        register_rest_route(
            'gestionale/v1/admin',
            "/" . $endpoint,
            [
                'methods' => ['GET', 'POST', 'DELETE'],
                'callback' => 'handle' . ucfirst($endpoint),
                'permission_callback' => function () {
                    return true;
                }
            ]
        );
    }
    foreach($client_endpoints as $endpoint){
        register_rest_route(
            'gestionale/v1/clients',
            $endpoint,
            [
                'methods' => ['GET', 'POST'],
                'callback' => 'handle' . ucfirst($endpoint),
            ]
        );
    }
    

    // register_rest_route(
    //     'gestionale/v1',
    //     '/prodotti/',
    //     array(
    //         'methods' => ['GET', 'POST', 'DELETE'],
    //         'callback' => 'handleProdotti',
    //     )
    // );
    // register_rest_route(
    //     'gestionale/v1',
    //     '/tabella/',
    //     array(
    //         'methods' => ['GET'],
    //         'callback' => 'handleTabella',
    //     )
    // );
    // register_rest_route(
    //     'gestionale/clienti',
    //     '/serviziPrenotazioni/',
    //     array(
    //         'methods' => ['GET', "POST"],
    //         'callback' => 'handleServiziPrenotazioni',
    //     )
    // );
    // register_rest_route(
    //     'gestionale/clienti',
    //     '/disponibilitaPrenotazioni/',
    //     array(
    //         'methods' => ['GET'],
    //         'callback' => 'handleDisponibilitaPrenotazioni',
    //     )
    // );
    // register_rest_route(
    //     'gestionale/clienti',
    //     '/aggiungiAppuntamento/',
    //     array(
    //         'methods' => ['POST', "GET"],
    //         'callback' => 'createEvent',
    //     )
    // );
}
function check_error($result, $last_error)
{
    if ($last_error) {
        return new WP_Error('database_error', $last_error, array('status' => 500));

    } else if ($result === false) {
        return new WP_Error('no_rows_updated', 'Bad Request, no rows updated', array('status' => 400));

    } else {
        return 'OK';
    }
}