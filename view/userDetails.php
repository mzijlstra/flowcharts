<!DOCTYPE html>
<!--
 Created on : August 30, 2014, 7:30:00 PM
 Author     : mzijlstra
-->
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
            <form method="post" action="<?= $user ? $user['id'] : "../user"?>">
                <span>First Name:</span>
                <input type="text" name="first" value="<?= $user ? $user['firstname'] : "" ?>" /> <br />

                <span>Last Name:</span>
                <input type="text" name="last"  value="<?= $user ? $user['lastname'] : "" ?>"/> <br />

                <span>Email:</span>
                <input type="text" name="email"  value="<?= $user ? $user['email'] : "" ?>"/> <br />

                <span>Password:</span>
                <input type="password" name="pass" /> <br />

                <span>Type:</span>
                <select name="type">
                    <option>student</option>
                    <option <?= $user && $user['type'] === "admin" ? 'selected="selected"' : '' ?>>
                        admin</option>
                </select> <br />

                <span>Active:</span>
                <input type="checkbox" name="active" <?= $user && !$user['active'] ? "" : "checked" ?> /> <br />

                <input type="submit" value='<?= $user ? 'Update' : 'Add' ?>'/>
            </form>
            <a href="../user"><button>Back</button></a>
        </div>
    </body>
</html>
