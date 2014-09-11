<?php
/*
 * Created on : Aug 30, 2014, 16:36:00 PM
 * Author     : mzijlstra 
 */

$db = new PDO("mysql:dbname=web_raptor;host=localhost", "root");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

