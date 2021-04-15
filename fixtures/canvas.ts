// `punch` is provided by the punch-bench harness

declare const punch: import ('..').PunchBench['punch']
declare const configure: import ('..').PunchBench['configure']

const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;

// eslint-disable-next-line no-undef
punch(function canvasToDataURL(done) {
  canvas.toDataURL('text/jpeg', 0.3);
  done();
});

// eslint-disable-next-line no-undef
punch(function canvasToBlob(done) {
  canvas.toBlob(blob => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      reader.result;
      done();
    }, false);
    reader.readAsDataURL(blob);
  }, 'image/jpeg', 0.3);
});

// eslint-disable-next-line no-undef
configure({ count: 100 })