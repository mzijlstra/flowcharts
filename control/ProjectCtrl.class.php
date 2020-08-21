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
     * @GET(uri="/project/(\d+)$", sec="user")
     * @GET(uri="/user/(\d+)/project/(\d+)$", sec="admin")
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
     * Processes an image upload request
     * @return string redirect to current images for this project
     * 
     * @POST(uri="/images", sec="user")
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
