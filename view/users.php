<!DOCTYPE html>
<!--
To change this license header, choose License Headers in Project Properties.
To change this template file, choose Tools | Templates
and open the template in the editor.
-->
<html>
    <head>
        <meta charset="UTF-8">
        <title>Users</title>
        <script src="../js/jquery-2.1.1.js"></script>
        <script>
            $(function() {
                "use strict";
                $("tr").click(function() {
                    var t = $(this);
                    var uid = $(t.children("td")[0]).text();
                    location.href = "userDetails.php?uid=" + uid;
                });
            });
        </script>
        <style>
            body {
                font-family: monospace;
                font-size: 12px;
                color: #333366; 
                padding: 0em 5em;
            }
            h1 {
                //margin-bottom: 5px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
            }
            tr {
                background-color: white;
                border-bottom: 1px solid black;
            }
            tr:nth-child(odd) {
                background-color: #FAFAFF;
            }
            td {
                cursor: pointer;
                text-align: right;
                border: 1px solid black;
                padding: 0px 3px;
            }
            div.add {
                text-align: center;
                margin: 1em 0em;
            }
        </style>
    </head>
    <body>
        <h1>Users:</h1>
        <div class="add">
            <button>Add a User</button>
        </div>
        <table>
            <tr>
                <th>ID</th>
                <th>first</th>
                <th>last</th>
                <th>email</th>
                <th>created</th>
                <th>accessed</th>
                <th>active</th>
            </tr>
            <?php foreach ($users as $user) : ?>
                <tr>
                    <td><?= $user['id'] ?></td>
                    <td><?= $user['firstname'] ?></td>
                    <td><?= $user['lastname'] ?></td>
                    <td><?= $user['email'] ?></td>
                    <td><?= $user['created'] ?></td>
                    <td><?= $user['accessed'] ?></td>
                    <td><?= $user['active'] ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
        <div class="add">
            <button>Add a User</button>
        </div>
    </body>
</html>
