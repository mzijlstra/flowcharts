<?php

/*
 * Michael Zijlstra 03 May 2017
 */

class AnnotationContext {

    public $sec = array();
    public $view_ctrl = array();
    public $get_ctrl = array();
    public $post_ctrl = array();
    public $repositories = array();
    public $controllers = array();
    public $context = "";

    public function AnnotationContext() {
        global $SEC_LVLS;
        foreach ($SEC_LVLS as $lvl) {
            $this->sec[$lvl] = array();
        }
    }

    private function annotation_attributes($annotation, $text) {
        $matches = array();
        preg_match("#" . $annotation . "\((.*)\)#", $text, $matches);
        $content = $matches[1];
        if (preg_match("#^['\"].*['\"]$#", $content)) {
            $content = "value=" . $content;
        }
        $result = array();
        if (!$attrs = preg_split("#,\s*#", $content)) {
            $attrs = array($content);
        }
        foreach ($attrs as $attr) {
            if (!preg_match("#(\w+)\s*=\s*['\"](.*?)['\"]#", $attr, $matches)) {
                throw new Exception("Malformed annotation attribute in "
                . $annotation . " found in " . $text);
            }
            $key = $matches[1];
            $value = $matches[2];
            $result[$key] = $value;
        }
        return $result;
    }

    private function to_inject($reflect_class) {
        $result = array();
        foreach ($reflect_class->getProperties() as $prop) {
            $com = $prop->getDocComment();
            if (preg_match("#@Inject#", $com)) {
                $attrs = $this->annotation_attributes("@Inject", $com);
                $result[$prop->getName()] = $attrs["value"];
            }
        }
        return $result;
    }

    private function validate_viewcontrol_annotation(&$attrs, $doc_com) {
        if (!isset($attrs['uri']) && !isset($attrs['value'])) {
            throw new Exception("@ViewControl missing uri "
            . "attribute in: " . $doc_com);
        }
        if (!isset($attrs['uri']) && isset($attrs['value'])) {
            $attrs['uri'] = $attrs['value'];
        }
        if (!isset($attrs['sec'])) {
            $attrs['sec'] = "none";
        }
        if (!isset($this->sec[$attrs["sec"]])) {
            throw new Exception("Bad sec value in "
            . "@ViewControl found in: " . $doc_com);
        }
    }

    private function validate_request_annotation(&$attrs, $com) {
        if (!isset($attrs['method'])) {
            $attrs['method'] = "GET";
        }
        if ($attrs['method'] !== "GET" && $attrs["method"] !== "POST") {
            throw new Exception("@Request has incorrect value for method "
            . "attribute in: " . $com);
        }
        if (!isset($attrs['uri']) && !isset($attrs['value'])) {
            throw new Exception("@Request missing uri "
            . "attribute in: " . $com);
        }
        if (!isset($attrs['uri']) && isset($attrs['value'])) {
            $attrs['uri'] = $attrs['value'];
        }
        if (!isset($attrs['sec'])) {
            $attrs['sec'] = "none";
        }
        if (!isset($this->sec[$attrs["sec"]])) {
            throw new Exception("Bad sec value in @Request found in: " . $com);
        }
    }

    private function map_requests($reflect_class) {
        foreach ($reflect_class->getMethods() as $m) {
            $com = $m->getDocComment();
            if (!preg_match("#@Request#", $com)) {
                continue;
            }

            // map the uri to a method & add security specifications
            $attrs = $this->annotation_attributes("@Request", $com);
            $this->validate_request_annotation($attrs, $com);

            $method_loc = $reflect_class->getName() . "@" . $m->getName();
            if ($attrs['method'] === "GET") {
                $this->get_ctrl[$attrs["uri"]] = $method_loc;
                $this->sec[$attrs["sec"]][] = "GET@" . $attrs["uri"];
            } else if ($attrs['method'] === "POST") {
                $this->post_ctrl[$attrs["uri"]] = $method_loc;
                $this->sec[$attrs["sec"]][] = "POST@" . $attrs["uri"];
            }
        }
    }

    private function check_repository($class) {
        $r = new ReflectionClass($class);
        $doc = $r->getDocComment();
        if (preg_match("#@Repository#", $doc)) {
            $to_inject = $this->to_inject($r);
            $this->repositories[$class] = $to_inject;
        }
    }

    private function check_viewcontrol($doc_com, $file) {
        $attrs = $this->annotation_attributes("@ViewControl", $doc_com);
        $this->validate_viewcontrol_annotation($attrs, $doc_com);
        // remove 'view/' from file
        $this->view_ctrl[$attrs["uri"]] = substr($file, 5);
        $this->sec[$attrs["sec"]][] = "GET@" . $attrs["uri"];
    }

