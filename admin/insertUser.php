<?php
/* 
 Created on : August 30, 2014, 20:07:00 PM
 Author     : mzijlstra
 */
require '../share/loggedin.php';
require '../share/admin.php';
require '../model/db.php';


$first = filter_input(INPUT_POST, "first", FILTER_SANITIZE_STRING);
$last  = filter_input(INPUT_POST, "last", FILTER_SANITIZE_STRING);
$sid   = filter_input(INPUT_POST, "sid", FILTER_VALIDATE_REGEXP, 
        array("options"=>array("regexp"=>"/\d{3}-\d{2}-\d{4}/")));
$email = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);
$pass  = filter_input(INPUT_POST, "pass");
$type  = filter_input(INPUT_POST, "type");
$active= filter_input(INPUT_POST, "active");

if (!$first || !$last || !$email || !$pass) {
    header("Location: userDetails.php");
    exit(0);
}
$hash = password_hash($pass, PASSWORD_DEFAULT);

if ($active) {
    $active = 1;
} else {
    $active = 0;
}

$stmt = $db->prepare("INSERT INTO user values "
   . "(NULL, :first, :last, :sid, :email, :pass, :type, NULL, NULL, :active)");
$stmt->execute(array(
    "first" => $first, 
    "last" => $last, 
    "sid" => $sid,
    "email" => $email,
    "pass" => $hash,
    "type" => $type,
    "active" => $active,
    ));

header("Location: users.php");