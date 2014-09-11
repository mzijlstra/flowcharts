<?php
/*
 * Author     : M Zijlstra
 * Created On : September 4 2014 07:10  
 */
require '../share/loggedin.php';
require '../share/admin.php';
require '../share/dbcon.php';

$uid   = filter_input(INPUT_POST, "uid", FILTER_VALIDATE_INT);
$first = filter_input(INPUT_POST, "first", FILTER_SANITIZE_STRING);
$last  = filter_input(INPUT_POST, "last", FILTER_SANITIZE_STRING);
$sid   = filter_input(INPUT_POST, "sid", FILTER_VALIDATE_REGEXP, 
        array("options"=>array("regexp"=>"/\d{3}-\d{2}-\d{4}/")));
$email = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);
$pass  = filter_input(INPUT_POST, "pass");
$type  = filter_input(INPUT_POST, "type");
$active= filter_input(INPUT_POST, "active");


if (!$first || !$last || !$email) {
    header("Location: userDetails.php");
    exit(0);
}

if ($active) {
    $active = 1;
} else {
    $active = 0;
}

$stmt = $db->prepare("UPDATE user SET "
        . "firstname = :first, "
        . "lastname = :last, "
        . "studentID = :sid, "
        . "email = :email, "
        . "type = :type, "
        . "active = :active "
        . "WHERE id = :uid");
$stmt->execute(array(
    "first" => $first, 
    "last" => $last, 
    "sid" => $sid,
    "email" => $email,
    "type" => $type,
    "active" => $active,
    "uid" => $uid
    ));

if ($pass) {
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $reset = $db->prepare("UPDATE user SET password = :pass WHERE id = :uid");
    $reset->execute(array("pass" => $hash, "uid" => $uid));
}

header("Location: users.php");

