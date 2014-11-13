<?php

$request_uri = filter_input(INPUT_SERVER, "REQUEST_URI", FILTER_SANITIZE_URL);
$request_method = filter_input(INPUT_SERVER, "REQUEST_URI", FILTER_SANITIZE_STRING);

$uri = preg_replace("#/web-raptor/(.*)#", "$1", $request_uri);

if (preg_match("/\.(css|js|php)$/", $uri)){
    include $uri;
} else {
    include "${uri}.php";
}