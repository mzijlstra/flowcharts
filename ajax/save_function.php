<?php
/* 
 Created on : August 30, 2014, 7:30:00 PM
 Author     : mzijlstra
 */

session_start();

require 'model/security.php';

/* Expected data format:
 * 
 * { "id": 1, "instructions": "<html>", "variables": "<html>" }
 *  
 */

$data = json_decode( filter_input(INPUT_POST, "data"), true);

