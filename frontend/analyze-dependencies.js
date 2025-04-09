const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ui-dependencies.json', 'utf8'));
const modules = data.modules || [];

// Create a directed graph of dependencies
const graph = {};
modules.forEach(module => {
  const source = module.source;
  graph[source] = graph[source] || [];
  (module.dependencies || []).forEach(dep => {
    if (dep.resolved && \!dep.resolved.includes('node_modules')) {
      graph[source].push(dep.resolved);
    }
  });
});

console.log('Analyzing potential circular dependencies in common areas:');

// Motion and UI relationships
const motionFiles = Object.keys(graph).filter(file => file.includes('/motion/'));
const uiFiles = Object.keys(graph).filter(file => file.includes('/ui/'));

console.log('\n=== Motion files that depend on UI files ===');
motionFiles.forEach(file => {
  const deps = graph[file] || [];
  const uiDeps = deps.filter(dep => dep.includes('/ui/'));
  if (uiDeps.length > 0) {
    console.log(file, 'depends on:', uiDeps.join(', '));
  }
});

console.log('\n=== UI files that depend on Motion files ===');
uiFiles.forEach(file => {
  const deps = graph[file] || [];
  const motionDeps = deps.filter(dep => dep.includes('/motion/'));
  if (motionDeps.length > 0) {
    console.log(file, 'depends on:', motionDeps.join(', '));
  }
});
