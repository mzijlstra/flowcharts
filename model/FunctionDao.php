<?php

/**
 * FunctionDao Data Access Object
 *
 * @author mzijlstra 11/14/2014
 */
class FunctionDao {

    public $db;

    public function all($pid) {
        $stmt = $this->db->prepare(
                "SELECT id, name, instructions, variables FROM `function` "
                . "WHERE project_id = :pid AND active = 1");
        $stmt->execute(array("pid" => $pid));

        $funcs = array();
        foreach ($stmt as $row) {
            $funcs[$row['name']] = $row;
        }
        return $funcs;
    }

    public function createMain($pid) {
        // create a 'main' by duplicating function 0
        $stmt = $this->db->prepare("INSERT INTO `function` 
            (id, `name`, instructions, variables, created, modified, active, project_id)
            SELECT NULL, `name`, instructions, variables, NOW(), NOW(), 1, :pid 
            FROM `function` WHERE id = 0");
        $stmt->execute(array("pid" => $pid));

        return $this->db->lastInsertId();
    }

    public function create($pid, $name, $idata, $vdata) {
        $stmt = $this->db->prepare("INSERT INTO `function` VALUES("
                . "NULL, :name, :idata, :vdata, NOW(), NOW(), 1, :pid)");
        $stmt->execute(array(
            "name" => $name,
            "idata" => $idata,
            "vdata" => $vdata,
            "pid" => $pid));
        return $this->db->lastInsertId();
    }

    public function updVars($fid, $vdata) {
        $stmt = $this->db->prepare("UPDATE `function` SET variables = :vdata "
                . "WHERE id = :fid");
        $stmt->execute(array("fid" => $fid, "vdata" => $vdata));
    }

    public function updIns($fid, $idata) {
        $stmt = $this->db->prepare("UPDATE `function` SET instructions = :idata"
                . " WHERE id = :fid");
        $stmt->execute(array("fid" => $fid, "idata" => $idata));
    }

    public function rename($fid, $name) {
        $stmt = $this->db->prepare("UPDATE `function` SET name = :name"
                . " WHERE id = :fid");
        $stmt->execute(array("fid" => $fid, "name" => $name));
    }

    public function delete($fid) {
        $stmt = $this->db->prepare("UPDATE `function` SET active = 0 "
                . " WHERE id = :fid");
        $stmt->execute(array("fid" => $fid));
    }

    public function isOwner($fid, $uid) {
        $amount = $this->db->prepare("SELECT COUNT(f.id) FROM `function` f "
                . "JOIN `project` p ON f.project_id = p.id "
                . "WHERE f.id = :fid AND p.user_id = :uid");
        $amount->execute(array("fid" => $fid, "uid" => $uid));
        return $amount->fetch(); // returns FALSE if no row was found
    }

}
