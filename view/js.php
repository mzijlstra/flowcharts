<?php global $MY_BASE; ?>
<!DOCTYPE html>
<!--
    Created on : Nov 2, 2022
    Author     : mzijlstra 
-->
<html>
    <head>
        <meta charset="UTF-8">
        <title>Flowcharts</title>
        <link rel="stylesheet" href="res/css/page.css" type="text/css" />
        <link rel="stylesheet" href="res/css/hljs-default.css" type="text/css" />
        <script src="res/js/lib/crypto-js.min.js"></script>
        <script src="res/js/lib/jquery-2.1.1.js" ></script>
        <script src="res/js/wr.js"></script>
        <script src="res/js/states.js"></script>
        <script src="res/js/edit.js"></script>
        <script src="res/js/exec.js"></script>
        <script src="res/js/utils-1.0.js"></script>
        <script src="res/js/lib/ace/ace.js" ></script>
        <style>
            #js_code {
                display: block;
            }
            #javascript_btn {
                top: 50px;
            }
        </style>
        <script>
            $(() => {
                var editor = null;
                if (!wr.editor) {
                    console.log('making editor');
                    editor = ace.edit("editor");
                    editor.setTheme("ace/theme/clouds");
                    editor.getSession().setMode("ace/mode/javascript");
                    editor.getSession().setUseSoftTabs(true);
                    wr.editor = editor;
                }
                editor = wr.editor;
                var decrypted = CryptoJS.AES.decrypt($("#code_from_php").text(), "Secret Passphrase");
                
                // this extra step is needed to get around utf8 to utf16 maddness for ACE editor
                $("#code_from_php").text(decrypted.toString(CryptoJS.enc.Utf8));

                editor.setValue($("#code_from_php").text());
                editor.selection.clearSelection();
                editor.setReadOnly(false);
                editor.focus();
            });
        </script>
    </head>
    <body>
        <h1 data-pid="<?= $pid ?>"><?= $pname ?></h1>
        <div id="projects">
            <div class="arrow_down"></div>
            <div id="project_menu" class="menu">
                <div id="new_proj" class="menu_item">New Project</div>
                <div id="recent_proj">
                    <div class="menu_label">Recent Projects:</div>
                    <div class="menu_item">-----</div>
                    <div class="menu_item">-----</div>
                    <div class="menu_item">-----</div>
                    <div class="menu_item">-----</div>
                    <div class="menu_item">-----</div>
                </div>
                <div id="open_proj" class="menu_item">Show All Projects</div>
            </div>
        </div>

        <div id="user" data-id="<?= $_SESSION['user']['id'] ?>">
            Hi <?= $_SESSION['user']['first'] ?>! <a href="<?= $MY_BASE ?>/logout">logout</a>
            <?php if ($_SESSION['user']['type'] === 'admin') : ?>
                <a href="<?= $MY_BASE ?>/user">users</a>
            <?php endif; ?>
        </div>

        <div class="view activeView" id="javascript_btn">
            JavaScript
        </div>

        <div id="output_disp">
            <div class="label">INPUT/OUTPUT</div>
            <div id="out"> 
            </div>
        </div>

        <div id="js_code">
            <div id="code_from_php"><?= $js ?></div>
            <div id="editor"></div>
            <div class="controls">
                <div id="save_msg" class="save_msg"></div>
                <div id="play_js_btn" class="circle_btn">
                    <div class="play"></div>
                </div>
            </div>
        </div>

        <!-- Different types of popup / overlay windows below -->
        <div id="images">
            <h2>Upload new:</h2>
            <form action="../images/<?= $uid ?>" method="post" enctype="multipart/form-data">
                <input type="file" name="image" />
                <input type="hidden" name="pid" value="<?= $pid ?>" />
                <input type="submit" value="upload" />
            </form>
            <h2>Already Uploaded:</h2>
            <?php foreach ($imgs as $img) : ?>
                <?php if ($img[0] !== "."): ?>
                    <h3><?= $img ?></h3>
                    <img id="<?= $img ?>" src="res/img/<?= $uid ?>/<?= $img ?>" />
                <?php endif; ?>
            <?php endforeach; ?>
        </div>

        <div id="projects_disp">
            <table id="project_data">
                <caption>Projects:</caption>
                <tr><th id="proj_by_name">Name</th>
                    <th id="proj_by_created">Created</th>
                    <th id="proj_by_accessed">Accessed</th>
                    <th>Del</th>
                </tr>
            </table>
            <div id="hide_proj"><div id="close_proj">&times;</div></div>
        </div>

        <div id="overlay"></div>        
        <div id="prompt" class="popup">
            <div class="popup_content">
                <div class="msg">Please enter input:</div>
                <div><input type="text" /></div>
            </div>
            <div class="center">
                <button id="prompt_ok">OK</button>
                <button id="prompt_cancel">Cancel</button>
            </div>
        </div>
        <div id="confirm" class="popup">
            <div class="popup_content">
                <div class="msg">Please confirm:</div>
            </div>
            <div class="center">
                <button id="confirm_cancel">Cancel</button>
                <button id="confirm_ok">OK</button>
            </div>
        </div>
        <div id="alert" class="popup">
            <div class="popup_content">
                <div class="msg">This is an alert!</div>
            </div>
            <div class="center"><button>OK</button></div>
        </div>
        <div id="logoutMsg" class="popup">
            <div class="popup_content">
                <div class="msg center">Your session is about to expire.</div>
                <div class="msg center">Auto log out in: <span id="logout_timeout">60</span></div>
            </div>
            <div class="center">
                <button id="logout_stay">Stay</button>
                <button id="logout_now">Logout</button>
            </div>
        </div>

        <footer>Flowcharts</footer>

        <!-- Sandbox for executing JS expressions -->
        <iframe id="sandbox" src="../sandbox" >
        </iframe>
    </body>
</html>
