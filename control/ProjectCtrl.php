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
        $uid = $_SESSION['user']['id'];
        
        // Retrieve names and ids of recently used projects
        $_SESSION['recent'] = $this->projectDao->recents($uid);

        return "wr.php";
    }

}
