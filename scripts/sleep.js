const sleep = (timeout) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, timeout * 1000);
});

const [timeout] = process.argv.slice(2);
sleep(timeout).then(() => {
  process.exit();
});
