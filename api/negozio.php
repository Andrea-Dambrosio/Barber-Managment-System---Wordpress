<?php
function handleNegozio($request)
{
    global $wpdb;
    switch ($request->get_method()) {
        case "GET":
            return getData($wpdb);
        case "POST":
            $type = $request->get_header("type");
            $post = new Post($request->get_json_params(), $wpdb);
            if (method_exists($post, $type)) {
                return call_user_func([$post, $type]);
            } else {
                return new WP_Error('error_in_type', 'Bad Request, scorrect type', array('status' => 400));

            }
        default:
            return new WP_Error('method_not_allowed', 'Bad Request, method not allowed', array('status' => 400));
    }
}
;
function getData($wpdb)
{
    $prefix = $wpdb->prefix;
    $gestioneApertura = $wpdb->get_results(
        "SELECT id, TIME_FORMAT(apertura, '%H:%i') as apertura, TIME_FORMAT(chiusura, '%H:%i') as chiusura 
        FROM " . $prefix . "gestionale_gestione_apertura"
    );
    if(check_error($gestioneApertura, $wpdb->last_error) != "OK"){
        return check_error($gestioneApertura, $wpdb->last_error);
    }
    $giorniEccezionali = $wpdb->get_results(
        "SELECT e.id, e.giorno, GROUP_CONCAT(U.display_name SEPARATOR ',') nomi_team, GROUP_CONCAT(U.id SEPARATOR ',') AS id_membri
        FROM " . $wpdb->prefix . "gestionale_giorni_eccezionali as e
        INNER JOIN " . $wpdb->prefix . "users as U 
        on e.utente = U.ID
        GROUP BY
        e.giorno
        "
    );
    if (check_error($gestioneApertura, $wpdb->last_error) != "OK") {
        return check_error($gestioneApertura, $wpdb->last_error);
    }
    $utenti = getTeamDb($prefix, ["ID", "display_name"], ["inizio_pranzo", "fine_pranzo"]);

    if (check_error($gestioneApertura, $wpdb->last_error) != "OK") {
        return check_error($gestioneApertura, $wpdb->last_error);
    }
    return array(
        "gestioneApertura" => $gestioneApertura,
        "giorniEccezionali" => $giorniEccezionali,
        "utenti" => $utenti
    );
}
class Post
{
    private $data;
    private $wpdb;
    public function __construct($data, $wpdb)
    {
        $this->data = $data;
        $this->wpdb = $wpdb;
    }
    public function gestioneApertura()
    {
        $wpdb = $this->wpdb;
        $data = $this->data["days"];
        for ($i = 0; $i < 7; $i++) {
            $result = $wpdb->update(
                $wpdb->prefix . "gestionale_gestione_apertura",
                array(
                    "apertura" => $data[$i]["apertura"] . ":00",
                    "chiusura" => $data[$i]["chiusura"] . ":00",
                ),
                array("id" => $i + 1)
            );
            if ($wpdb->last_error !== '' || $result === false) {
                $error = $wpdb->last_error !== '' ? $wpdb->last_error : 'Update failed';
                $errors[] = $error;
            }
        }
        if (empty($errors)) {
            return "OK";
        } else {
            return $errors;
        }
    }
    public function delete()
    {
        $wpdb = $this->wpdb;
        $result = $wpdb->delete($wpdb->prefix . "gestionale_giorni_eccezionali", array("giorno" => $this->data["giorno"]));
        return check_error($result, $wpdb->last_error);
    }
    public function pausaPranzo()
    {
        $wpdb = $this->wpdb;
        $users = $this->data["users"];
        foreach ($users as $user) {
            $result = $wpdb->update(
                $wpdb->prefix . "users",
                array(
                    "fine_pranzo" => $user["fine_pranzo"] . ":00",
                    "inizio_pranzo" => $user["inizio_pranzo"] . ":00",
                ),
                array("ID" => $user["id"])
            );
            if ($wpdb->last_error !== '' || $result === false) {
                $error = $wpdb->last_error !== '' ? $wpdb->last_error : 'Update failed';
                $errors[] = $error;
            }
        }
        if (empty($errors)) {
            return "OK";
        } else {
            return json_encode($errors);
        }
    }
    public function eccezionali()
    {
        $wpdb = $this->wpdb;
        $data = $this->data;
        $date = DateTime::createFromFormat('d/m/Y', str_replace('\/', '/', $data["data"]));
        $formattedDate = $date->format('Y-m-d');
        foreach ($data["users"] as $user) {
            $result = $wpdb->insert(
                $wpdb->prefix . "gestionale_giorni_eccezionali",
                array(
                    "giorno" => $formattedDate,
                    "utente" => $user
                )
            );
            if ($wpdb->last_error !== '' || $result === false) {
                $error = $wpdb->last_error !== '' ? $wpdb->last_error : 'Update failed';
                return $error;
            }
        }
        return "OK";
    }

}