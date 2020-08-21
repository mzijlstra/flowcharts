<?php

/*
 * Michael Zijlstra 11/14/2014
 */

// helper function to checks if user is logged in
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

// find the security policy for the current URI using $security from context
$my_policy = "admin"; // default policy if no URI found
$sec_test = "$MY_METHOD@$MY_URI";
foreach ($security as $pattern => $policy) {
    if (preg_match($pattern, $sec_test)) {
        $my_policy = $policy;
        break;
    }
}

// apply the (found) security policy
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
