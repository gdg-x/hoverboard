const measureDuration = (mark: string, optReference?: string) => {
  const reference = optReference || 'responseEnd';
  const name = `${reference}:${mark}`;

  // Clears any existing measurements with the same name.
  window.performance.clearMeasures(name);

  // Creates a new measurement from the reference point to the specified mark.
  // If more than one mark with this name exists, the most recent one is used.
  window.performance.measure(name, reference, mark);

  // Gets the value of the measurement just created.
  const measure = window.performance.getEntriesByName(name)[0];

  // Returns the measure duration.
  return measure.duration;
};

window.onload = () => {
  const indexRenderTime = measureDuration('index.html');
  if (indexRenderTime) {
    // eslint-disable-next-line no-undef
    ga('send', 'timing', 'index.html', 'render', indexRenderTime);
  }
};
