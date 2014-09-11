<?php
/*
 * Created on : Aug 29, 2014, 13:20:01 PM
 * Author     : mzijlstra 
 */

session_start();
require 'share/dbcon.php';

// start session, and clean any login errors 
unset($_SESSION['error']);

$email = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);
$pass =  filter_input(INPUT_POST, "pass");

// check if this is a valid login
$find = $db->prepare("SELECT id, firstname, lastname, password, type "
        . "FROM user "
        . "WHERE email = :email "
        . "AND active = TRUE ");
$find->execute(array("email" => $email));
$row = $find->fetch();

if ($row && password_verify($pass, $row['password'])) {
    // prevent session fixation
    session_regenerate_id();

    // set current user details
    $_SESSION['user'] = array(
        "id" => $row['id'],
        "first" => $row['firstname'],
        "last" => $row['lastname'],
        "type" => $row['type']
    );
    
    // update accessed 
    $upd = $db->prepare("UPDATE user SET accessed = NOW() WHERE id = :uid");
    $upd->execute(array("uid" => $row['id']));

    // also retrieve names and ids of recently used projects
    $recent = $db->prepare("SELECT id, name FROM project "
            . "WHERE user_id = :uid "
            . "AND accessed > DATE_SUB(NOW(), INTERVAL 14 DAY) "
            . "ORDER BY accessed DESC "
            . "LIMIT 10 ");
    $recent->execute(array("uid" => $row['id']));

    $projects = array();
    foreach ($recent as $row) {
        $projects[$row['id']] = $row['name'];
    }
    $_SESSION['recent'] = $projects;


    // redirect to the Web Raptor SPA
    header("Location: wr.php");
} else {
    $_SESSION['error'] = "Invalid email / pass combo";
    header("Location: index.php");
}
