---
summary: What the Intel Xeon Phi coprocessor is, how you reach it (over SSH, as if it were a separate machine) and what a developer gets: compilers, libraries and #pragma offload.
---

# The Intel® Xeon Phi coprocessor

It has been a year since Intel introduced the first generation of Xeon Phi coprocessors.
So what kind of beast is it? Let's find out.

![Intel Xeon Phi](/assets/blog/intel-xeon-phi/01.jpg)

According to Wikipedia, Xeon Phi is a rebranding of Intel MIC (Intel Many Integrated Core Architecture), a many-core processor architecture Intel developed from its work on Larrabee, the Teraflops Research Chip and the Intel Single-chip Cloud Computer.

The second generation came out in 2013: in their top configuration the Xeon Phi 7120P/7120X coprocessors have 61 cores running 244 threads at 1.23/1.33 GHz (normal/turbo).

The offer sounds especially tempting for developers of multithreaded applications and cluster computing of all sorts, given that a Xeon Phi is a PCI Express card. Take a Xeon, add a couple of Phi cards, and you have yourself a supercomputer. Add a couple of big vendors shipping ready-made systems, [SuperMicro](http://www.supermicro.com/products/nfo/Xeon_Phi.cfm), [Dell](http://www.dell.com/learn/us/en/04/large-business/intel-xeon?c=us&l=en&s=bsd), and it would seem you could even go to production.

![Intel Xeon Phi PCIe card](/assets/blog/intel-xeon-phi/02.jpg)

Now the main question: what does a developer actually get? Let's read the [Quick Start Guide](http://software.intel.com/en-us/articles/intel-xeon-phi-coprocessor-developers-quick-start-guide) on Intel's site:

![Xeon Phi architecture](/assets/blog/intel-xeon-phi/03.png)

So:

1. Take [RHEL 6](http://www.redhat.com/promo/Red_Hat_Enterprise_Linux6/) (kernel 2.6.32-131 or later) or [SLES 11](https://www.suse.com/promo/sle11sp3.html) (kernel 3.0.13-0.27 or later); it seems no other OS will do
2. Install the [latest drivers from Intel](http://software.intel.com/en-us/mic-developer) and update the flash on the Phi itself
3. Start the mpss service
4. Buy, or download for free, the [Software Development Tools](http://software.intel.com/en-us/linux-tool-suites) components and install them
5. Check with the sample (/opt/intel/composerxe/Samples/en\_US/C++/mic\_sample) that the card(s) work correctly
6. Optionally turn on performance statistics collection
7. Check the status (/opt/intel/mic/bin/micsmc)
8. Ready to go

One comment struck me as interesting: "if your Phi(s) hang or stop working, stop, unload and restart the mpss service".

So how do you actually "get to" the coprocessor?

Route no. 1 surprised me a little: log in over SSH and you can run "many common Linux commands". File transfer, accordingly, is over scp.

IP addresses are assigned as 172.31.&lt;coprocessor&gt;.254, or as host aliases mic&lt;coprocessor&gt;.
Like so:

```
weinberg@knf1:~> ssh mic0
[weinberg@knf1-mic0 weinberg]$ hostname
knf1-mic0
[weinberg@knf1-mic0 weinberg]$ cat /etc/issue
Intel MIC Platform Software Stack release 2.1
Kernel 2.6.34.11-g65c0cd9 on an k1om
```

Which raises the question: why would you want to get in there?
It turns out we can run (ssh) our compiled binary right inside the Phi, after uploading it there (scp).

Route no. 2 is through the corresponding mic\* binaries from the driver package.

Finally we get to development. Available to us:

- Compilers
  - Intel C++ Composer XE 2013 for building applications that run on Intel® 64 architecture and Intel® MIC Architecture
  - Intel® Fortran Composer XE 2013 for building applications that run on Intel® 64 architecture and Intel® MIC Architecture
- Libraries packaged with the compilers include:
  - Intel® Math Kernel Library (Intel® MKL) optimized for the Intel® MIC Architecture
  - Intel® Threading Building Blocks (Intel® TBB)
  - Intel® Integrated Performance Primitive (Intel® IPP)
- Libraries packaged separately include:
  - Intel® MPI for Linux\* OS including Intel® Many Integrated Core (Intel® MIC) Architecture
  - Intel® Trace Collector and Analyzer
  - Intel® SDK for OpenCL\* Applications XE 2013 available at: [http://software.intel.com/en-us/vcsource/tools/opencl-sdk-xe](http://software.intel.com/en-us/vcsource/tools/opencl-sdk-xe)

With a pile of compiler, linker and environment flags for actually running things.

The code itself:

```c
float reduction(float *data, int size) {
    float ret = 0.f;
    for (int i=0; i<size; ++i) {
        ret += data[i];
    }
    return ret;
}
```

is optimised into:

```c
float reduction(float *data, int size) {
    float ret = 0.f;
    #pragma offload target(mic) in(data:length(size))
    for (int i=0; i<size; ++i) {
        ret += data[i];
    }
    return ret;
}
```

or even into:

```c
float reduction(float *data, int size) {
    float ret = 0;
    #pragma offload target(mic) in(data:length(size))
    ret = __sec_reduce_add(data[0:size]); //Intel® Cilk™ Plus Extended Array Notation
    return ret;
}
```

Which raises the question: what speed-up should you expect?
Purely logically, on that same Xeon Phi 7120P/7120X with its 61 cores (and, presumably, a set of pipelines in each core), the speed-up on addition should be no less than 61× (thank you, Captain Obvious!).

Besides "speeding up" array addition there is real multithreading support for number crunching and [much more](http://software.intel.com/sites/default/files/article/335818/intel-xeon-phi-coprocessor-quick-start-developers-guide.pdf), OpenMP included.
It is also nice that you can write code that runs both with a Phi and without one.

**What, in my opinion, is missing?**

1. Support for Java and "other languages", along with snippets and perhaps frameworks (not just C/C++ and Fortran)
2. Support for operating systems other than Linux

P.S. The separate question of the price of the "entry-level card", 100 thousand roubles, we will leave outside the scope of this review.

P.P.S. The Phi's direct competitor is [Nvidia Tesla](https://en.wikipedia.org/wiki/Nvidia_Tesla)

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/928.html).*