    private function check_controller($class) {
        $r = new ReflectionClass($class);
        $doc = $r->getDocComment();
        if (preg_match("#@Controller#", $doc)) {
            $to_inject = $this->to_inject($r);
            $this->controllers[$class] = $to_inject;
            $this->map_requests($r);
        }
    }

    /**
     * Helper to scan the view direcotry for @ViewControl annotations at the
     * top of view files
     */
    private function scan_view($directory) {
        $files = scandir($directory);
        foreach ($files as $file) {
            if ($file{0} === ".") {
                continue;
            }
            // go into and process sub-directories
            $file_loc = $directory . DIRECTORY_SEPARATOR . $file;
            if (is_dir($file_loc)) {
                $this->scan_view($file_loc);
                continue;
            }

            $text = file_get_contents($file_loc);
            $tokens = token_get_all($text);

            // Only look at the first 10 tokens, 
            // @ViewControl should be near the top of the file
            for ($i = 0; $i < 10 && $i < count($tokens); $i++) {
                if (is_array($tokens[$i]) && $tokens[$i][0] === T_DOC_COMMENT &&
                        preg_match("#@ViewControl\(.*?\)#", $tokens[$i][1])) {
                    $this->check_viewcontrol($tokens[$i][1], $file_loc);
                }
            }
        }
    }

    private function scan_classes($directory, $function) {
        $files = scandir($directory);
        foreach ($files as $file) {
            $mats = array();
            // skip hidden files, directories, files that are not .class.php
            if ($file{0} === "." || is_dir($file) ||
                    !preg_match("#(.*)\.class\.php#i", $file, $mats)) {
                continue;
            }
            $this->{$function}($mats[1]);
        }
    }

    private function generate_security_array() {
        $this->context .= "\$security = array(\n";
        foreach ($this->sec as $lvl => $items) {
            foreach ($items as $item) {
                $this->context .= "\t'|$item|' => '$lvl',\n";
            }
        }
        $this->context .= ");\n";
    }

    private function generate_routing_arrays() {
        $this->context .= "\$view_ctrl = array(\n";
        foreach ($this->view_ctrl as $uri => $file) {
            $this->context .= "\t'|$uri|' => '$file',\n";
        }
        $this->context .= ");\n";
        $this->context .= "\$get_ctrl = array(\n";
        foreach ($this->get_ctrl as $uri => $method_loc) {
            $this->context .= "\t'|$uri|' => '$method_loc',\n";
        }
        $this->context .= ");\n";
        $this->context .= "\$post_ctrl = array(\n";
        foreach ($this->post_ctrl as $uri => $method_loc) {
            $this->context .= "\t'|$uri|' => '$method_loc',\n";
        }
        $this->context .= ");\n";
    }

    private function add_classes_to_context($classes) {
        foreach ($classes as $class => $injects) {
            $this->context .= <<< IF_START
        if (\$id === "$class" && !isset(\$this->objects["$class"])) {
            \$this->objects["$class"] = new $class();

IF_START;
            foreach ($injects as $prop => $id) {
                $this->context .=
                        "            \$this->objects[\"$class\"]->$prop = "
                        . "\$this->get(\"$id\");\n";
            }
            $this->context .= "        }\n"; // close if statement
        }
    }

    /**
     * Scans the standard directories, reading .php files for annotations
     * @return AnnotationContext self for call chaining
     */
    public function scan() {
        $this->scan_classes("model", "check_repository");
        $this->scan_view("view");
        $this->scan_classes("control", "check_controller");
        return $this;
    }

    /**
     * Creates the context in memory
     * @return AnnotationContext self for call chaining
     */
    public function create_context() {
        $this->generate_security_array();
        $this->generate_routing_arrays();

        // these values are set in frontController.php
        $dsn = DSN;
        $user = DB_USER;
        $pass = DB_PASS;

        $this->context .= <<< HEADER
class Context {
    private \$objects = array();
    
    public function Context() {
        \$db = new PDO("$dsn", "$user", "$pass");
        \$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        \$this->objects["DB"] = \$db;
    }

    public function get(\$id) {

HEADER;

        $this->add_classes_to_context($this->repositories);
        $this->add_classes_to_context($this->controllers);

        $this->context .= <<< FOOTER
        return \$this->objects[\$id];
    } // close get method
} // close Context class
FOOTER;

        return $this;
    }

    /**
     * Writes the context (as found by scan) to a file
     * @param string $filename
     * @return AnnotationContext self for call chaining
     */
    public function write($filename) {
        $data = "<?php\n" . $this->context;
        file_put_contents($filename, $data);
        return $this;
    }

}
