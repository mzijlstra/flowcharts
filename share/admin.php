<?php

/*
 * Created on : Sep 4, 2014, 07:15:00 PM
 * Author     : mzijlstra 
 */

if ($_SESSION['user']['type'] !== 'admin') {
    http_response_code(403);
    echo json_encode(array("status" => 403, "message" => "Authorization"));
    exit();
}