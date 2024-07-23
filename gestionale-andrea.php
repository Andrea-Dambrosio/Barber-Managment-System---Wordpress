<?php
/*
Plugin Name: Gestionale Barberia
Description: Gestione prenotazioni e clienti 
Version: 0.1
Author: Andrea D'Ambrosio
*/

// Aggiungi una nuova voce al menu di amministrazione
include plugin_dir_path(__FILE__) . "includes.php";

register_activation_hook(__FILE__, 'install_plugin');
register_uninstall_hook(__FILE__, 'uninstall_gestionale');
function aggiungi_pagina_gestionale()
{
    add_menu_page(
        'Gestionale Barberia',
        'Gestionale Barberia',
        'gestionale_barberia',
        home_url('/gestionale-barberia'),
        '',
        '',
        3
    );
}
add_action('admin_menu', 'aggiungi_pagina_gestionale');
// Interrompi la richiesta e mostra il contenuto personalizzato
function redirect($directory)
{
    if (current_user_can('gestionale_barberia')) {
        status_header(200);
        ob_start();
        include plugin_dir_path(__FILE__) . $directory;
        $content = ob_get_clean();
        $pluginPath = str_replace("/web/htdocs/", 'https://', plugin_dir_path(__FILE__));
        $content = "<script defer> 
        const pluginLocation ='$pluginPath'; 
        const nonce = '" . wp_create_nonce('wp_rest') . "';
        </script>" . $content;
        $content .= file_get_contents(plugin_dir_path(__FILE__) . "/templates/menu.html");
        echo $content;
        exit;
    } else {
        $url = get_site_url() . "/wp-login.php/";
        header("Location: $url");
        exit;
    }
}
function mostra_pagine_gestionale()
{   
    $url = rtrim($_SERVER['REQUEST_URI'], "/");
    switch ($url) {
        case '/gestionale-barberia':
            redirect("templates/calendar.html");
            break;
        case "/clienti":
            redirect("templates/pagine/clienti.html");
            break;
        case "/trattamenti":
            redirect("templates/pagine/trattamenti.html");
            break;
        case "/negozio":
            redirect("templates/pagine/gestione-negozio.html");
            break;
        case "/prodotti":
            redirect("templates/pagine/prodotti.html");
            break;
        case "/tabella":
            redirect("templates/pagine/tabella.html");
            break;
        default:
            break;

    }
}


add_action('template_redirect', 'mostra_pagine_gestionale');
add_action('rest_api_init', "createEndpoints");


// GESTIONE UTENTI
// aggiunta ruoli e capability
$membro_negozio = get_role('membro_negozio');

if (!$membro_negozio) {
    add_role(
        'membro_negozio', //  System name of the role.
        __('Membro Negozio'), // Display name of the role.
        array(
            'read' => true,
            'gestionale_barberia' => true
        )
    );
    $membro_negozio = get_role('membro_negozio');
}
$membro_negozio->add_cap('membro_team', true);

$admin = get_role('administrator');
$admin->add_cap('gestionale_barberia', true);

$amministratore_negozio = get_role('amministratore_negozio');
if (!$amministratore_negozio) {
    $admin_capabilities = $admin->capabilities;
    add_role(
        'amministratore_negozio', //  System name of the role.
        __('Amministratore Negozio'), // Display name of the role.
        $admin_capabilities
    );
    $amministratore_negozio = get_role('amministratore_negozio');
}
$amministratore_negozio->add_cap('membro_team', true);
function remove_menu_items()
{
    if (current_user_can('membro_negozio')) {
        remove_menu_page('tools.php'); // Strumenti
        remove_menu_page('edit-comments.php'); // Commenti
        remove_menu_page('upload.php'); // Media
        remove_menu_page('edit.php'); // Articoli
    }
}
add_action('admin_menu', 'remove_menu_items', 999);
// aggiunta pause pranzo
add_action( "user_register", function($user_id, $userdata){
    
    if($userdata["role"] == "membro_negozio" || $userdata["role"] == "amministratore_negozio"){
        write_log("OK");
        add_user_meta($user_id, "inizio_pranzo", "13:00");
        add_user_meta($user_id, "fine_pranzo", "14:00");
    }
}, 20, 2);

function debug_to_console($data)
{
    $output = $data;
    if (is_array($output))
        $output = implode(',', $output);

    echo "<script>console.log(`Debug Objects: " . $output . "` );</script>";
}
// Funzione di log
function write_log($data)
{
    if (true === WP_DEBUG) {
        if (is_array($data) || is_object($data)) {
            error_log(print_r($data, true));
        } else {
            error_log($data);
        }
    }
}