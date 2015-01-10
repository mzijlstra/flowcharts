<?php

/*
 * Michael Zijlstra 11/15/2014
 */

/* * **************************************
 * Setup routing arrays
 * ************************************** */
// Requests that don't need a controller aka 'view controllers'
$view_ctrl = array(
    "|^/$|" => "login.php",
    "|/login|" => "login.php",
    "|/user/add|" => "userDetails.php",
);

// Get requests that need a controller
$get_ctrl = array(
    "|/wr|" => "ProjectCtrl@getProjects",
    "|/user$|" => "UserCtrl@all",
    "|/user/(\d+)|" => "UserCtrl@details",
    "|/logout|" => "UserCtrl@logout",
    "|/project/(\d+)|" => "ProjectCtrl@getFunctions",
);

// Post requests that need a controller
$post_ctrl = array(
    "|/login|" => "UserCtrl@login",
    "|/project/(\d+)/(\w+)|" => "ProjectCtrl@addFunction",
    "|/project/(\d+)|" => "ProjectCtrl@update",
    "|/project/(\w+)|" => "ProjectCtrl@create",
    "|/function/(\d+)/vars|" => "ProjectCtrl@updVars",
    "|/function/(\d+)/ins|" => "ProjectCtrl@updIns",
    "|/user$|" => "UserCtrl@create",
    "|/user/(\d+)|" => "UserCtrl@update",
);

/* * **************************************
 * Do actual routing
 * ************************************** */
require 'context.php';

function invokeCtrlMethod($class, $method) {
    $context = new Context();
    $getControler = new ReflectionMethod("Context", "get" . $class);
    $controler = $getControler->invoke($context);
    $doMethod = new ReflectionMethod($class, $method);

    try {
        return $doMethod->invoke($controler, $method);
    } catch (Exception $e) {
        // TODO: have some user setting for debug mode
        error_log($e->getMessage());
        http_response_code(500);
        exit();
    }
}

function applyView($view) {
    global $VIEW_DATA;
    global $MY_METHOD;

    if (preg_match("/^Location: /", $view)) {
        if ($VIEW_DATA) {
            $_SESSION['redirect'] = $view;
            $_SESSION['flash_data'] = $VIEW_DATA;
        }
        header($view);
    } else {
        if ($MY_METHOD == "POST") {
            die("Please Use the Post/Redirect/Get Pattern");
        }
        // make keys in VIEW_DATA available as regular variables
        foreach ($VIEW_DATA as $key => $value) {
            $$key = $value;
        }
        require "view/$view";
    }
    // always exit after displaying the view, do we want hook?
    exit();
}

function matchUriToCtrl($ctrls) {
    global $MY_URI;
    global $URI_PARAMS;

    // check get controlers
    foreach ($ctrls as $pattern => $dispatch) {
        if (preg_match($pattern, $MY_URI, $URI_PARAMS)) {
            list($class, $method) = explode("@", $dispatch);
            $view = invokeCtrlMethod($class, $method);
            applyView($view);
        }
    }
    // page not found (security mapping exists, but not ctrl mapping)
    http_response_code(404);
    exit();
}

// Dispatch
switch ($MY_METHOD) {
    case "GET":
        // check for redirect flash attributes
        if (isset($_SESSION['redirect']) && $_SESSION['redirect'] == $MY_URI) {
            foreach ($_SESSION['flash_data'] as $key => $val) {
                $VIEW_DATA[$key] = $val;
            }
            unset($_SESSION['redirect']);
            unset($_SESSION['flash_data']);
        }

        // check view controlers
        foreach ($view_ctrl as $pattern => $file) {
            if (preg_match($pattern, $MY_URI, $URI_PARAMS)) {
                applyView($file);
            }
        }
        // check get controllers
        matchUriToCtrl($get_ctrl);
        break;
    case "POST":
        // check post controlers
        matchUriToCtrl($post_ctrl);
        break;
    case "PUT":
    case "DELETE":
    default:
        http_response_code(403);
        exit();
}
