<?php

/**
 * Project Data Access Object
 *
 * @author mzijlstra 11/15/2014
 * @Repository
 */
class ProjectDao {

    /**
     *
     * @var PDO PDO database connection object  
     * @Inject("DB")
     */
    public $db;

    /**
     * Get a project by id, recording access by the given user id
     * @param int $pid project id
     * @param int $uid user id
     * @param bool $record should access be recorded
     * @return array project data
     */
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

    /**
     * Get the most recently accesssed project for a given user
     * @param int $uid user id
     * @return array containing project id and name
     */
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

    /**
     * Get the top 6 most recently accessed projects for s user, omitting 
     * the project whose project_id is given (usually the id of most recent)
     * @param int $uid user id
     * @param int $pid projec id of project to be omitted
     * @return array of arrays of project data
     */
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

    /**
     * Gets all active projects for the given user id, optionally ordered by
     * $order in $direction (ASC or DESC)
     * @param int $uid user id
     * @param string $order column name
     * @param string $direction (ASC|DESC)
     * @return array of arrays of project data
     */
    public function all($uid, $order="id", $direction="DESC") {
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

    /**
     * Creates a new project with the given name for the given user
     * @param string $name name
     * @param string $uid user id
     * @return int id of created project
     */
    public function create($name, $uid) {
        $stmt = $this->db->prepare("INSERT INTO `project` VALUES "
                . "(NULL, :name, NOW(), NOW(), 1, :uid, NULL)");
        $stmt->execute(array("name" => $name, "uid" => $uid));

        return $this->db->lastInsertId();
    }

    /**
     * Rename a project based on the given project id and user id
     * @param int $pid project id
     * @param int $uid user id
     * @param string $name new name
     */
    public function rename($pid, $uid, $name) {
        $stmt = $this->db->prepare("UPDATE `project` SET name = :name"
                . " WHERE id = :pid AND user_id = :uid");
        $stmt->execute(array("pid" => $pid, "name" => $name, "uid" => $uid));
    }

    /**
     * Delete a given project based on the given project id and user id
     * @param int $pid project id
     * @param int $uid user id
     */
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

    /**
     * Check if the given project is owned by the given user
     * @param int $pid project id
     * @param int $uid user id
     * @return bool
     */
    public function isOwner($pid, $uid) {
        $amount = $this->db->prepare("SELECT COUNT(id) FROM `project` "
                . "WHERE id = :pid AND user_id = :uid AND active = 1");
        $amount->execute(array("pid" => $pid, "uid" => $uid));
        return $amount->fetch(); // returns FALSE if no row was found
    }

    /**
     * Update JavaScript for this project
     * 
     * Initially a project starts without JS, but when switching to JS mode
     * this gets populated and updated (and Flowcharts no longer are)
     * 
     * @param int $pid project id
     * @param String $js
     * @return undefined
     */
    public function updJS($pid, $js) {
        $stmt = $this->db->prepare("UPDATE `project` SET `js` = :js"
                . " WHERE id = :pid");
        $stmt->execute(array("pid" => $pid, "js" => $js));
    }

}
