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

}
