<?php global $MY_BASE; ?>
<!DOCTYPE html>
<!--
    Created on : May 3, 2014, 6:10:01 PM
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

        <div class="view activeView" id="flowcharts_btn">
            Flowcharts
        </div>
        <div class="view" id="javascript_btn">
            JavaScript
        </div>
        <div id="workspace" class="edit">     
            <?php if ($pid) : ?>       
            <div id="var_area">
                <div class="separator"></div>
                <div id="variables">
                    <?php foreach ($funcs as $name => $fdata) : ?>
                        <div id="vars_<?= $name ?>" class="variables <?= $name == 'main' ? 'active' : '' ?>">
                            <?= $fdata['variables'] ?>
                        </div>
                    <?php endforeach; ?>
                </div>
                <div id="stack">
                    <div class="label">Stack &#8613;</div>
                </div>
            </div> <!-- end var_area -->

            <div id="functions">
                <div id="fun-names">
                    <span id="add_fun">+</span>
                    <?php foreach ($funcs as $name => $fdata): ?>
                        <span data-fid="<?= $fdata['id'] ?>" class="fun <?= $name == 'main' ? 'active' : '' ?>">
                            <span class="cornerb">
                                <span class="cornerw"></span>
                            </span>
                            <span class="name"><?= $name ?></span>
                            <span class="rem">&times;</span>
                        </span>
                    <?php endforeach; ?>

                    <div class="controls">
                        <div class="circle_btn" id="play_pause">
                            <div id="play_btn" class="play">
                            </div>
                            <div id="pause_btn">
                                <div class="pause_bar"></div>
                                <div class="pause_bar"></div>
                            </div>
                        </div>
                        <div id="delay_disp">
                            <span id="delay">0.5</span>
                        </div>
                    </div>

                </div> <!-- end fun-names -->

                <div id="instructions">
                    <?php foreach ($funcs as $name => $fdata) : ?>
                        <div id="ins_<?= $name ?>" class="instructions <?= $name == 'main' ? 'active' : '' ?>">
                            <?= $fdata['instructions'] ?>
                        </div>
                    <?php endforeach; ?>
                </div> <!-- end instructions -->

            </div> <!-- end functions -->
            <?php endif; ?>
        </div> <!-- end workspace -->

        <div id="output_disp">
            <div class="label">INPUT/OUTPUT</div>
            <div id="out"> 
            </div>
        </div>

        <!-- Different types of popup / overlay windows below -->
        <div id="js_code">
            <div id="code_from_php"><?= $js ?></div>
            <div id="editor"></div>
            <div class="controls">
                <div id="save_msg" class="save_msg"></div>
                <div id="edit_js_btn" class="edit_btn">EDIT</div>
                <div id="play_js_btn" class="circle_btn">
                    <div class="play"></div>
                </div>
            </div>
        </div>

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
        <div id="editMsg" class="popup">
            <div class="popup_content">
                <div class="msg center">Switch to JS Editing mode?</div>
                <div class="msg"> </div>
                <div class="msg">Flowchart mode will become unavailable for this project.</div>
            </div>
            <div class="center">
                <button id="edit_cancel">Cancel</button>
                <button id="edit_ok">OK</button>
            </div>
        </div>

        <footer>Flowcharts</footer>

        <div id="ins_menu" class="menu">
            <div class="menu_item" id="add_input">Input</div>
            <div class="menu_item" id="add_output">Output</div>
            <div class="menu_item" id="add_assignment">Assignment</div>
            <div class="menu_item" id="add_if">If Statement</div>
            <div class="menu_item" id="add_while">While Loop</div>
            <div class="menu_item" id="add_call">Call</div>
        </div>


        <div id="building_blocks">
            <span id="fun-name" class="fun">
                <span class="cornerb">
                    <span class="cornerw"></span>
                </span>
                <span class="name">extra</span>
                <span class="rem">&times;</span>
            </span>

            <div id="declaration" class="variable bottom">
                <div class="del">&times;</div>
                <div class="type_container">
                    <div class="menu">
                        <div class="menu_item">string</div>
                        <div class="menu_item">number</div>
                        <div class="menu_item">boolean</div>
                        <div class="menu_item">array</div>
                        <div class="menu_item">object</div>
                    </div>
                    <span class="type">string</span>
                </div>
                <input class="var" pattern="[_a-zA-Z]([_0-9a-zA-Z]+)?"/>
            </div>

            <div id="start" class="statement">
                <div class="start">
                    <div class="text">
                        <div class="type_container">
                            <div class="menu">
                                <div class="menu_item">string</div>
                                <div class="menu_item">number</div>
                                <div class="menu_item">boolean</div>
                                <div class="menu_item">array</div>
                                <div class="menu_item">object</div>
                            </div>
                            <span class="type">number</span>
                        </div>
                        <span class="name">main</span>(<span class="params"></span>)
                    </div>
                </div>
            </div>

            <div id="return" class="statement">
                <div class="stop">
                    <div class="text">
                        return <span class="exp">0</span>
                    </div>
                </div>
            </div>

            <div id="connection" class="connection">
                <div class="line"></div>
                <div class="point"></div>
                <div class="sline"></div>
                <div class="line"></div>
                <div class="arrow_down"></div>
            </div>

            <div id="input" class="statement" >
                <div class="del">&times;</div>
                <div class="input">
                    <div class="var_container">
                        <div class="menu"></div>
                        <span class="var">&nbsp;</span>
                    </div>
                    <span class="asgn">&#171;</span> 
                    <span class="io">INPUT</span>
                </div>
            </div>

            <div id="output" class="statement" >
                <div class="del">&times;</div>
                <div class="output">
                    <span class="io">OUTPUT</span>
                    <span class="asgn">&#171;</span> 
                    <span class="exp">&nbsp;</span>
                </div>
            </div>

            <div id="assignment" class="statement" >
                <div class="del">&times;</div>
                <div class="assignment">
                    <div class="var_container">
                        <div class="menu"></div>
                        <span class="var">&nbsp;</span>
                    </div>
                    <span class="asgn">&#171;</span> 
                    <span class="exp">&nbsp;</span>
                </div>
            </div>

            <div id="call" class="statement">
                <div class="del">&times;</div>
                <div class="call">
                    <span class="exp">&nbsp;</span>
                </div>
            </div>

            <div id="if" class="statement" >
                <div class="if">
                    <div class="diamond">
                        <div class="del">&times;</div>
                        <div class="diamond_top_outside">
                            <div class="diamond_top_inside">
                            </div>
                        </div>
                        <div class="diamond_bot_outside">
                            <div class="diamond_bot_inside">
                            </div>
                        </div>
                        <div class="label_stmt">if</div>
                        <div class="label_true">true</div>
                        <div class="label_false">false</div>
                        <div class="exp"></div>
                    </div>
                    <table>
                        <tr>
                            <td class="left">
                                <div class="top_connect"></div>
                                <div class="absolute_left"></div>

                                <div class="connection">
                                    <div class="line"></div>
                                    <div class="point"></div>  
                                    <div class="sline"></div>
                                    <div class="line"></div>
                                </div>

                                <div class="bot_left_connect">
                                    <div class="arrow_left"></div>
                                </div>
                            </td>
                            <td class="right">
                                <div class="absolute_right"></div>

                                <div class="connection">
                                    <div class="line"></div>
                                    <div class="point"></div>
                                    <div class="sline"></div>
                                    <div class="line"></div>
                                </div>

                                <div class="bot_right_connect"></div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div id="while" class="statement">
                <div class="while">
                    <div class="diamond">
                        <div class="del">&times;</div>
                        <div class="diamond_top_outside">
                            <div class="diamond_top_inside">
                            </div>
                        </div>
                        <div class="diamond_bot_outside">
                            <div class="diamond_bot_inside">
                            </div>
                        </div>
                        <div class="label_stmt">while</div>
                        <div class="label_true">true</div>
                        <div class="label_false">false</div>
                        <div class="exp"></div>
                        <div class="true_connector"></div>
                    </div> 
                    <div class="container">
                        <div class="false_line"></div>
                        <div class="return_line">
                            <div class="arrow_up"></div>
                        </div>
                        <div class="loop_body">
                            <div class="connection">
                                <div class="line"></div>
                                <div class="point"></div>
                                <div class="sline"></div>
                                <div class="line"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div> <!-- end building blocks -->

        <!-- Sandbox for executing JS expressions -->
        <iframe id="sandbox" src="../sandbox" >
        </iframe>
    </body>
</html>
