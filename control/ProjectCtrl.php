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

    // GET /wr
    public function getProjects() {
        global $URI_PARAMS;
        global $VIEW_DATA;
        
        $uid = $_SESSION['user']['id'];

        // Retrieve names and ids of projects for this user
        $projects = $this->projectDao->all($uid);
        $VIEW_DATA['projects'] = $projects;

        // set data for most recent project
        $pid = array_keys($projects)[0];
        $VIEW_DATA['pid'] = $pid;
        $VIEW_DATA['pname'] = $projects[$pid];
        
        // FIXME this should be done from page by AJAX
        $URI_PARAMS[1] = $pid;
        $this->getFunctions();
        
        return "wr.php";
    }
    
    // AJAX POST /project/(\w+)
    public function create() {
        global $URI_PARAMS;
        global $VIEW_DATA;
        
        $name = $URI_PARAMS[1];
        $uid = $_SESSION['user']['id'];
        $pid = $this->projectDao->create($name, $uid);
        
        $this->functionDao->createMain($pid);
        $VIEW_DATA['value'] = $pid;
        return "value.php";
    }
    
    // AJAX GET /project/(\d+)
    public function getFunctions() {
        global $URI_PARAMS;
        global $VIEW_DATA;
        
        $pid = $URI_PARAMS[1];
        $VIEW_DATA['json'] = $this->functionDao->all($pid);

        return "json.php";
    }
    
    // AJAX POST /project/(\d+)/(\w+)
    public function addFunction() {
        global $URI_PARAMS;
        global $VIEW_DATA;
        
        $pid = $URI_PARAMS[1];
        $name = $URI_PARAMS[2];
        $idata = filter_input(INPUT_POST, "idata");
        $vdata = filter_input(INPUT_POST, "vdata");
        
        $fid = $this->functionDao->create($pid, $name, $idata, $vdata);
        $VIEW_DATA['json'] = $fid;
        
        return "json.php";   
    }

    // AJAX POST /function/(\d+)/vars
    public function updVars() {
        global $URI_PARAMS;
        $fid = $URI_PARAMS[1];

        $vdata = filter_input(INPUT_POST, "vdata");
        $this->functionDao->updVars($fid, $vdata);
    }

    // AJAX POST /function/(\d+)/ins
    public function updIns() {
        global $URI_PARAMS;
        $fid = $URI_PARAMS[1];

        $idata = filter_input(INPUT_POST, "idata");
        $this->functionDao->updIns($fid, $idata);
    }

}
