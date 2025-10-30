<?php
header("Content-Type: application/json");

$config = include('/secret/key.php');

$api_key = $config['47a13e14f60cf4155a0deaab5e2b1eb7'];
$user = $config['SvSams'];

$url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=$user&api_key=$api_key&format=json";

$response = @file_get_contents($url);

if ($response === false) {
    echo json_encode(["error" => "Failed to fetch from Last.fm"]);
} else {
    echo $response;
}
?>
