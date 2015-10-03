<?php

/*
 * Michael Zijlstra 11/15/2014
 */

/* * **************************************
 * Setup routing arrays
 * ************************************** */
// Requests that don't need a controller aka 'view controllers'
$view_ctrl = array(
    "|/login|" => "login.php",
    "|/sandbox$|" => "sandbox.php",
    "|/user/add|" => "userDetails.php",
);

// Get requests that need a controller
$get_ctrl = array(
    "|^/$|" => "UserCtrl@loggedIn",
    "|/user$|" => "UserCtrl@all",
    "|/user/(\d+)$|" => "UserCtrl@details",
    "|/user/(\d+)/project$|" => "ProjectCtrl@getUserProjects",
    "|/user/(\d+)/project/(\d+)$|" => "ProjectCtrl@getProject",
    "|/logout|" => "UserCtrl@logout",
    "|/project/recent$|" => "ProjectCtrl@getRecent",
    "|/project/other_recent|" => "ProjectCtrl@getOtherRecent",
    "|/project/(\d+)$|" => "ProjectCtrl@getProject",
    "|/project\?order=\w+|" => "ProjectCtrl@getProjects",
);

// Post requests that need a controller
$post_ctrl = array(
    "|/login|" => "UserCtrl@login",
    "|/project/(\D[^/]+)$|" => "ProjectCtrl@create",
    "|/project/(\d+)/rename$|" => "ProjectCtrl@rename",
    "|/project/(\d+)/delete$|" => "ProjectCtrl@delete",
    "|/project/(\d+)/add/(\w+)|" => "ProjectCtrl@addFunction",
    "|/function/(\d+)/vars|" => "ProjectCtrl@updVars",
    "|/function/(\d+)/ins|" => "ProjectCtrl@updIns",
    "|/function/(\d+)/rename|" => "ProjectCtrl@renameFunction",
    "|/function/(\d+)/delete|" => "ProjectCtrl@deleteFunction",
    "|/user$|" => "UserCtrl@create",
    "|/user/(\d+)$|" => "UserCtrl@update",
);

/* * **************************************
 * Do actual routing
 * ************************************** */
require 'context.php';

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
        applyView("error/403.php");
}

function applyView($view) {
    global $VIEW_DATA;

    if (preg_match("/^Location: /", $view)) {
        if ($VIEW_DATA) {
            $_SESSION['redirect'] = $view;
            $_SESSION['flash_data'] = $VIEW_DATA;
        }
        header($view);
    } else {
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

    // check controler mappings
    foreach ($ctrls as $pattern => $dispatch) {
        if (preg_match($pattern, $MY_URI, $URI_PARAMS)) {
            list($class, $method) = explode("@", $dispatch);
            $view = invokeCtrlMethod($class, $method);
            if ($view) {
                applyView($view);
            }
            return; // finding match completes method
        }
    }
    // page not found (security mapping exists, but not ctrl mapping)
    applyView("error/404.php");
}

function invokeCtrlMethod($class, $method) {

    try {
        $context = new Context();
        $getControler = new ReflectionMethod("Context", "get" . $class);
        $controler = $getControler->invoke($context);
        $doMethod = new ReflectionMethod($class, $method);
        return $doMethod->invoke($controler, $method);
    } catch (Exception $e) {
        // Perhaps have some user setting for debug mode
        error_log($e->getMessage());
        applyView("error/500.php");
    }
}
