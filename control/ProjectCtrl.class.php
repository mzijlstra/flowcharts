<?php

/**
 * Description of ProjectController
 *
 * @author mzijlstra 11/15/2014
 * 
 * @Controller
 */
class ProjectCtrl {

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
     * Show project based on id
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return string name of view file to be rendered
     * 
     * @Request(method="GET", uri="/project/(\d+)$", sec="user")
     * @Request(method="GET", uri="/user/(\d+)/project/(\d+)$", sec="admin")
     */
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
                return "error/403.php";
            }
        }

        $proj = $this->projectDao->get($pid, $uid, $record);
        if (!$proj) {
            // clearly uid did not match, show access denied
            return "error/403.php";
        }

        $VIEW_DATA['funcs'] = $this->functionDao->all($pid);
        $VIEW_DATA['pname'] = $proj['name'];
        $VIEW_DATA['pid'] = $pid;
        $VIEW_DATA['imgs'] = $this->getImages($uid);

        return "wr.php";
    }

    /**
     * Helper function to load images for the given user id
     * @param int $uid user id
     * @return array of image file names
     */
    private function getImages($uid) {
        if (!file_exists("res/img/$uid")) {
            mkdir("res/img/$uid");

            // QUESTION do we want to link default starter images?
            $files = glob("res/img/*");
            foreach ($files as $file) {
                if (!is_dir($file)) {
                    $link = str_replace("res/img", "res/img/$uid", $file);
                    $source = str_replace("res/img", "..", $file);
                    symlink($source, $link);
                }
            }
        }

        $files = glob("res/img/$uid/*");
        // sort images by upload date
        usort($files, function($a, $b) {
            return filemtime($a) < filemtime($b);
        });

        // strip leading directory name
        $imgs = array();
        foreach ($files as $file) {
            $imgs[] = basename($file);
        }

        return $imgs;
    }

    /**
     * Redirects to the most recently opened project
     * @global string $MY_BASE the base URI of our application
     * @return string redirect URI to send browser to most recent project
     * 
     * @Request(method="GET", uri="", sec="user")
     */
    public function getRecent() {
        global $MY_BASE;
        $uid = $_SESSION['user']['id'];
        $pid = $this->projectDao->recent($uid);
        return "Location: $MY_BASE/project/$pid";
    }

    /**
     * Gets list of 6 other most recent projects (excluding current/most recent)
     * and returns data in JSON format (expects to be called through AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return string name of view file
     * 
     * AJAX
     * @Request(method="GET", uri="/project/other_recent", sec="user")
     * AJAX
     * @Request(method="GET", uri="/user/(\d+)/project/other_recent", sec="admin")
     */
    public function getOtherRecent() {
        global $VIEW_DATA;
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
        $VIEW_DATA['json'] = $this->projectDao->otherRecent($uid, $pid);
        return "json.php";
    }

    /**
     * Gets list of all projects and returns them as JSON (expects AJAX call)
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return string name of view file
     * 
     * AJAX
     * @Request(method="GET", uri="/project$", sec="user")
     */
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
        if (!preg_match("/(name|created|accessed)/", $order) ||
                !preg_match("/(ASC|DESC)/", $direction)) {
            return "error/500.php";
        }

        // Retrieve all projects for this user
        $projects = $this->projectDao->all($uid, $order, $direction);
        $VIEW_DATA['json'] = $projects;

        return "json.php";
    }

    /**
     * Retrieves all projects for current user and returns as JSON(expects AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return string name of view file
     * 
     * AJAX
     * @Request(method="GET", uri="/user/(\d+)/project$", sec="user")
     */
    public function getUserProjects() {
        global $URI_PARAMS;
        global $VIEW_DATA;

        $uid = $URI_PARAMS[1];

        // Retrieve all projects for this user
        $projects = $this->projectDao->all($uid);
        $VIEW_DATA['json'] = $projects;

        return "json.php";
    }

    /**
     * Creates a new project, and a main function for the newly created project
     * then returns the project id as JSON (expects AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @global array $VIEW_DATA empty array that we populate with view data
     * @return string name of view file
     * @throws PDOException on insertion error
     * 
     * AJAX
     * @Request(method="POST", uri="/project/add/(\D[^/]+)$", sec="user")
     */
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
            return "error/500.php";
        }
        $VIEW_DATA['json'] = $pid;
        return "json.php";
    }

    /**
     * Renames a project (expects to be called from AJAX)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * 
     * AJAX
     * @Request(method="POST", uri="/project/(\d+)/rename$", sec="user")
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
     * AJAX
     * @Request(method="POST", uri="/project/(\d+)/delete", sec="user")
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
     * @return name of view to be rendered
     * 
     * AJAX
     * @Request(method="POST", uri="/project/(\d+)/(\w+)", sec="user")
     */
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
            return "error/403.php";
        }
    }

    /**
     * Update the variables for the given function (expects AJAX call)
     * @global array $URI_PARAMS as provided by framework based on request URI
     * @return string view name
     * 
     * AJAX
     * @Request(method="POST", uri="/function/(\d+)/vars", sec="user")
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
     * AJAX
     * @Request(method="POST", uri="/function/(\d+)/ins", sec="user")
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
     * AJAX
     * @Request(method="POST", uri="/function/(\d+)/rename", sec="user")
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
     * AJAX
     * @Request(method="POST", uri="/function/(\d+)/delete", sec="user")
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

    /**
     * Processes an image upload request
     * @return string redirect to current images for this project
     * 
     * @Request(method="POST", uri="/images", sec="user")
     */
    public function uploadImages() {
        $pid = filter_input(INPUT_POST, "pid");
        if (is_uploaded_file($_FILES["image"]["tmp_name"])) {
            $name = $_FILES["image"]["name"];
            move_uploaded_file($_FILES["image"]["tmp_name"], "res/img/$name");
        }
        return "Location: project/$pid#images";
    }

}
