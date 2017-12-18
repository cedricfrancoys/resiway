#!/usr/bin/env php
<?php
use easyobject\orm\ObjectManager;
use qinoa\php\PhpContext;

// run this script as if it were located in the public folder
chdir('../public');
set_time_limit(0);

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');
require_once('../resi.api.php');
include_once('packages/resiway/config.inc.php');
config\export_config();

list($result, $error_message_ids) = [true, []];

// force silent mode (debug output would corrupt json data)
set_silent(true);

function get_include_contents($filename) {
    ob_start();	
    include($filename); // assuming  parameters required by the script being called are present in the current URL 
    return ob_get_clean();
}


list($result, $error_message_ids) = [true, []];

define('BOTS_COUNT', 300);
define('BOTS_INDEX_START', 25);

try {
    $om = &ObjectManager::getInstance();   
        
    // weighted actions
    $objects_classes = [
                        'resilib\Document'      => ['resilib_document_voteup' => 5, 'resilib_document_view' => 10, 'resilib_document_download' => 3, 'resilib_document_star' => 1],
                        'resiexchange\Question' => ['resiexchange_question_voteup' => 5, 'resiexchange_question_view' => 10, 'resiexchange_question_star' => 1]
                       ];

    $bots_ids = [];
    for($i = 0; $i < BOTS_COUNT; ++$i) {
        $bots_ids[] = BOTS_INDEX_START+$i;
    }
    
    function getRandomWeightedElement(array $weightedValues) {
        $rand = mt_rand(1, (int) array_sum($weightedValues));

        foreach ($weightedValues as $key => $value) {
          $rand -= $value;
          if ($rand <= 0) {
            return $key;
          }
        }
    }
    

    
// on ne veut pas marquer trop rapidement un objet créé par un utilisateur réel
// on veut générer un peu d'activité en permanence
// nombre d'actions estimées : > 500.000
// --> script toutes les 3 minutes + rand pour rendre le timing aléatoire
    foreach($objects_classes as $object_class => $actions_names) {    

        // pick up object for which last action is the oldest
        // pick up a ressource some people have already marked as trusted
        
        $objects_ids = $om->search($object_class, [ ['score', '>', '2'] ], 'modified', 'asc', 0, 5);
        
        // note : il n'y a pas de risque de toujours sélectionner les mêmes objets car les actions modifient le champ "modified"
        // et aucune action n'est bloquante (pas de limitation)                    
                    
        
        if($objects_ids < 0 || !count($objects_ids)) throw new Exception("no_match", QN_ERROR_UNKNOWN);

        // pick up a random action
        $action_name = getRandomWeightedElement($actions_names);
        
        $action_id = ResiAPI::actionId($action_name);
        
        foreach($objects_ids as $object_id) {
            // find out which bots haven't performed yet that action on current object
            $logs_ids = $om->search('resiway\ActionLog', [
                            ['action_id',   '=', $action_id], 
                            ['object_class','=', $object_class], 
                            ['object_id',   '=', $object_id]
                        ]);
            $res = $om->read('resiway\ActionLog', $logs_ids, ['user_id']);
            $missing_bots_ids = array_diff($bots_ids, array_map(function ($a) { return $a['user_id']; }, $res));
            if(count($missing_bots_ids) > 0) {
                // pick up a random user among available bots
                $bot_id = $missing_bots_ids[array_rand($missing_bots_ids)];
                
                // log in as selected user
                $phpContext = &PhpContext::getInstance();
                $phpContext->set('user_id', $user_id);
                // echo "log as {$bot_id}\n";
                
                // perform action
                list($package, $class, $action) = explode('_', $action_name);
                $_REQUEST['document_id'] = $object_id;
                $_REQUEST['question_id'] = $object_id;

                // echo "perform {$action} on {$class} {$object_id}\n";                
                $json = get_include_contents("packages/{$package}/actions/{$class}/{$action}.php");
                $res = json_decode($json, true);
                $result = $res['result'];

                // process next class
                break 1;
            }
        }

    }
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
echo json_encode([
                    'result'            => $result, 
                    'error_message_ids' => $error_message_ids
                 ], JSON_PRETTY_PRINT);