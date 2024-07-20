<?php
function handleProdotti($request)
{
   
    switch ($request->get_method()) {
        case "GET":
            return getProdotti();
        case "POST":
            $type = $request->get_header("type");
            switch ($type) {
                case "create":
                    return creaProdotto($request->get_json_params());
                case "update":
                    return aggiornaProdotto($request->get_json_params());
                case "delete":
                    return eliminaProdotto($request->get_json_params());
                default:
                    return new WP_Error('incorrect_type', 'Bad Request, incorrect type', array('status' => 400));

            }

        default:
            return new WP_Error('method_not_allowed', 'Bad Request, method not allowed', array('status' => 400));

    }
}
function eliminaProdotto($data){
    global $wpdb;
    $res = $wpdb->delete(
        $wpdb->prefix . "gestionale_prodotti",
        array("id" => $data["id"])
    );
    return check_error($res, $wpdb->last_error);
}
function aggiornaProdotto($data)
{
    global $wpdb;
    $res = $wpdb->update(
        $wpdb->prefix . "gestionale_prodotti",
        $data,
        array("id" => $data["id"])
    );
    return "OK";
}
function creaProdotto($data)
{
    global $wpdb;
    $res = $wpdb->insert(
        $wpdb->prefix . "gestionale_prodotti",
        $data
    );
    return check_error($res, $wpdb->last_error);
}
function getProdotti()
{
    global $wpdb;
    $result = $wpdb->get_results("SELECT * FROM " . $wpdb->prefix . "gestionale_prodotti
    ORDER BY NOME ASC
    ");
    return array(
        "prodotti" => $result
    );

}

