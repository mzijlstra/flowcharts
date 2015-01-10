<?php
/**
 * Project Data Access Object
 *
 * @author mzijlstra 11/15/2014
 */
class ProjectDao {

    public $db;

    public function all($uid) {
        $recent = $this->db->prepare(
                "SELECT id, name FROM project "
                . "WHERE user_id = :uid "
//                . "AND accessed > DATE_SUB(NOW(), INTERVAL 14 DAY) "
                . "ORDER BY accessed DESC ");
        $recent->execute(array("uid" => $uid));

        $projects = array();
        foreach ($recent as $row) {
            $projects[$row['id']] = $row['name'];
        }
        return $projects;
    }
    
    public function create($name, $uid) {
        $stmt = $this->db->prepare("INSERT INTO `project` VALUES "
                . "(NULL, :name, NOW(), NOW(), 1, :uid)");
        $stmt->execute(array("name" => $name, "uid" => $uid));
        
        return $this->db->lastInsertId();
    }

}
