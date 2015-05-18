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
                . "WHERE project_id = :pid ");
        $stmt->execute(array("pid" => $pid));

        $funcs = array();
        foreach ($stmt as $row) {
            $funcs[$row['name']] = $row;
        }
        return $funcs;
    }

    public function createMain($pid) {
        $stmt = $this->db->prepare("INSERT INTO `function` VALUES( 
            SELECT NULL, `name`, instructions, variables, NOW(), NOW(), 1, :pid 
            FROM `function` WHERE id = 0)");
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
        $stmt = $this->db->prepare("DELETE FROM `function` WHERE id = :fid");
        $stmt->execute(array("fid" => $fid));
    }
}
