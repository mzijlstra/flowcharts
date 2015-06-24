<?php

/**
 * Project Data Access Object
 *
 * @author mzijlstra 11/15/2014
 */
class ProjectDao {

    public $db;

    public function get($pid, $uid, $type = "student") {
        if ($type === "student") {
            $access = $this->db->prepare(
                    "UPDATE `project` SET accessed = NOW() "
                    . "WHERE id = :pid AND user_id = :uid AND active = 1");
            $access->execute(array("pid" => $pid, "uid" => $uid));
        }

        $stmt = $this->db->prepare(
                "SELECT * FROM `project` WHERE id = :pid AND active = 1");
        $stmt->execute(array("pid" => $pid));
        return $stmt->fetch();
    }

    public function recent($uid) {
        $recent = $this->db->prepare(
                "SELECT id, name FROM project "
                . "WHERE user_id = :uid AND active = 1 "
                . "ORDER BY accessed DESC "
                . "LIMIT 1");
        $recent->execute(array("uid" => $uid));
        $proj = $recent->fetch();
        if ($proj) {
            return $proj['id'];
        }
    }

    public function all($uid) {
        $recent = $this->db->prepare(
                "SELECT * FROM project "
                . "WHERE user_id = :uid AND active = 1 "
                . "ORDER BY accessed DESC ");
        $recent->execute(array("uid" => $uid));

        $projects = array();
        foreach ($recent as $row) {
            $projects[] = $row;
        }
        return $projects;
    }

    public function create($name, $uid) {
        $stmt = $this->db->prepare("INSERT INTO `project` VALUES "
                . "(NULL, :name, NOW(), NOW(), 1, :uid)");
        $stmt->execute(array("name" => $name, "uid" => $uid));

        return $this->db->lastInsertId();
    }

    public function rename($pid, $name) {
        $stmt = $this->db->prepare("UPDATE `project` SET name = :name"
                . " WHERE id = :pid");
        $stmt->execute(array("pid" => $pid, "name" => $name));
    }

    public function delete($pid) {
        $stmt = $this->db->prepare("UPDATE `project` SET active = 0"
                . " WHERE id = :pid");
        $stmt->execute(array("pid" => $pid));
    }

}
