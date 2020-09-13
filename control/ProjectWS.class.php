<?php

/**
 * Description of ProjectWS
 *
 * @author mzijlstra 2018-03-28
 * 
 * @WebService
 */
class ProjectWS {
    /**
     * @var ProjectDao Project Data Access Object
     * @Inject("ProjectDao") 
     */
    public $projectDao;
    /**
     * @var FunctionDao Function Data Access Object
     * @Inject("FunctionDao")
     */
    public $functionDao;

    /**
     * Gets list of 6 other most recent projects (excluding current/most recent)
     * and returns data in JSON format 
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return data(structure) to be JSONified or String indicating error view
     * 
     * @GET(uri="|^/project/other_recent$|", sec="user")
     * @GET(uri="|^/user/(\d+)/project/other_recent$|", sec="admin")
     */
    public function getOtherRecent() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];

        if (count($URI_PARAMS) === 2) {
            if ($_SESSION['user']['type'] === 'admin') {
                $uid = $URI_PARAMS[1];
            } else {
                // Show access denied
                return "error/403.php";
            }
        }

        $pid = filter_input(INPUT_GET, "pid");
        return $this->projectDao->otherRecent($uid, $pid);
    }

    /**
     * Gets list of all projects and returns them as JSON (expects AJAX call)
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return data(structure) to be JSONified or String indicating error view
     * 
     * @GET(uri="|^/project$|", sec="user")
     */
    public function getProjects() {
        $uid = $_SESSION['user']['id'];
        $order = filter_input(INPUT_GET, "order");
        $direction = filter_input(INPUT_GET, "direction");
        if ($order == "") {
            $order = "created";
        }
        if ($direction == "") {
            $direction = "ASC";
        }
        if (!preg_match("/(name|created|accessed)/", $order) ||
                !preg_match("/(ASC|DESC)/", $direction)) {
            return "error/500.php";
        }

        // show all projects for this user
        return $this->projectDao->all($uid, $order, $direction);
    }

    /**
     * Retrieves all projects for current user and returns as JSON(expects AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return data(structure) to be JSONified
     * 
     * @GET(uri="|^/user/(\d+)/project$|", sec="user")
     */
    public function getUserProjects() {
        global $URI_PARAMS;
        $uid = $URI_PARAMS[1];

        // Return all projects for this user
        return $this->projectDao->all($uid);
    }

    /**
     * Creates a new project, and a main function for the newly created project
     * then returns the project id as JSON (expects AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return data(structure) to be JSONified or String indicating error view
     * @throws PDOException on insertion error
     * 
     * @POST(uri="|^/project/add/(\D[^/]+)$|", sec="user")
     */
    public function create() {
        global $URI_PARAMS;

        $name = urldecode($URI_PARAMS[1]);
        $uid = $_SESSION['user']['id'];

        try {
            $this->projectDao->db->beginTransaction();

            $pid = $this->projectDao->create($name, $uid);
            $this->functionDao->createMain($pid);

            $this->projectDao->db->commit();
        } catch (PDOException $e) {
            $this->projectDao->db->rollBack();
            return "error/500.php";
        }
        return $pid;
    }

    /**
     * Renames a project (expects to be called from AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * 
     * @POST(uri="|^/project/(\d+)/rename$|", sec="user")
     */
    public function rename() {
        global $URI_PARAMS;
        $pid = $URI_PARAMS[1];
        $uid = $_SESSION['user']['id'];
        $name = filter_input(INPUT_POST, "name");
        $this->projectDao->rename($pid, $uid, $name);
    }

    /**
     * Deletes a project (expects to be called from AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * 
     * @POST(uri="|^/project/(\d+)/delete|", sec="user")
     */
    public function delete() {
        global $URI_PARAMS;
        $pid = $URI_PARAMS[1];
        $uid = $_SESSION['user']['id'];
        $this->projectDao->delete($pid, $uid);
    }

    /**
     * Adds a function to the current project (expects AJAX call)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return data(structure) to be JSONified or String indicating error view
     * 
     * @POST(uri="|^/project/(\d+)/(\w+)|", sec="user")
     */
    public function addFunction() {
        global $URI_PARAMS;

        $uid = $_SESSION['user']['id'];
        $pid = $URI_PARAMS[1];
        $name = $URI_PARAMS[2];
        $idata = filter_input(INPUT_POST, "idata");
        $vdata = filter_input(INPUT_POST, "vdata");

        if ($this->projectDao->isOwner($pid, $uid)) {
            return $this->functionDao->create($pid, $name, $idata, $vdata);
        } else {
            return "error/403.php";
        }
    }

    /**
     * Update the variables for the given function (expects AJAX call)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @return string view name
     * 
     * @POST(uri="|^/function/(\d+)/vars|", sec="user")
     */
    public function updVars() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $vdata = filter_input(INPUT_POST, "vdata");
            $this->functionDao->updVars($fid, $vdata);
        } else {
            return "error/403.php";
        }
    }

    /**
     * Update the instructions for the given function (expects AJAX call)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @return string view name
     * 
     * @POST(uri="|^/function/(\d+)/ins|", sec="user")
     */
    public function updIns() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $idata = filter_input(INPUT_POST, "idata");
            $this->functionDao->updIns($fid, $idata);
        } else {
            return "error/403.php";
        }
    }

    /**
     * Renames the given function (expects AJAX call)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @return string view name
     * 
     * @POST(uri="|^/function/(\d+)/rename|", sec="user")
     */
    public function renameFunction() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $name = filter_input(INPUT_POST, "name");
            $this->functionDao->rename($fid, $name);
        } else {
            return "error/403.php";
        }
    }

    /**
     * Deletes the given function (expects AJAX call)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @return string view name
     * 
     * @POST(uri="|^/function/(\d+)/delete|", sec="user")
     */
    public function deleteFunction() {
        global $URI_PARAMS;
        $uid = $_SESSION['user']['id'];
        $fid = $URI_PARAMS[1];

        if ($this->functionDao->isOwner($fid, $uid)) {
            $this->functionDao->delete($fid);
        } else {
            return "error/403.php";
        }
    }
}
