<?php
function install_plugin()
{
  global $wpdb;
  $charset_collate = $wpdb->get_charset_collate();

  // Nome della tabella
  $prefix = $wpdb->prefix . "gestionale_";

  // SQL per creare la tabella
  $queries = [
    "CREATE TABLE `{$prefix}appuntamenti` (
  `id` int(11) NOT NULL,
  `start` datetime NOT NULL,
  `note` varchar(200) DEFAULT NULL,
  `prodotto` int(11) DEFAULT NULL,
  `membro_team` bigint(20) UNSIGNED DEFAULT NULL,
  `cliente` int(11) DEFAULT NULL,
  `durata` time NOT NULL,
  `in_negozio` tinyint(1) DEFAULT '0',
  `importo` float DEFAULT NULL,
  `metodo_pagamento` enum('carta','contanti') DEFAULT NULL,
  `prodotti` varchar(10) DEFAULT NULL
) $charset_collate;",

    "CREATE TABLE `{$prefix}categorie` (
  `id` int(11) NOT NULL,
  `nome` varchar(20) NOT NULL
) $charset_collate;",

    "CREATE TABLE `{$prefix}clienti` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cognome` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `email` varchar(325) DEFAULT NULL,
  `appuntamenti` int(11) DEFAULT NULL
) $charset_collate;",

    "CREATE TABLE `{$prefix}gestione_apertura` (
  `id` mediumint(9) NOT NULL,
  `giorno` varchar(20) NOT NULL,
  `apertura` time DEFAULT '00:00:00',
  `chiusura` time DEFAULT '00:00:00'
) $charset_collate;",

    "CREATE TABLE `{$prefix}giorni_eccezionali` (
  `id` int(11) NOT NULL,
  `giorno` date NOT NULL,
  `tipo` enum('apertura','chiusura') NOT NULL DEFAULT 'chiusura',
  `utente` bigint(20) UNSIGNED DEFAULT NULL
) $charset_collate;",

    "CREATE TABLE `{$prefix}servizi` (
  `id` int(11) NOT NULL,
  `tempo` time NOT NULL,
  `nome` varchar(100) NOT NULL,
  `prezzo` float NOT NULL,
  `descrizione` varchar(200) NOT NULL,
  `categoria` int(11) DEFAULT NULL
) $charset_collate;",

    "CREATE TABLE `{$prefix}prodotti` (
  `id` int(11) NOT NULL,
  `brand` varchar(10) DEFAULT NULL,
  `nome` varchar(10) NOT NULL,
  `prezzo` int(10) UNSIGNED NOT NULL,
  `quantita` int(10) UNSIGNED DEFAULT '0'
) $charset_collate;",

    "CREATE TABLE `{$prefix}team_prodotti` (
  `id_prodotto` int(11) NOT NULL,
  `id_team` bigint(20) UNSIGNED NOT NULL
) $charset_collate;",

    "ALTER TABLE `{$prefix}appuntamenti`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente` (`cliente`),
  ADD KEY `prodotto` (`prodotto`),
  ADD KEY `membro_team` (`membro_team`);",
  "ALTER TABLE `{$prefix}categorie`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);",
  "ALTER TABLE `{$prefix}clienti`
  ADD PRIMARY KEY (`id`);",
  "ALTER TABLE `{$prefix}gestione_apertura`
  ADD PRIMARY KEY (`id`);",
  "ALTER TABLE `{$prefix}giorni_eccezionali`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Unique` (`giorno`,`utente`),
  ADD KEY `utente` (`utente`);",
  "ALTER TABLE `{$prefix}servizi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`),
  ADD KEY `categoria` (`categoria`);
",
  "ALTER TABLE `{$prefix}prodotti`
  ADD PRIMARY KEY (`id`);",
  "ALTER TABLE `{$prefix}team_prodotti`
  ADD PRIMARY KEY (`id_prodotto`,`id_team`) USING BTREE,
  ADD KEY `id_team` (`id_team`);",
  "ALTER TABLE `{$prefix}appuntamenti`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$prefix}categorie`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$prefix}clienti`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$prefix}gestione_apertura`
  MODIFY `id` mediumint(9) NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$prefix}giorni_eccezionali`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$prefix}servizi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
",
  "ALTER TABLE `{$prefix}prodotti`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$wpdb->prefix}users`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;",
  "ALTER TABLE `{$prefix}appuntamenti`
  ADD CONSTRAINT `{$prefix}appuntamenti_ibfk_1` FOREIGN KEY (`cliente`) REFERENCES `{$prefix}clienti` (`id`),
  ADD CONSTRAINT `{$prefix}appuntamenti_ibfk_2` FOREIGN KEY (`prodotto`) REFERENCES `{$prefix}servizi` (`id`),
  ADD CONSTRAINT `{$prefix}appuntamenti_ibfk_3` FOREIGN KEY (`membro_team`) REFERENCES `{$wpdb->prefix}users` (`ID`);",
  "ALTER TABLE `{$prefix}giorni_eccezionali`
  ADD CONSTRAINT `{$prefix}giorni_eccezionali_ibfk_1` FOREIGN KEY (`utente`) REFERENCES `{$wpdb->prefix}users` (`ID`);",
  "ALTER TABLE `{$prefix}servizi`
  ADD CONSTRAINT `{$prefix}prodotti_ibfk_1` FOREIGN KEY (`categoria`) REFERENCES `{$prefix}categorie` (`id`);",
  "ALTER TABLE `{$prefix}team_prodotti`
  ADD CONSTRAINT `{$prefix}team_prodotti_ibfk_1` FOREIGN KEY (`id_prodotto`) REFERENCES `{$prefix}servizi` (`id`),
  ADD CONSTRAINT `{$prefix}team_prodotti_ibfk_2` FOREIGN KEY (`id_team`) REFERENCES `{$wpdb->prefix}users` (`ID`);",
  "INSERT INTO  `{$prefix}gestione_apertura`(`giorno`)
  VALUES
  ('lunedi'),
  ('martedi'),
  ('mercoledi'),
  ('giovedi'),
  ('venerdi'),
  ('sabato'),
  ('domenica')
  "

  ];

  // Eseguiamo le query
  foreach ($queries as $sql) {
    $wpdb->query($sql);
  }


}

function uninstall_gestionale(){

}
