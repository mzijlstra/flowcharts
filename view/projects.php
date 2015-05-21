<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Projects</title>
        <link rel="stylesheet" href="page.css" type="text/css" />
        <script src="jquery-2.1.1.js" ></script>
    </head>
    <body>
        <div id="user">Hi <?= $_SESSION['user']['first'] ?>! <a href="logout">logout</a></div>

        <div id="project_list">
            <h2>Web-Raptor Projects:</h2>
            <table>
                <tr>
                    <th class="pname left">Name</th>
                    <th>Accessed</th>
                    <th>Created</th>
                </tr>
                <?php foreach ($data as $row) : ?>
                    <tr class="project" pid="<?= $row['id'] ?>">
                        <td class="left"><?= $row['name'] ?></td>
                        <td class="center"><?= $row['accessed'] ?></td>
                        <td class="center"><?= $row['created'] ?></td>
                    </tr>
                <?php endforeach; ?>
            </table>
        </div>
        <footer>Web-Raptor</footer>
        <script>
            $(".project").click(function () {
                "use strict";
                var tr = $(this);
                window.location.assign("project/" + tr.attr("pid"));
            });
        </script>
    </body>
</html>
