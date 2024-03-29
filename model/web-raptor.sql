-- MySQL dump 10.13  Distrib 5.6.14, for osx10.6 (x86_64)
--
-- Host: localhost    Database: web_raptor
-- ------------------------------------------------------
-- Server version	5.6.14

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `function`
--

DROP TABLE IF EXISTS `function`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `function` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `instructions` longtext NOT NULL,
  `variables` text NOT NULL,
  `created` timestamp NULL,
  `modified` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `project_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES project(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `function`
--

LOCK TABLES `function` WRITE;
/*!40000 ALTER TABLE `function` DISABLE KEYS */;
INSERT INTO function VALUES(0, 'main', 
'<div class="statement">
    <div class="start">
        <div class="text">
            <span class="type">number</span>
            <span class="name">main</span>(<span class="params"></span>)
        </div>
    </div>
</div>
<div class="connection">
    <div class="line"></div>
    <div class="point"></div>
    <div class="sline"></div>
    <div class="line"></div>
    <div class="arrow_down"></div>                        
</div>
<div class="statement return">
    <div class="stop">
        <div class="text">
            return <span class="exp">0</span>
        </div>
    </div>
</div>', 
'<div class="label">Variables:</div>
<div class="variable bottom">
    <div class="del">&times;</div>
    <div class="type_container">
        <div class="menu">
            <div class="menu_item">string</div>
            <div class="menu_item">number</div>
            <div class="menu_item">boolean</div>
            <div class="menu_item">array</div>
            <div class="menu_item">object</div>
        </div>
        <span class="type">string</span>
    </div>
    <input class="var" pattern="[_a-zA-Z]([_0-9a-zA-Z]+)?"/>
</div>', 
NOW(), NOW(), 0, 0); -- placeholder main 

/*!40000 ALTER TABLE `function` ENABLE KEYS */;
UNLOCK TABLES;

INSERT INTO `function` 
    (id, `name`, instructions, variables, created, modified, active, project_id)  
    SELECT NULL, `name`, instructions, variables, NOW(), NOW(), 1, 1 
    FROM `function` WHERE id = 0; -- duplicate that data for first project

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created` timestamp NULL, 
  `accessed` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(1) DEFAULT '1',
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES user(`id`),
  KEY `accessed` (`accessed`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
INSERT INTO project VALUES(NULL, 'First Project', NOW(), NOW(), 1, 1);
/*!40000 ALTER TABLE `project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(45) NOT NULL,
  `lastname` varchar(45) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `type` varchar(45) NOT NULL,
  `created` timestamp NULL,
  `accessed` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `password` (`password`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO user VALUES(null, 'Michael', 'Zijlstra', 'mzijlstra@mum.edu', 
'$2y$10$nzHsPgp0BUZ8HH7RQZGlZeAZ1B37SR5YT3xjakaQnPWH39GCvlYfu', 'admin', NOW(), NOW(), 1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2014-08-31 17:03:19

ALTER TABLE project ADD COLUMN `js` LONGTEXT DEFAULT NULL;