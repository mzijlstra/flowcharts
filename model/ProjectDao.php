<?php

/**
 * Project Data Access Object
 *
 * @author mzijlstra 11/15/2014
 */
class ProjectDao {

    public $db;

    public function get($pid, $uid, $record = true) {
        if ($record) {
            $access = $this->db->prepare(
                    "UPDATE `project` SET accessed = NOW() "
                    . "WHERE id = :pid AND user_id = :uid AND active = 1");
            $access->execute(array("pid" => $pid, "uid" => $uid));
        }

        $stmt = $this->db->prepare(
                "SELECT * FROM `project` "
                . " WHERE id = :pid AND user_id = :uid"
                . " AND active = 1");
        $stmt->execute(array("pid" => $pid, "uid" => $uid));
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

    public function otherRecent($uid, $pid) {
        $recent = $this->db->prepare(
                "SELECT id, name FROM project "
                . "WHERE user_id = :uid AND id != :pid AND active = 1 "
                . "ORDER BY accessed DESC "
                . "LIMIT 6");
        $recent->execute(array("uid" => $uid, "pid" => $pid));
        $projects = array();
        foreach ($recent as $row) {
            $projects[] = $row;
        }
        return $projects;
    }

    public function all($uid, $order, $direction) {
        $recent = $this->db->prepare(
                "SELECT * FROM project "
                . "WHERE user_id = :uid AND active = 1 "
                . "ORDER BY $order $direction ");
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

    public function rename($pid, $uid, $name) {
        $stmt = $this->db->prepare("UPDATE `project` SET name = :name"
                . " WHERE id = :pid AND user_id = :uid");
        $stmt->execute(array("pid" => $pid, "name" => $name, "uid" => $uid));
    }

    public function delete($pid, $uid) {
        // make sure that the user has at least one project
        $amount = $this->db->prepare("SELECT COUNT(id) FROM `project` "
                . "WHERE user_id = :uid AND active = 1");
        $amount->execute(array("uid" => $uid));
        $row = $amount->fetch();

        if ($row[0] > 1) {
            $stmt = $this->db->prepare("UPDATE `project` SET active = 0"
                    . " WHERE id = :pid AND user_id = :uid");
        }
        $stmt->execute(array("pid" => $pid, "uid" => $uid));
    }

    public function isOwner($pid, $uid) {
        $amount = $this->db->prepare("SELECT COUNT(id) FROM `project` "
                . "WHERE id = :pid AND user_id = :uid AND active = 1");
        $amount->execute(array("pid" => $pid, "uid" => $uid));
        return $amount->fetch(); // returns FALSE if no row was found
    }

}
