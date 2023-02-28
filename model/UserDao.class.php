<?php

/**
 * User DAO Class
 *
 * @author mzijlstra 11/14/2014
 * @Repository
 */
class UserDao {

    /**
     *
     * @var PDO PDO database connection object   
     * @Inject("DB")
     */
    public $db;

    /**
     * Gets user details based on given email address
     * @param string $email 
     * @return array user data
     */
    public function checkLogin($email) {
        $find = $this->db->prepare(
                "SELECT id, firstname, lastname, password, isAdmin "
                . "FROM manalabs.user "
                . "WHERE email = :email "
                . "AND active = TRUE ");
        $find->execute(array("email" => $email));
        return $find->fetch();
    }

    /**
     * Updates the last login / access time for the given user 
     * @param int $id user id
     */
    public function updateAccessed($id) {
        $upd = $this->db->prepare(
                "UPDATE manalabs.user SET accessed = NOW() "
                . "WHERE id = :uid");
        $upd->execute(array("uid" => $id));
    }
    
    /**
     * Get all user data
     * @return array of arrays of user data
     */
    public function all() {
        $stmt = $this->db->prepare("SELECT * FROM manalabs.user 
            ORDER BY accessed DESC");
        $stmt->execute();
        return $stmt->fetchAll();        
    }    
}
