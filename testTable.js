const content = `| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| Cell 1 | Cell 2 | Cell 3 |`;
const lines = content.split('\n');
lines.forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.length > 1) {
    if (/^\|[- :|]+\|$/.test(trimmedLine)) {
      console.log('SKIP');
    } else {
      console.log('TABLE ROW');
    }
  } else {
    console.log('NO MATCH');
  }
});
