<?php

/**
 * FunctionDao Data Access Object
 *
 * @author mzijlstra 11/14/2014
 * @Repository
 */
class FunctionDao {

    /**
     *
     * @var PDO PDO database connection object 
     * @Inject("DB")
     */
    public $db;

    /**
     * Retrieve all functions related to a given project
     * @param int $pid project id
     * @return array all functions related to the given project id
     */
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

    /**
     * Create a main (first) function for a given project
     * @param int $pid project id
     * @return int function id of the created main function
     */
    public function createMain($pid) {
        // create a 'main' by duplicating function 0
        $stmt = $this->db->prepare("INSERT INTO `function` 
            (id, `name`, instructions, variables, created, modified, active, project_id)
            SELECT NULL, `name`, instructions, variables, NOW(), NOW(), 1, :pid 
            FROM `function` WHERE id = 0");
        $stmt->execute(array("pid" => $pid));

        return $this->db->lastInsertId();
    }

    /**
     * Create a function for a given project
     * @param int $pid project id
     * @param string $name function name
     * @param string $idata function instruction data (HTML string)
     * @param string $vdata function variable data (HTML string)
     * @return function id of the created function
     */
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

    /**
     * Update the variable data for a given function
     * @param int $fid function id
     * @param string $vdata new variable data (HTML string)
     */
    public function updVars($fid, $vdata) {
        $stmt = $this->db->prepare("UPDATE `function` SET variables = :vdata "
                . "WHERE id = :fid");
        $stmt->execute(array("fid" => $fid, "vdata" => $vdata));
    }

    /**
     * Update the instruction data for a given function
     * @param int $fid function id
     * @param string $idata new instruction data (HTML string)
     */
    public function updIns($fid, $idata) {
        $stmt = $this->db->prepare("UPDATE `function` SET instructions = :idata"
                . " WHERE id = :fid");
        $stmt->execute(array("fid" => $fid, "idata" => $idata));
    }

    /**
     * Rename the given function 
     * @param int $fid function id
     * @param string $name new name for the function
     */
    public function rename($fid, $name) {
        $stmt = $this->db->prepare("UPDATE `function` SET name = :name"
                . " WHERE id = :fid");
        $stmt->execute(array("fid" => $fid, "name" => $name));
    }

    /**
     * Delete the given function 
     * @param int $fid id of the function to be deleted
     */
    public function delete($fid) {
        $stmt = $this->db->prepare("UPDATE `function` SET active = 0 "
                . " WHERE id = :fid");
        $stmt->execute(array("fid" => $fid));
    }

    /**
     * Check if the given function is owned by the given user
     * @param type $fid function id
     * @param type $uid user id
     * @return bool true if user owns the function, false if not
     */
    public function isOwner($fid, $uid) {
        $amount = $this->db->prepare("SELECT COUNT(f.id) FROM `function` f "
                . "JOIN `project` p ON f.project_id = p.id "
                . "WHERE f.id = :fid AND p.user_id = :uid");
        $amount->execute(array("fid" => $fid, "uid" => $uid));
        return $amount->fetch(); // returns FALSE if no row was found
    }

}
