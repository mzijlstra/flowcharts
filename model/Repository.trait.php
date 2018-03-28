<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Repository Trait 
 * 
 * @author mzijlstra 2018-02-27
 */
trait Repository {

    private function columns($entity, $glue = ",") {
        $columns = array();
        foreach (array_keys($entity) as $k) {
            $columns[] = "$k = :$k ";
        }
        return join($glue, $columns);
    }

    private function save_or_update($e) {
        // if an id attribute exists it's been created already
        // and therefore we can savely assume it's an update
        if ($e->id) {
            $cols = $this->columns($e);
            $upd = $this->db->prepare(
                    "UPDATE {$this->table} SET $cols WHERE id = :id");
            $upd->execute($e);
        } else {
            $e->id = "NULL";
            $cols = $this->columns($e);
            $ins = $this->db->prepare("INSERT INTO {$this->table} SET $cols");
            $ins->execute($e);
            $e->id = $this->db->lastInsertId();
        }
    }

    public function save($entity) {
        // check if it has no string keys (an associative array)
        // and that the numbered indexes are sequential (normal array)
        if (count(array_filter(array_keys($entity), 'is_string')) > 0 &&
                array_keys($entity) !== range(0, count($entity) - 1)) {
            $this->save_or_update($entity);
        } else { // we savely assume its a list of entities
            foreach ($entity as $e) {
                $this->save_or_update($e);
            }
        }
        return $entity;
    }

    // retrieve
    public function find($conditions, $order="id", $size=25, $offset=0) {
        $query = "SELECT * FROM {$this->table} ";
        if ($conditions) {
            $cols = $this->columns($conditions, " AND ");
            $query .= "WHERE $cols ORDER BY :_order LIMIT :_offset :_size ";
        }
        $find = $this->db->prepare($query);
        $conditions['_order'] = $order;
        $conditions['_size'] = $size;
        $conditions['_offset'] = $offset;
        $find->execute($conditions);
        return $find->fetch();
    }

    public function findById($id) {
        if (is_array($id)) {
            $find = $this->db->prepare(
                    "SELECT * FROM {$this->table} WHERE id IN (:ids)");
            $find->execute(array("ids" => join(",", $id)));
            return $find->fetch();
        } else {
            return $this->find(array("id" => $id));
        }
    }
    
    public function count($conditions) {
        $query = "COUNT (*) from {$this->table} ";
        if ($conditions) {
            $cols = $this->columns($conditions, " AND ");
            $query .= "WHERE $cols ";            
        }
        $find = $this->db->prepare($query);
        $find->execute($conditions);
        return $find->fetch();
    }

    // delete
    public function delete($entity) {
        $this->deleteById($entity->id);
    }

    public function deleteById($id) {
        if (is_array($id)) {
            $ids = join(",", $id);
        } else {
            $ids = "$id";
        }
        $del = $this->db->prepare(
                "DELETE FROM {$this->table} WHERE id IN (:ids)");
        $del->execute(array("ids" => $ids));
    }
}
