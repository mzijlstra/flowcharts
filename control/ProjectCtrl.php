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

    // GET /project/(\d+)
    public function getProject() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $pid = $URI_PARAMS[1];
        $VIEW_DATA['funcs'] = $this->functionDao->all($pid);

        $proj = $this->projectDao->get($pid);
        $VIEW_DATA['pname'] = $proj['name'];
        $VIEW_DATA['pid'] = $pid;

        return "wr.php";
    }

    // AJAX GET /project$
    public function getProjects() {
        global $VIEW_DATA;

        $uid = $_SESSION['user']['id'];

        // Retrieve all projects for this user
        $projects = $this->projectDao->all($uid);
        $VIEW_DATA['json'] = $projects;

        return "json.php";
    }

    // AJAX POST /project/(\w+)
    public function create() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $name = $URI_PARAMS[1];
        $uid = $_SESSION['user']['id'];

        try {
            $this->projectDao->db->beginTransaction();

            $pid = $this->projectDao->create($name, $uid);
            $this->functionDao->createMain($pid);

            $this->projectDao->db->commit();
        } catch (PDOException $e) {
            $this->projectDao->db->rollBack();
            throw $e;
        }
        $VIEW_DATA['json'] = $pid;
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

    // AJAX POST /function/(\d+)/rename
    public function renameFunction() {
        global $URI_PARAMS;
        $fid = $URI_PARAMS[1];

        $name = filter_input(INPUT_POST, "name");
        $this->functionDao->rename($fid, $name);
    }

    // AJAX POST /function/(\d+)/delete
    public function deleteFunction() {
        global $URI_PARAMS;
        $fid = $URI_PARAMS[1];

        $this->functionDao->delete($fid);
    }

}
