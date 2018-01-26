<?php
/* 
    This file is part of the qinoa framework <http://www.github.com/cedricfrancoys/qinoa>
    Some Rights Reserved, Cedric Francoys, 2017, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
/**
* This file is supposed to remain standalone (free of any dependency other than the qn_error.log file)
* For security reasons its access should be restricted to development environment only.
*/
define('LOG_FILE', '../log/qn_error.log');
 
function display_stack($stack) {    
    echo "<table style=\"margin-left: 20px;\">".PHP_EOL;
    for($i = 0, $n = count($stack); $i < $n; ++$i) {
        $entry = $stack[$i];
        list($function, $file) = explode('@', $entry);
        $function = str_replace('#', strval($n-$i).'.', $function);
        echo "<tr>
            <td> $function&nbsp;</td>
            <td><b>@</b>&nbsp;$file</td>
        </tr>".PHP_EOL;
        
    }
    echo '</table>'.PHP_EOL;
}

function display_line($entry) {
    list($thread_id, $timestamp, $errcode, $origin, $file, $line, $msg) = explode(';', $entry);
    if(strpos($timestamp, '.') > 0) {
        $date = str_pad(explode('.', $timestamp)[1], 4, '0');
    }
    else {
        $date = date('H:i:s', $timestamp);
    }

    $type = 'unknown';
    $icon = 'fa-info';
    $class= '';
    switch($errcode) {
        case E_USER_NOTICE:
            $type = 'debug';
            $icon = 'fa-bug';
            $class = 'text-success';
            break;
        case E_USER_WARNING:
            $type = 'warning';
            $icon = 'fa-warning';
            $class = 'text-warning';
            break;
        case E_USER_ERROR:
            $type = 'error';
            $icon = 'fa-times-circle';
            $class = 'text-danger';
            break;
        case E_ERROR:
            $type = 'fatal error';
            $icon = 'fa-ban';
            $class = 'text-danger';
            break;
    }
    echo "<div style=\"margin-left: 10px;\"><a class=\"$class\" title=\"$type\" ><i class=\"fa $icon\" aria-hidden=\"true\"></i> $date</a> [<code class=\"$class\">{$file}:{$line}</code>] <b>in</b> <code class=\"$class\">$origin</code>: ".$msg."</div>".PHP_EOL;
}

if(!file_exists(LOG_FILE)) die('no log found');
$log = file_get_contents(LOG_FILE);

$lines = explode(PHP_EOL, $log);

$len = count($lines);

//get the last line
$k = 1;

if(isset($_GET['thread_id']) && strlen($_GET['thread_id']) > 0) {
    $thread_id = $_GET['thread_id'];
}
else {
    $entry = $lines[$len-$k-1];
    while(substr($entry, 0, 1) == '#') {
        ++$k;
        if(($len-$k) <= 0) die();
        $entry = $lines[$len-$k-1];
    }

    // fetch the thread_id
    list($thread_id, $timestamp, $errcode, $origin, $file, $line, $msg) = explode(';', $entry);
    // syntax:  $this->thread_id.';'.time().';'.$code.';'.$origin.';'.$trace['file'].';'.$trace['line'].';'.$msg.PHP_EOL;
}

// init next and previous threads ids
$previous_thread = false;
$next_thread = $thread_id;

// now skip all lines that dont belongto that thread
for($i = 0; $i < $len-1; ++$i) {
    $entry = $lines[$i];
    if(substr($entry, 0, 1) == '#') continue;    
    // fetch the thread_id
    list($tid, $timestamp, $errcode, $origin, $file, $line, $msg) = explode(';', $entry);    
    if($tid == $thread_id) {
        break;        
    }
    // remebrer previous thread id
    $previous_thread = $tid;
}

// find next thread id
for($j = $i;$j < $len-1; ++$j){
    $entry = $lines[$j];
    if(strlen($entry) == 0) break;
    if(substr($entry, 0, 1) != '#') {
        list($tid, $timestamp, $errcode, $origin, $file, $line, $msg) = explode(';', $entry);    
        if($tid != $thread_id) {
            $next_thread = $tid;
            break;    
        }
    }
    ++$j;
}

// retrieve current thread infos
$info = base64_decode(strtr($thread_id, '-_', '+/'));
list($thread_pid, $thread_time, $thread_script) = explode(';', $info);

?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
    <link rel="stylesheet" type="text/css" href="packages/resipedia/apps/assets/css/bootstrap.min.css" />
    <link rel="stylesheet" type="text/css" href="packages/resipedia/apps/assets/css/font-awesome.min.css" />
</head>
<body>
<?php
echo "<div style=\"margin-left: 10px;\"><a title=\"PID $thread_pid\" href=\"?thread_id=$thread_id\">".date('Y-m-d H:i:s', explode(' ', $thread_time)[1])." ".$thread_script."</a>&nbsp;<a href=\"?thread_id=$previous_thread\"><i class=\"fa fa-caret-up\"></i></a>&nbsp;<a href=\"?thread_id=$next_thread\"><i class=\"fa fa-caret-down\"></i></a></div>".PHP_EOL;

// todo : add fatal errors from error.log (check if last line is newer than qn_error.log's last line) 


// now skip all lines that dont belong to that thread
while(true) {
    $entry = $lines[$i];
    if(strlen($entry) == 0) break;
    if(substr($entry, 0, 1) != '#') {
        list($tid, $timestamp, $errcode, $origin, $file, $line, $msg) = explode(';', $entry);    
        if($tid != $thread_id) break;    
        display_line($entry);
    }
    else {
        $j = 0;
        $stack = [];
        while(substr($entry, 0, 1) == '#') {
            $stack[] = $entry;
            ++$i;
            if($i >= $len-1) break;
            $entry = $lines[$i];
        }
        display_stack($stack);
    }
    ++$i;
    if($i >= $len-1) break;
}
?>
</body>
</html>