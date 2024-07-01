Package.describe({
  name: 'orderlion:cdn',
  version: '1.4.0',
  summary: 'Serve Meteor content from a CDN',
  git: 'https://github.com/orderlion/meteor-cdn',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom(['2.8.2', '3.0-rc.4']);
  api.export('CDN','server');
  api.export('CDN','client');
  api.use('ecmascript');
  api.use('webapp','server');
  api.use('browser-policy', { weak: true });
  api.mainModule('lib/client.js','client');
  api.mainModule('lib/server.js','server');
});

// Package.onTest(function(api) {
//   api.use('tinytest');
//   api.use('nitrolabs:cdn');
//   api.addFiles('tests/client.js','client');
//   api.addFiles('tests/server.js','server');

//   api.addFiles('tests/fixtures/icomoon.eot', 'client', {isAsset: true});
//   api.addFiles('tests/fixtures/icomoon.svg', 'client', {isAsset: true});
//   api.addFiles('tests/fixtures/icomoon.ttf', 'client', {isAsset: true});
//   api.addFiles('tests/fixtures/icomoon.woff', 'client', {isAsset: true});
//   api.addFiles('tests/fixtures/icomoon.otf', 'client', {isAsset: true});
// });
