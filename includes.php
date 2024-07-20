<?php
$directory = plugin_dir_path(__FILE__);
include $directory . "database-creation.php";
// include $directory . "carica-clienti.php";
include $directory . "api/clienti.php";
include $directory . "api/endpointManagment.php";
include $directory . "api/servizi.php";
include $directory . "api/calendario.php";
include $directory . "api/negozio.php";
include $directory . "api/prodotti.php";
include $directory . "api/tabella.php";
include $directory . "api/client.php";
include $directory . "email.php";
include $directory . "shortcodes/shortcodes.php";