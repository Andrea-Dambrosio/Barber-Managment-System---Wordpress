<?php
require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
$flag = get_option('carica_clienti');

if (!$flag) {
    global $wpdb;

    $inputFileName = plugin_dir_path(__FILE__) . 'clienti.xlsx';

    // Controlla se il flag è impostato
    try {
        $spreadsheet = IOFactory::load($inputFileName);
        $sheetData = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);

        // Inserimento dei dati nel database
        foreach ($sheetData as $row) {
            $wpdb->insert(
                $wpdb->prefix . 'gestionale_clienti',
                array(
                    'nome' => $row['B'],
                    'cognome' => $row['C'],
                    'telefono' => $row['D'],
                    'email' => $row['F']
                )
            );
        }

        // Imposta il flag
        update_option('carica_clienti', true);

    } catch (\PhpOffice\PhpSpreadsheet\Reader\Exception $e) {
        die('Error loading file: ' . $e->getMessage());
    } catch (Exception $e) {
        die('Database error: ' . $e->getMessage());
    }
}