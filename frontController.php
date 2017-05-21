<?php
/*
 * Michael Zijlstra 11/14/2014
 */
/* ******************************
 * Configuration variables
 * **************************** */
define("DEVELOPMENT", true);
define("DSN", "mysql:dbname=web_raptor;host=localhost");
define("DB_USER", "root");
define("DB_PASS", "root");
$SEC_LVLS = array("none", "user", "admin");

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

/* *****************************
 * Include the (generated) application context
 * **************************** */
// Setup autoloading for control and model classes
// TODO move these into the AnnotationContext, so that it automatically adds
// an additional spl_autoload function for each directory it searches
spl_autoload_register(function ($class) {
    include 'control/' . $class . '.class.php';
});
spl_autoload_register(function ($class) {
    include 'model/' . $class . '.class.php';
});

if (DEVELOPMENT) {
    require 'AnnotationReader.class.php';
    $ac = new AnnotationContext();
    $ac->scan()->create_context();
    // $ac->write("context.php");  # uncomment to generate file
    eval($ac->context);
} else {
    require 'context.php';
}

// always start the session context
session_start();

/* ****************************** 
 * Check Security based on context security array
 * **************************** */
require 'security.php';

/* ****************************** 
 * Do Routing based on context routing arrays
 * **************************** */
require 'routing.php';