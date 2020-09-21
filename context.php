<?php
/******************************************************************************* 
 * DO NOT MODIFY THIS FILE, IT IS GENERATED 
 * 
 * When DEVELOPMENT=true this file is generated based on the settings in 
 * frontController.php and the annotations found in the class files in the 
 * control and model directories
 ******************************************************************************/
$mappings = array(
	"GET" => array(
		'|/sandbox$|' => 
			['sec' => 'user', 'route' => 'ProjectCtrl@getSandbox'],
		'|^/project/(\d+)$|' => 
			['sec' => 'user', 'route' => 'ProjectCtrl@getProject'],
		'|^/user/(\d+)/project/(\d+)$|' => 
			['sec' => 'admin', 'route' => 'ProjectCtrl@getProject'],
		'|^/project/other_recent$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@getOtherRecent'],
		'|^/user/(\d+)/project/other_recent$|' => 
			['sec' => 'admin', 'route' => 'ProjectWS@getOtherRecent'],
		'|^/project$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@getProjects'],
		'|^/user/(\d+)/project$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@getUserProjects'],
		'|^/login$|' => 
			['sec' => 'none', 'route' => 'UserCtrl@getLogin'],
		'|^/$|' => 
			['sec' => 'user', 'route' => 'UserCtrl@loggedIn'],
		'|^/logout$|' => 
			['sec' => 'none', 'route' => 'UserCtrl@logout'],
		'|^/user$|' => 
			['sec' => 'admin', 'route' => 'UserCtrl@all'],
		'|^/user/(\d+)$|' => 
			['sec' => 'admin', 'route' => 'UserCtrl@details'],
	),
	"POST" => array(
		'|/images/(\d+)|' => 
			['sec' => 'user', 'route' => 'ProjectCtrl@uploadImages'],
		'|^/project/(\D[^/]+)$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@create'],
		'|^/project/(\d+)/rename$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@rename'],
		'|^/project/(\d+)/delete$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@delete'],
		'|^/project/(\d+)/add/(\w+)$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@addFunction'],
		'|^/function/(\d+)/vars|' => 
			['sec' => 'user', 'route' => 'ProjectWS@updVars'],
		'|^/function/(\d+)/ins|' => 
			['sec' => 'user', 'route' => 'ProjectWS@updIns'],
		'|^/function/(\d+)/rename$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@renameFunction'],
		'|^/function/(\d+)/delete$|' => 
			['sec' => 'user', 'route' => 'ProjectWS@deleteFunction'],
		'|^/login$|' => 
			['sec' => 'none', 'route' => 'UserCtrl@login'],
		'|^/user$|' => 
			['sec' => 'admin', 'route' => 'UserCtrl@create'],
		'|^/user/(\d+)$|' => 
			['sec' => 'admin', 'route' => 'UserCtrl@update'],
	),
);
class Context {
    private $objects = array();
    
    public function __construct() {
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