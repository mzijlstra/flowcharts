<!DOCTYPE html>
<!--
 Created on : August 30, 2014, 7:30:00 PM
 Author     : mzijlstra
-->
<?php
require '../share/loggedin.php';
require '../share/admin.php';
$uid = filter_input(INPUT_GET, "uid", FILTER_VALIDATE_INT);
$user = false;

if ($uid) {
    require '../share/dbcon.php';
    $stmt = $db->prepare("SELECT firstname, lastname, studentID, email, type, active "
            . "FROM user "
            . "WHERE id = :uid");
    $stmt->execute(array("uid" => $uid));
    $user = $stmt->fetch();
}
?>
<html>
    <head>
        <title>User Details</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <style>
            h1 {
                margin-bottom: 5px;
            }
            div.fields span {
                display: inline-block;
                width: 100px;
            }
        </style>
    </head>
    <body>
        <h1>User Details:</h1>
        <div class="fields">
            <form method="post" action="<?= $user ? "updateUser.php" : "insertUser.php" ?>">
                <?php if ($user) : ?>
                    <input type='hidden' name='uid' value='<?= $uid ?>' />
                <?php endif; ?>
                <span>First Name:</span>
                <input type="text" name="first" value="<?= $user ? $user['firstname'] : "" ?>" /> <br />

                <span>Last Name:</span>
                <input type="text" name="last"  value="<?= $user ? $user['lastname'] : "" ?>"/> <br />

                <span>Student ID:</span>
                <input type="text" name="sid"  value="<?= $user ? $user['studentID'] : "" ?>"/> <br />

                <span>Email:</span>
                <input type="text" name="email"  value="<?= $user ? $user['email'] : "" ?>"/> <br />

                <span>Password:</span>
                <input type="password" name="pass" /> <br />

                <span>Type:</span>
                <select name="type">
                    <option>student</option>
                    <option>admin</option>
                </select> <br />

                <span>Active:</span>
                <input type="checkbox" name="active" <?= $user && !$user['active'] ? "" : "checked" ?> /> <br />

                <input type="submit" value='<?= $user ? 'Update' : 'Add' ?>'/>
            </form>
        </div>
    </body>
</html>
