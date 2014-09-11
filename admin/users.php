<?php
require '../share/loggedin.php';
require '../share/admin.php';
require '../share/dbcon.php';

$stmt = $db->prepare("SELECT * FROM user");
$stmt->execute();
?>
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
                location.href="userDetails.php?uid=" + uid;
            });
        });
    </script>
    <style>
        h1 {
            margin-bottom: 5px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        tr th {
            background-color: white;
            color: navy;
            border-bottom: 1px solid black;
        }
        tr:nth-child(odd) {
            background-color: #FAFAFF;
        }
        td {
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Users:</h1>
    <table>
        <tr>
            <th>ID</th>
            <th>first</th>
            <th>last</th>
            <th>studentID</th>
            <th>email</th>
            <th>created</th>
            <th>accessed</th>
            <th>active</th>
        </tr>
        <?php foreach ($stmt as $row) : ?>
            <tr>
                <td><?= $row['id'] ?></td>
                <td><?= $row['firstname'] ?></td>
                <td><?= $row['lastname'] ?></td>
                <td><?= $row['studentID'] ?></td>
                <td><?= $row['email'] ?></td>
                <td><?= $row['created'] ?></td>
                <td><?= $row['accessed'] ?></td>
                <td><?= $row['active'] ?></td>
            </tr>
        <?php endforeach; ?>
    </table>
    <a href="userDetails.php">Add User</a>
</body>
</html>
