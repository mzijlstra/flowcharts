<?php
/*
 * Michael Zijlstra 11/14/2014
 */

/* ******************************
 * Initialize Globals
 * **************************** */
$__self = filter_input(INPUT_SERVER, "PHP_SELF", FILTER_SANITIZE_URL);          
$matches = array();
preg_match("|(.*)/frontController.php|", $__self, $matches);               
$MY_BASE = $matches[1];   

$the_uri = filter_input(INPUT_SERVER, "REQUEST_URI", FILTER_SANITIZE_URL);
preg_match("|$MY_BASE(/.*)|", $the_uri, $matches);
$MY_URI = $matches[1];

$MY_METHOD = filter_input(INPUT_SERVER, "REQUEST_METHOD", FILTER_SANITIZE_STRING);
$URI_PARAMS = array(); // populated with URI parameters on URI match in routing
$VIEW_DATA = array(); // populated by controller, and used by view

// always start the session
session_start();

/* ****************************** 
 * Check Security based on URI
 * **************************** */
require 'security.php';

/* ****************************** 
 * Do Routing based on URI
 * **************************** */
require 'routing.php';