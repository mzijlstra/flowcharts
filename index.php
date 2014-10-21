<?php
session_start();
if (isset($_SESSION['user'])) {
    header("Location: wr.php");
    exit();
}
?>
<!DOCTYPE html>
<!--
    Created on : Aug 29, 2014, 13:00:01 PM
    Author     : mzijlstra 
-->
<html>
    <head>
        <title>Web Raptor</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="css/login.css" type="text/css" />

    </head>
    <body>
        <div class="central">
            <h1>Web Raptor</h1>
            <div class="container">
                <form action="login.php" method="post">
                    <?php if (isset($_SESSION['error'])) : ?>
                        <span class="error"><?= $_SESSION['error'] ?></span>
                        <br />
                    <?php endif; ?>
                    <input type="email" name="email" placeholder="Email Address" />
                    <br />
                    <input type="password" name="pass" placeholder="Password" />
                    <br />
                    <input type="submit" value="submit" />
                </form>
            </div>
        </div>
    </body>
</html>
