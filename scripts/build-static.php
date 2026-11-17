<?php

$root = dirname(__DIR__);
$outputDirectory = $root . DIRECTORY_SEPARATOR . '_site';
$pages = [
    'index',
    'about',
    'offline',
    'privacy',
    'profile',
    'settings',
    'signup',
    'terms',
];

function removeBuildDirectory(string $directory): void
{
    if (is_link($directory)) {
        throw new RuntimeException('Refusing to remove a symlink at the build output path.');
    }

    if (!is_dir($directory)) {
        return;
    }

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($files as $file) {
        $path = $file->getPathname();
        $removed = $file->isDir() && !$file->isLink() ? rmdir($path) : unlink($path);
        if (!$removed) {
            throw new RuntimeException('Unable to clean generated path: ' . $path);
        }
    }

    if (!rmdir($directory)) {
        throw new RuntimeException('Unable to clean the existing static build output.');
    }
}

function copyAssets(string $source, string $destination): void
{
    if (!is_dir($source)) {
        throw new RuntimeException('Asset source directory is missing: ' . $source);
    }
    if (!is_dir($destination) && !mkdir($destination, 0777, true) && !is_dir($destination)) {
        throw new RuntimeException('Unable to create asset output directory: ' . $destination);
    }

    foreach (new FilesystemIterator($source, FilesystemIterator::SKIP_DOTS) as $entry) {
        $name = $entry->getFilename();
        if ($entry->isLink() || in_array($name, ['firebase-config.local.js', 'firebase-config.runtime.js'], true)) {
            continue;
        }

        $target = $destination . DIRECTORY_SEPARATOR . $name;
        if ($entry->isDir()) {
            if (!mkdir($target, 0777, true) && !is_dir($target)) {
                throw new RuntimeException('Unable to create asset directory: ' . $target);
            }
            copyAssets($entry->getPathname(), $target);
        } elseif (!copy($entry->getPathname(), $target)) {
            throw new RuntimeException('Unable to copy asset: ' . $entry->getPathname());
        }
    }
}

removeBuildDirectory($outputDirectory);
if (!mkdir($outputDirectory, 0777, true) && !is_dir($outputDirectory)) {
    throw new RuntimeException('Unable to create static build output directory.');
}

foreach ($pages as $page) {
    $source = $root . DIRECTORY_SEPARATOR . $page . '.php';
    if (!is_file($source)) {
        throw new RuntimeException('Required PHP page is missing: ' . $source);
    }

    ob_start();
    try {
        require $source;
        $html = ob_get_clean();
    } catch (Throwable $error) {
        ob_end_clean();
        throw $error;
    }

    $pagePattern = '/\b(' . implode('|', array_map('preg_quote', $pages)) . ')\.php\b/';
    if (!is_string($html)) {
        throw new RuntimeException('Unable to render PHP page: ' . $source);
    }
    $html = preg_replace($pagePattern, '$1.html', $html);
    if ($html === null) {
        throw new RuntimeException('Unable to rewrite page links in: ' . $source);
    }
    if (preg_match($pagePattern, $html) !== 0) {
        throw new RuntimeException('A PHP page link remains after static rendering: ' . $source);
    }

    $destination = $outputDirectory . DIRECTORY_SEPARATOR . $page . '.html';
    if (file_put_contents($destination, $html) === false) {
        throw new RuntimeException('Unable to write generated page: ' . $destination);
    }
}

if (!copy($root . DIRECTORY_SEPARATOR . 'logo.png', $outputDirectory . DIRECTORY_SEPARATOR . 'logo.png')) {
    throw new RuntimeException('Unable to copy the site logo.');
}

copyAssets($root . DIRECTORY_SEPARATOR . 'assets', $outputDirectory . DIRECTORY_SEPARATOR . 'assets');

$serviceWorker = file_get_contents($root . DIRECTORY_SEPARATOR . 'sw.js');
if ($serviceWorker === false || file_put_contents($outputDirectory . DIRECTORY_SEPARATOR . 'sw.js', $serviceWorker) === false) {
    throw new RuntimeException('Unable to copy the service worker.');
}

if (file_put_contents($outputDirectory . DIRECTORY_SEPARATOR . '.nojekyll', '') === false) {
    throw new RuntimeException('Unable to disable Jekyll processing for the static artifact.');
}

echo 'Static PHP build created in ' . $outputDirectory . PHP_EOL;
