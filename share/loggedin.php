<?php
/*
 * Created on : Aug 30, 2014, 16:20:00 PM
 * Author     : mzijlstra 
*/
session_start();

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(array("status" => 401, "message" => "Authentication"));
    exit();
}

