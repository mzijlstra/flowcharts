<?php

/**
 * Description of ProjectController
 *
 * @author mzijlstra 11/15/2014
 */
class ProjectCtrl {
    // set by context on creation
    public $projectDao;
    public $functionDao;

    public function login() {
        global $VIEW_DATA;
        $uid = $_SESSION['user']['id'];
        
        // Retrieve names and ids of projects for this user
        $_SESSION['projects'] = $this->projectDao->all($uid);

        // retieve function data for most recent project
        $pid = array_keys($_SESSION['projects'])[0];
        $VIEW_DATA['funcs'] = $this->functionDao->all($pid);
        
        return "wr.php";
    }

}
