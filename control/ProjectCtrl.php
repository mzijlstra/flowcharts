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

    // GET /project/(\d+)$
    // GET /user/(\d+)/project/(\d+)$
    public function getProject() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $user = $_SESSION['user'];
        $uid = $user['id'];
        $pid = $URI_PARAMS[1];

        $record = true;
        if (count($URI_PARAMS) === 3) {
            if ($user['type'] === 'admin') {
                $uid = $URI_PARAMS[1];
                $pid = $URI_PARAMS[2];
                $record = false;
            } else {
                // Show access denied
                http_response_code(403);
                return "error/403.php";
            }
        }

        $proj = $this->projectDao->get($pid, $uid, $record);
        if (!$proj) {
            // clearly uid did not match, show access denied
            http_response_code(403);
            return "error/403.php";
        }
        $VIEW_DATA['funcs'] = $this->functionDao->all($pid);

        $VIEW_DATA['pname'] = $proj['name'];
        $VIEW_DATA['pid'] = $pid;

        return "wr.php";
    }

    // GET /project/recent
    public function getRecent() {
        global $MY_BASE;
        $uid = $_SESSION['user']['id'];
        $pid = $this->projectDao->recent($uid);
        return "Location: $MY_BASE/project/$pid";
    }

    // AJAX GET /project/other_recents
    public function getOtherRecent() {
        global $VIEW_DATA;
        $uid = $_SESSION['user']['id'];
        $pid = filter_input(INPUT_GET, "pid");
        $VIEW_DATA['json'] = $this->projectDao->otherRecent($uid, $pid);
        return "json.php";
    }

    // AJAX GET /project$
    public function getProjects() {
        global $VIEW_DATA;

        $uid = $_SESSION['user']['id'];
        $order = filter_input(INPUT_GET, "order");
        $direction = filter_input(INPUT_GET, "direction");
        if ($order === "") {
            $order = "created";
        }
        if ($direction == "") {
            $direction = "ASC";
        }
        if (!preg_match("/(name|created|accessed)/", $order) 
                || !preg_match("/(ASC|DESC)/", $direction)) {
            return "error/500.php";
        }

        // Retrieve all projects for this user
        $projects = $this->projectDao->all($uid, $order, $direction);
        $VIEW_DATA['json'] = $projects;

        return "json.php";
    }

    // AJAX GET /user/(\d+)/project$
    public function getUserProjects() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $uid = $URI_PARAMS[1];

        // Retrieve all projects for this user
        $projects = $this->projectDao->all($uid);
        $VIEW_DATA['json'] = $projects;

        return "json.php";
    }

    // AJAX POST /project/add/(\D[^/]+)$
    public function create() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $name = urldecode($URI_PARAMS[1]);
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

    // AJAX POST /project/(\d+)/rename$
    public function rename() {
        global $URI_PARAMS;
        $pid = $URI_PARAMS[1];
        $uid = $_SESSION['user']['id'];
        $name = filter_input(INPUT_POST, "name");
        $this->projectDao->rename($pid, $uid, $name);
    }

    // AJAX POST /project/(\d+)/delete
    public function delete() {
        global $URI_PARAMS;
        $pid = $URI_PARAMS[1];
        $uid = $_SESSION['user']['id'];
        $this->projectDao->delete($pid, $uid);
    }

    // AJAX POST /project/(\d+)/(\w+)
    public function addFunction() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $uid = $_SESSION['user']['id'];
        $pid = $URI_PARAMS[1];
        $name = $URI_PARAMS[2];
        $idata = filter_input(INPUT_POST, "idata");
        $vdata = filter_input(INPUT_POST, "vdata");

        if ($this->projectDao->isOwner($pid, $uid)) {
            $fid = $this->functionDao->create($pid, $name, $idata, $vdata);
            $VIEW_DATA['json'] = $fid;
            return "json.php";
        } else {
            http_response_code(403);
            return "error/403.php";
        }
    }

    // AJAX POST /function/(\d+)/vars
    public function updVars() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $vdata = filter_input(INPUT_POST, "vdata");
            $this->functionDao->updVars($fid, $vdata);
        } else {
            http_response_code(403);
            return "error/403.php";
        }
    }

    // AJAX POST /function/(\d+)/ins
    public function updIns() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $idata = filter_input(INPUT_POST, "idata");
            $this->functionDao->updIns($fid, $idata);
        } else {
            http_response_code(403);
            return "error/403.php";
        }
    }

    // AJAX POST /function/(\d+)/rename
    public function renameFunction() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $name = filter_input(INPUT_POST, "name");
            $this->functionDao->rename($fid, $name);
        } else {
            http_response_code(403);
            return "error/403.php";
        }
    }

    // AJAX POST /function/(\d+)/delete
    public function deleteFunction() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $this->functionDao->delete($fid);
        } else {
            http_response_code(403);
            return "error/403.php";
        }
    }

}
