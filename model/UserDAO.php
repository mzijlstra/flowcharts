<?php

/**
 * User DAO Class
 *
 * @author mzijlstra 11/14/2014
 */
class UserDAO {

    public $db;

    public function checkLogin($email) {
        $find = $this->db->prepare(
                "SELECT id, firstname, lastname, password, type "
                . "FROM user "
                . "WHERE email = :email "
                . "AND active = TRUE ");
        $find->execute(array("email" => $email));
        return $find->fetch();
    }

    public function updateAccessed($id) {
        $upd = $this->db->prepare(
                "UPDATE user SET accessed = NOW() "
                . "WHERE id = :uid");
        $upd->execute(array("uid" => $id));
    }
    
    public function retrieve($id) {
        $stmt = $this->db->prepare("SELECT * FROM user WHERE id = :id");
        $stmt->execute(array(":id" => $id));
        return $stmt->fetch();
    }

    public function insert($first, $last, $sid, $email, $hash, $type, $active) {
        $stmt = $this->db->prepare("INSERT INTO user values "
                . "(NULL, :first, :last, :email, :pass, :type,"
                . " NOW(), NOW(), :active)");
        $stmt->execute(array(
            "first" => $first, "last" => $last, "email" => $email, 
            "pass" => $hash, "type" => $type, "active" => $active,
        ));
        return $this->db->lastInsertId();
    }

    public function update($first, $last, $sid, $email, $type, $active, $uid, 
            $pass) {
        $stmt = $this->db->prepare("UPDATE user SET "
                . "firstname = :first, lastname = :last, "
                . "email = :email, type = :type, "
                . "active = :active WHERE id = :uid");
        $stmt->execute(array(
            "first" => $first, "last" => $last, "email" => $email, 
            "type" => $type, "active" => $active, "uid" => $uid
        ));

        if ($pass) {
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $reset = $this->db->prepare("UPDATE user SET password = :pass WHERE id = :uid");
            $reset->execute(array("pass" => $hash, "uid" => $uid));
        }
    }

}
