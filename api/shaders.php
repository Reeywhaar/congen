<?php
require_once "./gen.php";

$root = "./shaders";
$files = (new Gen(scandir("../" . $root)))->filter(function ($item) {
  return !($item === "." || $item === ".." || $item === ".DS_Store");
})->map(function ($item) use ($root) {
  return $root . "/" . $item;
});

echo json_encode($files);
