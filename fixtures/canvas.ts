
// Just to ensure TS parsing/output is working
type EnsureTypesAreWorking = {
  nothing: string;
  to: string;
  see: string;
  here: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ensure: EnsureTypesAreWorking | Record<string, unknown> = {};

const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 600;

// @ts-expect-error punch is provided by the harness
// eslint-disable-next-line no-undef
punch(function canvasToDataURL(done) {
  canvas.toDataURL('text/jpeg', 0.3);
  done();
});

// @ts-expect-error punch is provided by the harness
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

// @ts-expect-error configure is provided by the harness
// eslint-disable-next-line no-undef
configure({ count: 1000 })