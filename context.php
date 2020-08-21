<?php
$security = array(
	'|GET@/login$|' => 'none',
	'|GET@/logout|' => 'none',
	'|POST@/login$|' => 'none',
	'|GET@/sandbox$|' => 'user',
	'|GET@/project/(\d+)$|' => 'user',
	'|POST@/images|' => 'user',
	'|GET@/project/other_recent|' => 'user',
	'|GET@/project$|' => 'user',
	'|GET@/user/(\d+)/project$|' => 'user',
	'|POST@/project/add/(\D[^/]+)$|' => 'user',
	'|POST@/project/(\d+)/rename$|' => 'user',
	'|POST@/project/(\d+)/delete|' => 'user',
	'|POST@/project/(\d+)/(\w+)|' => 'user',
	'|POST@/function/(\d+)/vars|' => 'user',
	'|POST@/function/(\d+)/ins|' => 'user',
	'|POST@/function/(\d+)/rename|' => 'user',
	'|POST@/function/(\d+)/delete|' => 'user',
	'|GET@/$|' => 'user',
	'|GET@/user/add|' => 'admin',
	'|GET@/user/(\d+)/project/(\d+)$|' => 'admin',
	'|GET@/user/(\d+)/project/other_recent|' => 'admin',
	'|GET@/user|' => 'admin',
	'|GET@/user/(\d+)$|' => 'admin',
	'|POST@/user|' => 'admin',
	'|POST@/user/(\d+)$|' => 'admin',
);
$view_ctrl = array(
	'|/login$|' => 'login.php',
	'|/sandbox$|' => 'sandbox.php',
	'|/user/add|' => 'userDetails.php',
);
$get_ctrl = array(
	'|/project/(\d+)$|' => 'ProjectCtrl@getProject',
	'|/user/(\d+)/project/(\d+)$|' => 'ProjectCtrl@getProject',
	'|/project/other_recent|' => 'ProjectWS@getOtherRecent',
	'|/user/(\d+)/project/other_recent|' => 'ProjectWS@getOtherRecent',
	'|/project$|' => 'ProjectWS@getProjects',
	'|/user/(\d+)/project$|' => 'ProjectWS@getUserProjects',
	'|/$|' => 'UserCtrl@loggedIn',
	'|/logout|' => 'UserCtrl@logout',
	'|/user|' => 'UserCtrl@all',
	'|/user/(\d+)$|' => 'UserCtrl@details',
);
$post_ctrl = array(
	'|/images|' => 'ProjectCtrl@uploadImages',
	'|/project/add/(\D[^/]+)$|' => 'ProjectWS@create',
	'|/project/(\d+)/rename$|' => 'ProjectWS@rename',
	'|/project/(\d+)/delete|' => 'ProjectWS@delete',
	'|/project/(\d+)/(\w+)|' => 'ProjectWS@addFunction',
	'|/function/(\d+)/vars|' => 'ProjectWS@updVars',
	'|/function/(\d+)/ins|' => 'ProjectWS@updIns',
	'|/function/(\d+)/rename|' => 'ProjectWS@renameFunction',
	'|/function/(\d+)/delete|' => 'ProjectWS@deleteFunction',
	'|/login$|' => 'UserCtrl@login',
	'|/user|' => 'UserCtrl@create',
	'|/user/(\d+)$|' => 'UserCtrl@update',
);
class Context {
    private $objects = array();
    
    public function Context() {
        $db = new PDO("mysql:dbname=web_raptor;host=localhost", "root", "root");
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->objects["DB"] = $db;
    }

    public function get($id) {
        if ($id === "FunctionDao" && !isset($this->objects["FunctionDao"])) {
            $this->objects["FunctionDao"] = new FunctionDao();
            $this->objects["FunctionDao"]->db = $this->get("DB");
        }
        if ($id === "ProjectDao" && !isset($this->objects["ProjectDao"])) {
            $this->objects["ProjectDao"] = new ProjectDao();
            $this->objects["ProjectDao"]->db = $this->get("DB");
        }
        if ($id === "UserDao" && !isset($this->objects["UserDao"])) {
            $this->objects["UserDao"] = new UserDao();
            $this->objects["UserDao"]->db = $this->get("DB");
        }
        if ($id === "ProjectCtrl" && !isset($this->objects["ProjectCtrl"])) {
            $this->objects["ProjectCtrl"] = new ProjectCtrl();
            $this->objects["ProjectCtrl"]->projectDao = $this->get("ProjectDao");
            $this->objects["ProjectCtrl"]->functionDao = $this->get("FunctionDao");
        }
        if ($id === "ProjectWS" && !isset($this->objects["ProjectWS"])) {
            $this->objects["ProjectWS"] = new ProjectWS();
            $this->objects["ProjectWS"]->projectDao = $this->get("ProjectDao");
            $this->objects["ProjectWS"]->functionDao = $this->get("FunctionDao");
        }
        if ($id === "UserCtrl" && !isset($this->objects["UserCtrl"])) {
            $this->objects["UserCtrl"] = new UserCtrl();
            $this->objects["UserCtrl"]->userDao = $this->get("UserDao");
            $this->objects["UserCtrl"]->projectDao = $this->get("ProjectDao");
            $this->objects["UserCtrl"]->functionDao = $this->get("FunctionDao");
        }
        return $this->objects[$id];
    } // close get method
} // close Context class