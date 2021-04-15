Example Analysis
================

Benchmarking is hard, especially across different browsers. Here is one way to run and interpret the results from [`fixtures/canvas.ts`](/fixtures/canvas.ts).

_NOTE: This benchmark is here to illustrate how difficult benchmarking on the web can be, and how to interpret the results. These were the results on my machine, and specific browser versions. Always measure again! And don't fault your (least) favorite browser for being too fast or slow, it's trying its best. As web developers, we need to adapt to with what the browsers give us, and provide the best end-user experience we can. The more you measure, the more you can adapt!_

Setup
-----

First, generate the benchmark:

```sh
npx punch-bench ./fixtures/canvas.ts | pbcopy
```

Then paste the code into Firefox's Web Developer Tools console, and press enter. Wait until you see results.

Then paste the code into Chrome's DevTools console, and press enter. Wait until you see results.

On a very old laptop, you might get results like those found in [example-output-firefox](/docs/example-output-firefox.txt) and [example-output-chrome](/docs/example-output-chrome.txt).

What's going on here?

Analysis (tables)
--------

First, we have two functions to compare: getting a dataURL out of a canvas using either `toDataURL` or `toBlob`.

Ignoring the graphs for a moment, we have several tables. I'll put the Firefox ones below:

```
toDataUrl                                   toBlob
╔═════════════════╤═══════════════╗         ╔═════════════════╤═══════════════╗
║ min             │ 21.00000000   ║         ║ min             │ 12.00000000   ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ max             │ 42.00000000   ║         ║ max             │ 23.00000000   ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ mean            │ 27.67000000   ║         ║ mean            │ 14.36000000   ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ median          │ 27.00000000   ║         ║ median          │ 14.00000000   ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ percentile99    │ 38.00000000   ║         ║ percentile99    │ 20.00000000   ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ percentile95    │ 34.00000000   ║         ║ percentile95    │ 18.00000000   ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ sum             │ 2767.00000000 ║         ║ sum             │ 1436.00000000 ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ pctFramesOnTime │ 0.00600601    ║         ║ pctFramesOnTime │ 1.01359134    ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ pctTicksOnTime  │ 0.00144144    ║         ║ pctTicksOnTime  │ 0.33172080    ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ total ticks     │ 1             ║         ║ total ticks     │ 120           ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ total frames    │ 1             ║         ║ total frames    │ 88            ║
╟─────────────────┼───────────────╢         ╟─────────────────┼───────────────╢
║ total duration  │ 2775          ║         ║ total duration  │ 1447          ║
╚═════════════════╧═══════════════╝         ╚═════════════════╧═══════════════╝
```

We can see that `toDataURL` took more time overall. But perhaps more interestingly... it only took 1 tick and 1 frame! Does that mean it was faster? NO! In fact, `toDataURL`, since it is a blocking API, prevented the browser from doing anything else like as rendering or executing other tasks. `toBlob`, on the other hand, is an asynchronous API. It allowed the browser to do more during the benchmark, and therefore we see that `120` event loop ticks ticked and `88` frames were painted during the test.

Some other notes:

We can see that the worst case time for Firefox was `~23ms` (`max`), while the best was `~12ms` (`min`). But what kind of performance should be expect if this function were called repeatedly? Likely, `percentile95` (`~18ms`). This is the value that signifies that 95% of the samples during the benchmark were between this value and 0.

`pctFramesOnTime` and `pctTicksOnTime` denote the percentage of frames and ticks that were delivered "on time". For frames, this means "what percentage of frames occurred every 16ms or less?" For ticks, this means "what percentage of ticks occurred every 1ms (nodejs) or 4ms (browser) or less?" In the above tables, `toDataURL` had 0 ticks and 0 frames arrive on time, while `toBlob` had 100% of frames arrive on time, but only 33% of ticks. These values are a rough estimation, and should only be used relatively. In this benchmark, the comparison is almost unfair because the two APIs are not both asynchronous.

If you look at the [tables for Chrome](/docs/example-output-chrome.txt), you'll see some drastically different results! This speaks to how each browser implements these APIs. Chrome appears to have optimized `toDataURL` more than the `toBlob` API. This makes the final implementation choice difficult, and is representative of the pitfalls of high-performance web development!

Analysis (Graphs)
-----------------

These graphs are a summary. Each tick on the graph does not represent one sampled run; instead, each represents several data samples that have been simplified using "Largest-Triangle-Three-Buckets" (see https://github.com/sveinn-steinarsson/flot-downsample for more information).

If we look at the graphs in Chrome, we can _nearly_ see the various optimizing compilers at work that make our JS fast.

There is a "hump" at the beginning of each graph. This is V8 running the generated bytecode, while watching it to see if it will continue to be executed. Then, we see times begin to eventually cluster around a lower max and min. This is V8 deciding to further optimize the code after seeing that, yes, optimizing will be worth it! 

For a more in-depth description, see the "No Warmup" section in this excellent article about Web Assembly: https://surma.dev/things/js-to-asc/index.html.

[Firefox has similar behavior](/docs/example-output-chrome.txt), although it tends to struggle more with garbage collection. This results in a wobbly graph.
