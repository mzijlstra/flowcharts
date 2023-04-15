<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Projects</title>
        <style>
            td, th {
                border: 1px solid black;
                padding: 2px 10px;
            }
            table {
                border-collapse: collapse;
            }
        </style>
    </head>
    <body>
        <table>
            <caption>Projects for <?= $user['knownAs']?> <?= $user['lastname'] ?></caption>
            <tr>
                <th>Project</th>
                <th>Created</th>
                <th>Accessed</th>
            </tr>
            <?php foreach ($projects as $project): ?>
                <tr>
                    <td>
                        <a href="../user/<?= $user['id'] ?>/project/<?= $project['id'] ?>">
                            <?= $project["name"]?>
                        </a>
                    </td>
                    <td><?= $project["created"]?></td>
                    <td><?= $project["accessed"]?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </body>
</html>
