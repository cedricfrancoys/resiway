<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a fully-loaded document object",
    'params' 		=>	array(                                         
                        'id'	        => array(
                                            'description'   => 'Identifier of the document to retrieve.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            ),
                        'title'	        => array(
                                            'description'   => 'URL formatted title',
                                            'type'          => 'string', 
                                            'required'      => false
                                            ),
                        'bot'	        => array(
                                            'description'   => 'View output as a bot',
                                            'type'          => 'boolean', 
                                            'default'       => false
                                            ),
                        'download'	    => array(
                                            'description'   => 'Flag to force pdf document download',
                                            'type'          => 'boolean', 
                                            'default'       => false
                                            ),
                        'view'	        => array(
                                            'description'   => 'Flag to force pdf document display',
                                            'type'          => 'boolean', 
                                            'default'       => false
                                            )
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($document_id) = [
    $params['id']
];
   
function isBot() {
    $res = false;
    /* Google */    
    if(stripos($_SERVER['HTTP_USER_AGENT'], 'Google') !== false) { // HTTP_USER_AGENT should be 'Googlebot'
        $hostname = gethostbyaddr($_SERVER['REMOTE_ADDR']);
        // possible formats (https://support.google.com/webmasters/answer/1061943)
        //  crawl-66-249-66-1.googlebot.com
        //  rate-limited-proxy-66-249-90-77.google.com
        $res = preg_match('/\.googlebot\.com$/i', $hostname);
        if(!$res) {
            $res = preg_match('/\.google\.com$/i', $hostname);        
        }        
    }
    /* Facebook */
    else if(stripos($_SERVER["HTTP_USER_AGENT"], "facebookexternalhit/") !== false 
        || stripos($_SERVER["HTTP_USER_AGENT"], "Facebot") !== false ) {
        $res = true;
    }
    /* Twitter */
    else if(stripos($_SERVER["HTTP_USER_AGENT"], "Twitterbot") !== false) {
        $res = true;    
    }
    return $res;
}

try {
    $params['bot'] = $params['bot'] || isBot();
    
    
    if( !$params['bot'] && !$params['download'] && !$params['view'] ) {
        // redirect to JS application
        header('Location: '.'/resilib.fr#/document/'.$params['id'].'/'.$params['title']);
        exit();
    }    
    else {
        $om = &ObjectManager::getInstance();
            
        // retrieve document
        $res = $om->read('resilib\Document', $document_id, ['id', 'lang', 'creator', 'created', 'editor', 'edited', 'modified', 'author', 'title', 'title_url', 'description', 'content', 'last_update', 'count_views', 'count_votes', 'score', 'categories_ids.title']);
        
        if($res < 0 || !isset($res[$document_id])) throw new Exception("document_unknown", QN_ERROR_INVALID_PARAM);
        $document_data = $res[$document_id];

        
        // force download 
        if( $params['download'] ) {
// todo : increment count-download
            // disable compression whatever default option is
            ini_set('zlib.output_compression','0');

            // tell the browser to download resource
            header("Content-Description: File Transfer");
            header("Content-Disposition: attachment; filename=".$document_data['title_url'].".pdf;");
            header("Content-Transfer-Encoding: binary");

            header("Pragma: public");
            header("Expires: 0");
            header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
            header("Cache-Control: public");
            header("Content-Type: application/pdf");
            header("Content-Length: ".strlen($document_data['content']));

            print($document_data['content']);            
        }
        // force view 
        else if( $params['view'] ) {
// todo : increment count-download            
            header("Content-Disposition: inline; filename=".$document_data['title_url'].".pdf;");    
            header("Content-Type: application/pdf");
            header("Content-Length: ".strlen($document_data['content']));

            print($document_data['content']);            
        }
        // bot
        else {
            $description = substr($document_data['description'], 0, 200);
            $title = $document_data['title'];
            $image = "https://www.resiway.org/index.php?get=resilib_document_thumbnail&id={$document_id}";
            $url = "https://www.resiway.org/document/{$document_id}/{$document_data['title_url']}";
            
            echo '<!DOCTYPE html>'.PHP_EOL;
            echo '<html lang="'.$document_data['lang'].'" prefix="og: http://ogp.me/ns#">'.PHP_EOL;
            echo '<head>'.PHP_EOL;    
            echo '<meta charset="utf-8">'.PHP_EOL;
            echo '<meta name="title" content="'.$document_data['title'].' - ResiLib - Des savoirs pratiques pour la résilience">'.PHP_EOL;
            echo '<meta name="description" content="'.$description.'">'.PHP_EOL;
            echo '<meta property="og:title" content="'.$document_data['title'].'" />'.PHP_EOL;
            echo '<meta property="og:type" content="article" />'.PHP_EOL;
            echo '<meta property="og:url" content="'.$url.'" />'.PHP_EOL;
            echo '<meta property="og:image" content="'.$image.'" />'.PHP_EOL;
            echo '<meta property="og:description" content="'.$description.'" />'.PHP_EOL;
            echo '<meta name="twitter:card" content="summary" />'.PHP_EOL;
            echo '<meta name="twitter:title" content="'.$title.'" />'.PHP_EOL;
            echo '<meta name="twitter:url" content="'.$url.'" />'.PHP_EOL;
            echo '<meta name="twitter:description" content="'.$description.'" />'.PHP_EOL;
            echo '<meta name="twitter:image" content="'.$image.'" />'.PHP_EOL;            
            echo '</head>'.PHP_EOL;
            echo '<body>'.PHP_EOL;        
            echo '<div class="document wrapper"'.PHP_EOL;
            echo '   itemscope=""'.PHP_EOL;
            echo '   itemtype="https://schema.org/DigitalDocument">'.PHP_EOL;
            echo '<h1 itemprop="name">'.$title.'</h1>'.PHP_EOL;
            echo '<div itemprop="description">'.$description.'</div>'.PHP_EOL;        
            echo '<div itemprop="dateCreated">'.$document_data['last_update'].'</div>'.PHP_EOL;
            echo '<div itemprop="author">'.$document_data['author'].'</div>'.PHP_EOL;        
            echo '<div itemprop="url">'.$url.'</div>'.PHP_EOL;                                
            echo '</div>'.PHP_EOL;        
            echo '</body>'.PHP_EOL;        
            echo '</html>'.PHP_EOL;            
        }
        // prevent any further output
        exit();
    }
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
                    'result'            => $result, 
                    'error_message_ids' => $error_message_ids
                 ], 
                 JSON_PRETTY_PRINT);