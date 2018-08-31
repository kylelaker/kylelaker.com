---
layout: single
title:  "Printing to stdout"
date:   2018-08-30 21:55:00 -0400
---

Recently, I started working on a `cat(1)`-like tool that uses `splice(2)` and
`sendfile(2)`. This tool has been published in a GitHub
[repo](https://github.com/kylelaker/altcat). Throughout the process I learned
plenty more than I expected to about `make(1)` and stdout.

## Motivation

After seeing [fcat](https://github.com/mre/fcat) on GitHub, I became more
interested. In the `splice` and `sendfile` syscalls. These syscalls are able
to copy data between two file descriptors without the need to copy the data
into userspace (as would usually be done by using `read(2)` and `write(2)`).
Interestingly, `splice(2)` *only* works when one of the file descriptors is a
pipe and `sendfile(2)` only works when *neither* file descriptor is a pipe.
Based on fcat, it seems like some magic can be done to make `splice(2)` work
for copying to stdout in all cases, but I wondered if it could be done
more cleanly by using both `splice(2)` and `sendfile(2)`.

Neither of these syscalls supports writing to a file descriptor that was opened
with `O_APPEND` set.


## Starting the project

Initially when testing the project, I was simply compiling by calling `gcc`
directly. I didn't actually intend to share the code, so setting up a whole
project with GNU Make didn't really seem worthwhile. After playing with it for
a bit and getting it to work as I wanted it to, I realized that it's not really
much faster than `cat(1)` in many scenarios, but deciding it was a fun
project, I decided to throw it on GitHub and create a Makefile for it.

The Makefile is rather boring. It sets my favorite `CFLAGS` and compiles and
links the single `.c` file for the project.

It seemed good enough and I figured I was done with this adventure.

## Oops

After finishing the Makefile and being content with the fact it succeeded in
compiling the project, I decided to play around with it and try to actually
use it. I realized that every once in awhile, it would hit the following if-
statement.

{% highlight c %}
if (stdout_append()) {
    fprintf(stderr, "Unable to append to files.\n");
    return EXIT_FAILURE;
}
{% endhighlight %}

`stdout_append()` here does about what you'd expect: it uses `fcntl(2)` to
check the flags on `STDOUT_FILENO` and performs a bitwise `and` operation to
see if `O_APPEND` is set. If it is, we print an error and exit with a failure.

This would last until I would close my current terminal (I use XTerm). When
I opened a new terminal, it would happily work for awhile and then eventually
suddenly stop working.

Around the time I nearly gave up, I realized that this would only happen after
I rebuilt the project. I'd build the project, it wouldn't work, I'd open a
fresh terminal, it'd work, I'd rebuild, and it'd stop. After reading my code
a million times, I started to wonder if there was something about `make(1)`
that was messing with all this. It couldn't be, right? Surely a program can't
change the mode of stdout, and if it can, there's absolutely no way it'd
ever be allowed for that change to remain in effect after the program
terminates, right?

## Wrong

[Apparently](http://git.savannah.gnu.org/cgit/make.git/tree/src/output.c#n493), `make(1)`
does modify the mode of stdout. It performs this operation in order to
ensure that when several jobs are all writing to stdout, none of them cause
issues if the writes overlap; however, `make(1)` is never kind enough to
ensure that append mode is ever unset.

## Setting it back

Clearly the solution would be unset `O_APPEND` for stdout; however, in
some scenarios, the user may have (albeit, invalidly), asked to append to a
file rather than overwrite it. One simple `./altcat in.txt >> out.txt` and a
user could have their file overwritten if `O_APPEND` is removed in all
scenarios.

Luckily, `unistd.h` includes `isatty(3)` which can test whether or not a
particular file descriptor refers to a terminal. In these cases, it is safe to
remove the `O_APPEND` flag. Doing this is just as easy as setting it:

{% highlight c %}
void remove_append(int fd) {
    int flags = fcntl(fd, F_GETFL);
    if (isatty(fd) && flags >= 0) {
        fcntl(fd, F_SETFL, flags ^ O_APPEND);
    }
}
{% endhighlight %}

Rather than using `|`, we just use `^`.

Now `altcat` can print to stdout even after `make(1)` has gone ahead and
made a mess of things. I have no idea whether XTerm or ZSH should do a better
job of cleaning up stdout's mode, but apparently it's something applications
might have to deal with if they can't tolerate appending to file descriptors.
