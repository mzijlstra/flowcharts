<?php
/*
 * Michael Zijlstra 11/14/2014
 */

/* **************************
 * Security to URL 
 * ************************ */
$sec = array(
    "|GET@/login|" => "none",
    "|GET@/logout|" => "none",
    "|POST@/login|" => "none",
    "|GET@/$|" => "user",
    "|GET@/project|" => "user",
    "|POST@/project|" => "user",
    "|POST@/function|" => "user",
    "|GET@/user|" => "admin",
    "|POST@/user|" => "admin"
);

/* ****************************
 * Do actual Security checks
 * ************************** */

function isLoggedIn() {
    if (!isset($_SESSION['user'])) {
        global $MY_BASE;
        global $MY_URI;

        // If the user requests a specific project store the request URL
        // That way we can go there after logging in
        if (preg_match("|project/(\d+)|", $MY_URI)) {
            $_SESSION['login_to'] = $MY_URI;
        }

        // Then show login page
        $_SESSION['error'] = "Please Login:";
        header("Location: ${MY_BASE}/login");
        exit();
    }    
}

$my_policy = "admin";
$sec_test = "$MY_METHOD@$MY_URI";
foreach ($sec as $pattern => $policy) {
    if (preg_match($pattern, $sec_test)) {
        $my_policy = $policy;
        break;
    }
}

switch ($my_policy) {
    case "none":
        break;
    case "user":
        isLoggedIn();
        break;
    case "admin":
    default:
        isLoggedIn();
        if ($_SESSION['user']['type'] !== 'admin') {
            require "view/error/403.php";
            exit();
        }
}
