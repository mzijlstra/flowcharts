<?php
/**
 * Context and Dependency Injection (CDI)
 * Factory class for creating controler and dao objects
 * And wiring up their dependencies
 *
 * @author mzijlstra 11/15/2014
 */

require 'model/UserDAO.php';
require 'model/ProjectDao.php';
require 'model/FunctionDao.php';
require 'control/ProjectCtrl.php';
require 'control/UserCtrl.php';

class Context {
    private $db;
    private $userDao;
    private $projectDao;
    private $functionDao;
    private $projectCtrl;
    private $userCtrl;

    public function getDB() {
        if ($this->db == NULL) {
            $this->db = new PDO("mysql:dbname=web_raptor;host=localhost", 
            "root", "root");
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        }
        return $this->db;
    }

    public function getUserDao() {

        if ($this->userDao == NULL) {
            $this->userDao = new UserDAO();
            $this->userDao->db = $this->getDB();
        }
        return $this->userDao;
    }

    public function getProjectDao() {
        if ($this->projectDao == NULL) {
            $this->projectDao = new ProjectDao();
            $this->projectDao->db = $this->getDB();
        }
        return $this->projectDao;
    }

    public function getFunctionDao() {
        if ($this->functionDao == NULL) {
            $this->functionDao = new FunctionDao();
            $this->functionDao->db = $this->getDB();
        }
        return $this->functionDao;
    }
    
    public function getProjectCtrl() {
        if ($this->projectCtrl == NULL) {
            $this->projectCtrl = new ProjectCtrl();
            $this->projectCtrl->projectDao = $this->getProjectDao();
            $this->projectCtrl->functionDao = $this->getFunctionDao();
        }
        return $this->projectCtrl;
    }
    
    public function getUserCtrl() {
        if ($this->userCtrl == NULL) {
            $this->userCtrl = new UserCtrl();
            $this->userCtrl->userDao = $this->getUserDao();
            $this->userCtrl->projectDao = $this->getProjectDao();
            $this->userCtrl->functionDao = $this->getFunctionDao();
        }
        return $this->userCtrl;
    }
}
