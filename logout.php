<?php
/*
 * Created on : Aug 30, 2014, 14:57:01 PM
 * Author     : mzijlstra 
*/
session_start();
session_destroy();
header("Location: index.php");
