errors = {};
process.stdin.on("data", (d) => {
  const m = d.toString().match(/([^(]+)\((\d+),(\d+)\): error TS/);
  if (m) {
    const file = m[1];
    errors[file] = (errors[file] || 0) + 1;
  }
});
process.stdin.on("end", () => {
  Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([file, count]) => console.log(`${count}\t${file}`));
});
