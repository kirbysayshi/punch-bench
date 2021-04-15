// Modified from https://github.com/sveinn-steinarsson/flot-downsample to remove
// flot and jquery dependencies, convert to TS.

/*
 * The MIT License

Copyright (c) 2013 by Sveinn Steinarsson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const floor = Math.floor;
const abs = Math.abs;

export function largestTriangleThreeBuckets<
  P extends
    | readonly [number, number]
    | readonly [number, Date]
    | readonly [Date, Date]
    | readonly [Date, number]
>(data: P[], threshold = 1000): P[] {
  const data_length = data.length;
  if (threshold >= data_length || threshold === 0) {
    return data; // Nothing to do
  }

  const sampled = [];
  let sampled_index = 0;

  // Bucket size. Leave room for start and end data points
  const every = (data_length - 2) / (threshold - 2);

  let a = 0, // Initially a is the first point in the triangle
    max_area_point,
    max_area,
    area,
    next_a;

  sampled[sampled_index++] = data[a] as P; // Always add the first point

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (containing c)
    let avg_x = 0,
      avg_y = 0,
      avg_range_start = floor((i + 1) * every) + 1,
      avg_range_end = floor((i + 2) * every) + 1;
    avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

    const avg_range_length = avg_range_end - avg_range_start;

    for (; avg_range_start < avg_range_end; avg_range_start++) {
      avg_x += Number((data[avg_range_start] as P)[0]); // * 1 enforces Number (value may be Date)
      avg_y += Number((data[avg_range_start] as P)[1]);
    }
    avg_x /= avg_range_length;
    avg_y /= avg_range_length;

    // Get the range for this bucket
    let range_offs = floor((i + 0) * every) + 1;
    const range_to = floor((i + 1) * every) + 1;

    // Point a
    const point_a_x = Number((data[a] as P)[0]); // enforce Number (value may be Date)
    const point_a_y = Number((data[a] as P)[1]);

    max_area = area = -1;

    for (; range_offs < range_to; range_offs++) {
      // Calculate triangle area over three buckets
      area =
        abs(
          (point_a_x - avg_x) *
            (Number((data[range_offs] as P)[1]) - point_a_y) -
            (point_a_x - Number((data[range_offs] as P)[0])) *
              (avg_y - point_a_y)
        ) * 0.5;
      if (area > max_area) {
        max_area = area;
        max_area_point = data[range_offs];
        next_a = range_offs; // Next a is this b
      }
    }

    sampled[sampled_index++] = max_area_point as P; // Pick this point from the bucket
    a = next_a as number; // This a is the next a (chosen b)
  }

  sampled[sampled_index++] = data[data_length - 1] as P; // Always add last

  return sampled;
}
