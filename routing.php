<?php

/*
 * Michael Zijlstra 11/15/2014
 */

/**
 * Helper function to switch to the provided view and then exit the application
 * 
 * @global array $VIEW_DATA any data that the view may need in order to render
 * @param string $view the name of the view file to include before exiting, 
 * or alternately for redirects a location header string
 */
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

/**
 * Helper function that tries to match the request URI to a controller method 
 * and invoke it, returning the view string returned from the controller method
 * 
 * @global string $MY_URI the request URI as shown in the browser
 * @global array $URI_PARAMS empty array into which the matched controller
 * can put key/value pairs for any URI params it may extract
 * @param array $ctrls the $get_ctrl or $post_ctrl array containing URI to 
 * controller @ method mappings
 * @return string the view string returned by the matched controller
 */
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

/**
 * Helper function that actually invokes the found controller method
 * 
 * @param string $class Class name of the controller
 * @param string $method method name that should be invoked
 * @return string the view string returned by the controller method
 */
function invokeCtrlMethod($class, $method) {

    try {
        $context = new Context();
        $controler = $context->get($class);
#        $getControler = new \ReflectionMethod("Context", "get" . $class);
#        $controler = $getControler->invoke($context);
#        $doMethod = new \ReflectionMethod($class, $method);
#        return $doMethod->invoke($controler, $method);
        return $controler->{$method}();
    } catch (Exception $e) {
        // Perhaps have some user setting for debug mode
        error_log($e->getMessage());
        applyView("error/500.php");
    }
}

// The logic to do the actual routing dispatch, using the above helper functions
// and the $view_ctrl, $get_ctrl, $post_ctrl arrays from the context
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

