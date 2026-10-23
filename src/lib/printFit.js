// Largest scale from max down to min (in steps) for which fits(scale) is true; min if none fit.
export function fitScale(fits, { max = 1, min = 0.6, step = 0.05 } = {}) {
  for (let scale = max; scale > min; scale = Math.round((scale - step) * 100) / 100) {
    if (fits(scale)) return scale;
  }
  return min;
}
